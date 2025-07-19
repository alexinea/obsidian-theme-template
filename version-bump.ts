import {resolve} from "path";

import {versionBump} from "./src/functions/ManifestUtils";

const packagePath = resolve(__dirname, 'package.json');
const manifestPath = resolve(__dirname, "manifest.json");
const versionsPath = resolve(__dirname, "versions.json");

versionBump(packagePath, manifestPath, versionsPath).then(r => {
    console.log(`✅  Version bump completed`);
}).catch(err => {
    console.error(`❌  An error was be thrown when initializing the version bump: `, err);
});