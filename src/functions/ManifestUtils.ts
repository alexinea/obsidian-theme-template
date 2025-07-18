import {readFileSync, writeFileSync} from "fs";

export function generateManifest(packagePath: string, manifestPath: string) {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const manifest = {
        'name': packageJson.obsidian?.name ?? packageJson.name,
        'version': packageJson.obsidian?.version ?? packageJson.version,
        'minAppVersion': packageJson.obsidian?.minAppVersion ?? '1.0.0',
        'author': packageJson.obsidian?.author ?? '',
        'authorUrl': packageJson.obsidian.authorUrl ?? '',
    };

    writeFileSync(
        manifestPath,
        JSON.stringify(manifest, null, 2),
        'utf-8'
    );

    console.log(`✅  manifest.json generated with version ${manifest.version}`);
}