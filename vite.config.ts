import {defineConfig} from "vite";
import {resolve} from "path";
import {pathExists} from 'fs-extra';

import {generateManifest} from "./src/functions/ManifestUtils";
import {generateStyleSettings, watchStyleSettings} from "./src/functions/StyleSettingsUtils";
import {mergeCssFiles} from "./src/functions/CssCombiningUtils";

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
            async buildStart() {

                if (isProduction) {
                    return;
                }

                try {
                    const sourceDirSeg = 'src/css/style-settings';
                    const sourceDir = resolve(__dirname, sourceDirSeg);

                    if (!await pathExists(sourceDir)) {
                        console.warn(`⚠️  Source directory for Style Settings definition files not found: ${sourceDirSeg}`);
                        return;
                    }

                    const monitoringCounter = await watchStyleSettings(sourceDir, this.addWatchFile);

                    console.log(`🔍 Monitoring ${monitoringCounter} Style Setting definition files`, `@ ${new Date().toUTCString()}`);
                } catch (error) {
                    console.error('❌  An error was be thrown when initializing the monitoring Style Setting definition files: ', error);
                }
            },
            async buildEnd() {
                try {
                    const [sectionTitleCounter, sectionMdFileCounter] = await generateStyleSettings(
                        resolve(__dirname, 'src/css/style-settings'),                // Source directory
                        resolve(__dirname, 'src/css/style-settings-definition.css')  // Output file
                    );
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

                await mergeCssFiles(
                    filesToCombine,                             // Files to combine
                    resolve(__dirname, outputDir));             // Output directory

                if (isProduction) {
                    generateManifest(
                        resolve(__dirname, 'package.json'),     // Package file path
                        resolve(__dirname, 'manifest.json')     // Manifest file path
                    );
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
