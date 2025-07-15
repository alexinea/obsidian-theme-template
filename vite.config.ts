import {defineConfig} from "vite";
import {resolve, basename} from "path";
import {readFile, writeFile, ensureDir, pathExists} from 'fs-extra';
import {readFileSync, writeFileSync} from "fs";

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
        // 1, CSS Combiner
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
                }else{
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

        // 2, CSS Minifier
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
        'name': 'Garden',
        'version': packageJson.version,
        'minAppVersion': '1.16.0',
        'author': 'alexinea',
        'authorUrl': 'https://github.com/alexinea'
    };

    writeFileSync(
        resolve(__dirname, 'dist/manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf-8'
    );

    console.log(`✅  manifest.json generated with version ${manifest.version}`);
}