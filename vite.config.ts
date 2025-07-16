import {defineConfig} from "vite";
import {resolve, basename} from "path";
import {writeFile, ensureDir, pathExists} from 'fs-extra';
import {readFileSync, writeFileSync} from "fs";
import {readdir, readFile} from "fs/promises";

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
    root: 'src',
    build: {
        outDir: './css',
        emptyOutDir: false,
        cssCodeSplit: false,
        rollupOptions: {
            input: {
                theme: resolve(__dirname, 'src/scss/index.scss')
            },
            output: {
                assetFileNames: isProduction ? 'main.min.css' : 'main.css'
            }
        },
        minify: isProduction ? 'terser' : false,
        terserOptions: {
            compress: {
                drop_console: isProduction
            }
        }
    },
    plugins: [
        // 1, Style-Settings Definition Combiner
        {
            name: 'style-settings-definition-combiner',
            enforce: 'pre',
            async buildEnd() {
                try {
                    const sourceDirSeg = 'src/css/style-settings';
                    const outputFile = resolve(__dirname, 'src/css/style-settings-definition.css');

                    const entries = await readdir(resolve(__dirname, sourceDirSeg), {withFileTypes: true});

                    const sectionDirectories = entries.filter(e => e.isDirectory()).map(d => d.name);

                    let sectionTitleCounter = 0;
                    let sectionMdFileCounter = 0;
                    let combinedContent = '';

                    for (const section of sectionDirectories) {
                        const sectionDefinition = resolve(__dirname, sourceDirSeg, `${section}.css.md`);

                        if (!await pathExists(sectionDefinition)) {
                            console.warn(`⚠️  Section definition file not found: ${sectionDefinition}`);
                            continue;
                        }

                        let sectionTitleContent = '';
                        try {
                            sectionTitleContent = await readFile(sectionDefinition, 'utf-8');
                            sectionTitleCounter++;
                        } catch (err) {
                            console.error(`❌  Error reading section definition file ${sectionDefinition}:`, err);
                            continue;
                        }

                        const sectionMdFiles = (await readdir(resolve(__dirname, sourceDirSeg, section))).filter(f => f.endsWith('.css.md'));
                        let sectionMdContent = '';

                        for (const mdFile of sectionMdFiles) {
                            const path = resolve(__dirname, sourceDirSeg, section, mdFile);
                            const fileContent = await readFile(path, 'utf-8');

                            const lines = fileContent.split('\n').map(l => {
                                return l.trim() === '' ? '\t-' : `\t\t${l}`;
                            });

                            sectionMdContent += '\t-\n' + lines.join('\n') + '\n';
                            sectionMdFileCounter++;
                        }

                        combinedContent += `/* @settings\n${sectionTitleContent}\nsettings:\n${sectionMdContent}*/\n\n`;
                    }

                    await writeFile(outputFile, combinedContent, 'utf-8');
                    console.log(`✅  Successfully merged ${sectionTitleCounter} sections and ${sectionMdFileCounter} definition files into style-settings-definition.css`)
                } catch (error) {
                    console.error('❌  An error was be thrown when merging CSS files: ', error);
                }
            },
        },

        // 2, CSS Combiner
        {
            name: 'css-combiner',
            enforce: 'post',
            async writeBundle() {
                const outputDir = isProduction ? 'dist' : 'dist_dev';
                const tempCssFile = isProduction ? 'main.min.css' : 'main.css';

                const filesToCombine = [
                    resolve(__dirname, 'src/css/license.css'),
                    resolve(__dirname, 'src/css', tempCssFile),
                    resolve(__dirname, 'src/css/plugin-compatibility.css'),
                ];

                if (isProduction) {
                    console.log(`Included files for production: ${filesToCombine.map(f => basename(f)).join(', ')} and 🏷️style-settings-definition.css`);
                    filesToCombine.push(resolve(__dirname, 'src/css/style-settings-definition.css'));
                } else {
                    console.log(`Included files for development: ${filesToCombine.map(f => basename(f)).join(', ')}`);
                }

                let combinedContent = '';
                for (const file of filesToCombine) {
                    if (await pathExists(file)) {
                        const content = await readFile(file, 'utf-8');
                        combinedContent += `/* ${basename(file)} */\n${content}\n\n`;
                    } else {
                        console.warn(`⚠️  File not found: ${file}`);
                    }
                }

                await ensureDir(resolve(__dirname, outputDir));
                await writeFile(resolve(__dirname, `${outputDir}/theme.css`), combinedContent, 'utf-8');

                console.log('✅  CSS files combined successfully!  --> ' + resolve(__dirname, `${outputDir}/theme.css`));

                if (isProduction) {
                    generateManifest();
                }
            },
        },

        // 3, CSS Minifier
        isProduction ? require('@vitejs/plugin-legacy')({
            renderLegacyChunks: false,
            modernPolyfills: false,
        }) : null,
    ],
    css: {
        postcss: {
            plugins: [
                require('autoprefixer')({
                    overrideBrowserslist: ['last 2 versions']
                })
            ],
        }
    },
    server: {
        watch: {
            usePolling: true,
        },
        port: 3000,
        open: false
    },
});

function generateManifest() {
    const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
    const manifest = {
        'name': packageJson.obsidian?.name ?? packageJson.name,
        'version': packageJson.obsidian?.version ?? packageJson.version,
        'minAppVersion': packageJson.obsidian?.minAppVersion ?? '1.16.0',
        'author': packageJson.obsidian?.author ?? '',
        'authorUrl': packageJson.obsidian.authorUrl ?? '',
    };

    writeFileSync(
        resolve(__dirname, 'dist/manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf-8'
    );

    console.log(`✅  manifest.json generated with version ${manifest.version}`);
}