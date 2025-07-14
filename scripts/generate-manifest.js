const fs = require('fs');
const path = require('path');

// 读取 package.json 中的版本号
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));

// 获取版本号
const version = packageJson.version;

// 定义 manifest.json 的内容
const manifest = {
    'name': 'Garden',
    'version': version,
    'minAppVersion': '1.16.0',
    'author': 'alexinea',
    'authorUrl': 'https://github.com/alexinea'
};

// 定义 manifest.json 的路径
const manifestPath = path.resolve(__dirname, '../dist/manifest.json');

// 写入
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`✅ manifest.json generated with version ${version}`);