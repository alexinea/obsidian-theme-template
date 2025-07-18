import {ensureDir, pathExists, writeFile} from "fs-extra";
import {readFile} from "fs/promises";
import {basename, resolve} from "path";


export async function mergeCssFiles(filesToCombine: string[], outputDir: string) {

    console.log(`↓ The following documents will be merged in sequence: \n  - ${filesToCombine.map(f => basename(f)).join('\n  - ')}`);

    const themeCssFile = resolve(outputDir, 'theme.css');

    let combinedContent = '';
    for (const file of filesToCombine) {
        if (await pathExists(file)) {
            const content = await readFile(file, 'utf-8');
            combinedContent += `/* ${basename(file)} */\n${content}\n\n`;
        } else {
            console.warn(`⚠️  File not found: ${file}`);
        }
    }

    await ensureDir(outputDir);
    await writeFile(themeCssFile, combinedContent, 'utf-8');

    console.log('✅  CSS files combined successfully!  → ' + themeCssFile);
}