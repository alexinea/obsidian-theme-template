import {readFileSync, writeFileSync} from "fs";
import {pathExists} from "fs-extra";

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

export async function versionBump(
    packagePath: string,
    targetManifestPath: string,
    versionsPath: string) {

    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const targetVersion = packageJson.obsidian?.version ?? packageJson.version;

    let minAppVersion = packageJson.obsidian?.minAppVersion ?? '1.0.0';

    // read minAppVersion from manifest.json if it exists
    if (await pathExists(targetManifestPath)) {
        let manifest = JSON.parse(readFileSync(targetManifestPath, 'utf-8'));

        minAppVersion = manifest.minAppVersion;

        manifest.version = targetVersion;

        writeFileSync(
            targetManifestPath,
            JSON.stringify(manifest, null, 2),
            'utf-8'
        );

        console.log(`✅  manifest.json updated with version ${targetVersion}`);
    } else {
        generateManifest(packagePath, targetManifestPath);
    }

    // update versions.json with target version and minAppVersion from manifest.json
    let versions = JSON.parse(readFileSync(versionsPath, 'utf-8'));
    versions[targetVersion] = minAppVersion;
    writeFileSync(versionsPath, JSON.stringify(versions, null, '\t'), 'utf-8');

    console.log(`✅  versions.json add with version ${targetVersion} and minAppVersion ${minAppVersion}`);
}
