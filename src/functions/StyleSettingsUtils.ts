import {readdir, readFile} from "fs/promises";
import {resolve} from "path";
import {pathExists, writeFile} from "fs-extra";

async function processStyleSettingsDefinitionFileLines(path: string): Promise<string[]> {
    const content = await readFile(path, 'utf-8');
    const lines = removeComments(content.split('\n'));
    let lastLineWasEmpty = false;

    // process lines starting with # or spaces followed by #
    const firstLine = lines[0];
    if (!/^[ \t]*#/.test(firstLine) && firstLine.trim() !== '') {
        lines.unshift('');
    }

    const processedLines = lines.map((line, index) => {
        const trimmedLine = line.trim();

        // process lines starting with # or spaces followed by #
        if (/^[ \t]*#/.test(line)) {
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

function removeComments(lines: string[]): string[] {
    return lines.filter(line => !/^[ \t]*;/.test(line));
}

export async function generateStyleSettings(srcDir: string, outputFile: string): Promise<[number, number]> {

    const entries = await readdir(srcDir, {withFileTypes: true});

    const sectionDirectories = entries.filter(e => e.isDirectory()).map(d => d.name);

    let sectionTitleCounter = 0;
    let sectionMdFileCounter = 0;
    let combinedContent = '';

    for (const section of sectionDirectories) {
        const sectionDefinition = resolve(srcDir, `${section}.css.md`);

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

        const sectionMdFiles = (await readdir(resolve(srcDir, section))).filter(f => f.endsWith('.css.md'));
        let sectionMdContent = '';

        for (const mdFile of sectionMdFiles) {
            const path = resolve(srcDir, section, mdFile);
            const lines = await processStyleSettingsDefinitionFileLines(path);
            sectionMdContent += lines.join('\n') + '\n\n';
            sectionMdFileCounter++;
        }

        combinedContent += `/* @settings\n\n${sectionTitleContent}\nsettings:\n\n${sectionMdContent}*/\n\n`;
    }

    await writeFile(outputFile, combinedContent, 'utf-8');

    return [sectionTitleCounter, sectionMdFileCounter];
}

export async function watchStyleSettings(srcDir: string, watchAction: (path: string) => void): Promise<number> {

    const entries = await readdir(srcDir, {withFileTypes: true});
    const sectionDirectories = entries.filter(e => e.isDirectory()).map(d => d.name).sort();
    const watchedStyleSettingDefinitionFiles = [];

    let monitoringCounter = 0;

    for (const section of sectionDirectories) {
        const sectionTitleDefinition = resolve(srcDir, `${section}.css.md`);

        if (!await pathExists(sectionTitleDefinition)) {
            console.warn(`⚠️  Section definition file not found: ${sectionTitleDefinition}`);
            continue;
        }

        watchedStyleSettingDefinitionFiles.push(sectionTitleDefinition);
        monitoringCounter++;

        const sectionMdFiles = (await readdir(resolve(srcDir, section))).filter(f => f.endsWith('.css.md')).sort();
        for (const mdFile of sectionMdFiles) {
            const path = resolve(srcDir, section, mdFile);
            watchedStyleSettingDefinitionFiles.push(path);
            monitoringCounter++;
        }
    }

    for (const file of watchedStyleSettingDefinitionFiles) {
        watchAction(file);
    }

    return monitoringCounter;
}