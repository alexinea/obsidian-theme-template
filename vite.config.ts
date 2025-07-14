import { defineConfig} from "vite";
import { resolve , basename} from "path";
import fs from 'fs-extra';

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        cssCodeSplit: false,
        rollupOptions: {
            input: {
                theme: resolve(__dirname, 'src/scss/index.scss'),
            },
            output: {
                assetFileNames: 'main.css',
            },
        }
    },
    plugins: [
        {
            name: 'css-combiner',
            enforce: 'post',
            apply: 'build',
            async writeBundle(){
                //定义合并的顺序
                const filesToCombine = [
                    resolve(__dirname, 'src/css/license.css'),
                    resolve(__dirname, 'dist/main.css'),
                    resolve(__dirname, 'src/css/style-settings.css'),
                ];

                let combinedContent = '';
                for(const file of filesToCombine){
                    if(await fs.pathExists(file)){
                        const content = await fs.readFile(file, 'utf-8');
                        combinedContent += `/* ${basename(file)} */\n${content}\n\n`;
                    }else{
                        console.warn(`File not found: ${file}`);
                    }
                }

                await fs.writeFile(resolve(__dirname, 'dist/theme.css'), combinedContent, 'utf-8');

                console.log('✅ CSS文件已按指定顺序合并');

                //await fs.remove(resolve(__dirname, 'dist/main.css'));
            },
        },
        {
            name: 'watch-external',
            apply: 'build',
            configureServer(server) {
                const extraFiles = [
                    resolve(__dirname, 'src/css/license.css'),
                    resolve(__dirname, 'src/css/style-settings.css')
                ];

                extraFiles.forEach(file => {
                    server.watcher.add(file);
                });

                server.watcher.on('change', async (change) => {
                    if (extraFiles.includes(change)) {
                        console.log(`🔄 File changed: ${change}`);
                        server.config.plugins.forEach(plugin => {
                            if(plugin.name === 'css-combiner' && plugin.writeBundle) {
                                plugin.writeBundle();
                            }
                        });
                    }
                })
            }
        }
    ],
    css: {
        postcss: {
            plugins: [
                require('postcss-preset-env')({
                    browsers: ['last 2 versions']
                }),
                require('autoprefixer')({
                    overrideBrowserslist: ['last 2 versions']
                })
            ],
        }
    },
    server: {
        watch:{
            usePolling: true,
        },
        port: 3000,
        open: false
    },
});