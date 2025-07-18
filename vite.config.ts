import {defineConfig} from "vite";
import {basename, resolve} from "path";
import {ensureDir, pathExists, writeFile} from 'fs-extra';
import {readFileSync, writeFileSync} from "fs";
import {readdir, readFile} from "fs/promises";

const isProduction = process.env.NODE_ENV === 'production';
let watchedStyleSettingDefinitionFiles: string[] = [];

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
            async buildStart() {

                if (isProduction) {
                    return;
                }

                try {
                    const sourceDirSeg = 'src/css/style-settings';

                    if (!await pathExists(resolve(__dirname, sourceDirSeg))) {
                        console.warn(`⚠️  Source directory for Style Settings definition files not found: ${sourceDirSeg}`);
                        return;
                    }

                    const entries = await readdir(resolve(__dirname, sourceDirSeg), {withFileTypes: true});
                    const sectionDirectories = entries.filter(e => e.isDirectory()).map(d => d.name).sort();

                    watchedStyleSettingDefinitionFiles = [];
                    let monitoringCounter = 0;

                    for (const section of sectionDirectories) {
                        const sectionTitleDefinition = resolve(__dirname, sourceDirSeg, `${section}.css.md`);

                        if (!await pathExists(sectionTitleDefinition)) {
                            console.warn(`⚠️  Section definition file not found: ${sectionTitleDefinition}`);
                            continue;
                        }

                        watchedStyleSettingDefinitionFiles.push(sectionTitleDefinition);
                        monitoringCounter++;

                        const sectionMdFiles = (await readdir(resolve(__dirname, sourceDirSeg, section))).filter(f => f.endsWith('.css.md')).sort();
                        for (const mdFile of sectionMdFiles) {
                            const path = resolve(__dirname, sourceDirSeg, section, mdFile);
                            watchedStyleSettingDefinitionFiles.push(path);
                            monitoringCounter++;
                        }
                    }

                    for (const file of watchedStyleSettingDefinitionFiles) {
                        this.addWatchFile(file);
                    }

                    console.log(`🔍 Monitoring ${monitoringCounter} Style Setting definition files`, `@ ${new Date().toUTCString()}`);
                } catch (error) {
                    console.error('❌  An error was be thrown when initializing the monitoring Style Setting definition files: ', error);
                }
            },
            async buildEnd() {
                try {
                    const [sectionTitleCounter, sectionMdFileCounter] = await generateStyleSettings();
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
                const outputDir = isProduction ? './' : 'test';
                const themeCssFile = isProduction ? 'main.min.css' : 'main.css';

                const filesToCombine = [
                    resolve(__dirname, 'src/css/license.css'),
                    resolve(__dirname, 'src/css', themeCssFile),
                    resolve(__dirname, 'src/css/plugin-compatibility.css'),
                    resolve(__dirname, 'src/css/style-settings-definition.css'),
                ];

                console.log(`↓ The following documents will be merged in sequence: \n  - ${filesToCombine.map(f => basename(f)).join('\n  - ')}`);

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

                console.log('✅  CSS files combined successfully!  → ' + resolve(__dirname, `${outputDir}/theme.css`));

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
});

async function generateStyleSettings(): Promise<[number, number]> {
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
            const lines = await processStyleSettingsDefinitionFileLines(path);
            sectionMdContent += lines.join('\n') + '\n';
            sectionMdFileCounter++;
        }

        combinedContent += `/* @settings\n\n${sectionTitleContent}\nsettings:\n\n${sectionMdContent}\n*/\n\n`;
    }

    await writeFile(outputFile, combinedContent, 'utf-8');

    return [sectionTitleCounter, sectionMdFileCounter];
}

async function processStyleSettingsDefinitionFileLines(path: string): Promise<string[]> {
    const content = await readFile(path, 'utf-8');
    const lines = content.split('\n');
    let lastLineWasEmpty = false;

    // process lines starting with # or spaces followed by #
    const firstLine = lines[0];
    if(!/^\s*#/.test(firstLine) && firstLine.trim() !== '') {
        lines.unshift('');
    }

    const processedLines = lines.map((line, index) => {
        const trimmedLine = line.trim();

        // process lines starting with # or spaces followed by #
        if (/^\s*#/.test(line)) {
            return line;
        }

        // process empty lines or lines with only spaces
        if (trimmedLine === '') {
            // mark current line as empty
            // do not process immediately, wait for subsequent checks
            lastLineWasEmpty = true;
            return null;
        }

        // process previous line was empty
        if (lastLineWasEmpty) {
            lastLineWasEmpty = false;
            // insert \t- as the last line of consecutive empty lines
            return '\t-';
        }

        // process other lines
        return `\t\t${line}`;
    });

    // filter out null values in the middle
    return processedLines.filter(line => line !== null);
}

function generateManifest() {
    const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
    const manifest = {
        'name': packageJson.obsidian?.name ?? packageJson.name,
        'version': packageJson.obsidian?.version ?? packageJson.version,
        'minAppVersion': packageJson.obsidian?.minAppVersion ?? '1.0.0',
        'author': packageJson.obsidian?.author ?? '',
        'authorUrl': packageJson.obsidian.authorUrl ?? '',
    };

    writeFileSync(
        resolve(__dirname, './manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf-8'
    );

    console.log(`✅  manifest.json generated with version ${manifest.version}`);
}