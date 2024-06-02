const { glob } = require("glob");
const { mkdirp } = require("mkdirp");
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { rimraf } = require("rimraf");
const sizeOf = require('image-size');
const { execFileSync } = require('child_process');
const ProgressBar = require('cli-progress');

const speed = 15; // GIF帧速率

console.clear();
console.log('XeonSKY.Net | Zip to Gif');
console.log(' ______________________________________________________________');

async function main() {
    await rimraf('./temp');
    mkdirp.sync('./input');
    mkdirp.sync('./output');
    mkdirp.sync('./temp');

    const file = glob.sync('**/*.zip', { cwd: './input' });

    // 创建一个新的进度条实例
    const bar = new ProgressBar.SingleBar({}, ProgressBar.Presets.shades_classic);

    // 启动进度条
    bar.start(file.length, 0);
    for (let index = 0; index < file.length; index++) {
        const element = file[index];
        const tempDirName = uuidv4();
        const tempPath = path.join("./temp", tempDirName);
        const zip = new AdmZip("./input/" + element);
        mkdirp.sync(tempPath);
        zip.extractAllTo(tempPath, true);
        const files = glob.sync('**/*', { cwd: tempPath });
        var ext = null;
        var w = 0, h = 0;
        // 对图片文件进行排序，确保它们在GIF中按正确的顺序播放
        files.sort();
        var arr = "";
        for (let index = 0; index < files.length; index++) {
            const element = files[index];
            const p = path.join(tempPath, element)
            const extname = path.extname(p).toLowerCase();
            const dimensions = sizeOf(p);
            if (ext || w || h) {
                if (extname != ext || dimensions.width != w || dimensions.height != h) {
                    throw "EXT"
                }
            }
            ext = extname;
            w = dimensions.width;
            h = dimensions.height;
            arr += `file ${path.join(__dirname, p)}
`
        }

        fs.writeFileSync(path.join(tempPath, 'db.txt'), arr.replace(/\\/g, '/'));

        const fileName = path.join("./output", path.basename(element, path.extname(element)) + "_p0.gif");

        try {
            execFileSync('ffmpeg', [
                '-r', speed,
                '-f', 'concat',
                '-safe', 0,
                '-i', path.join(__dirname, tempPath, 'db.txt'),
                fileName, '-y'
            ], { stdio: 'pipe' });
        } catch (error) {
            console.error(`Error creating GIF: ${error.message}`);
        }

        bar.update(index + 1);
        await rimraf( tempPath);
    }
}

main();