import fs = require('fs');
import path = require('path');
import { execSync } from 'child_process';
import * as AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import imageSize from 'image-size';

const speed = 15; // GIF帧速率

console.clear();
console.log('XEonSKY Studio | Zip to Gif');
console.log(' ______________________________________________________________');

const config = {
    fps: 15,
    dir: {
        input: "./data/input",
        output: "./data/output",
        temp: "./data/.temp",
    }
}

const inputPath = path.join(process.cwd(), config.dir.input);
const outputPath = path.join(process.cwd(), config.dir.output);
const tempPath = path.join(process.cwd(), config.dir.temp);

const fileList: string[] = [];

function install() {
    if (fs.existsSync(tempPath)) {
        fs.rmSync(tempPath, { recursive: true, force: true });
    }
    fs.mkdirSync(inputPath, { recursive: true });
    fs.mkdirSync(outputPath, { recursive: true });
    fs.mkdirSync(tempPath, { recursive: true });
    const file = fs.globSync(path.join(inputPath, "*.zip"));
    for (const item of file) {
        fileList.push(item)
    }
}

function main() {
    for (const item of fileList) {
        const uuid = uuidv4();
        const tempItemPath = path.join(tempPath, uuid);
        const zip = new AdmZip(item);
        
        fs.mkdirSync(tempItemPath);
        zip.extractAllTo(tempItemPath, true);
        const files = fs.readdirSync(tempItemPath).sort(); // 同步读取并排序
        var ext = null;
        var w = 0, h = 0;
        var arr = "";
        for (let index = 0; index < files.length; index++) {
            const element = files[index];
            const p = path.join(tempItemPath, element);
            const extname = path.extname(p).toLowerCase();
            const buffer = fs.readFileSync(p);
            const dimensions = imageSize(buffer);
            if (ext || w || h) {
                if (extname !== ext || dimensions.width !== w || dimensions.height !== h) {
                    throw new Error("Image dimensions or format mismatch.");
                }
            }
            ext = extname;
            w = dimensions.width;
            h = dimensions.height;
            arr += `file ${p.replace(/\\/g, '/')}\n`;
        }

        fs.writeFileSync(path.join(tempItemPath, 'db.txt'), arr);

        const fileName = path.join(outputPath, path.basename(item, path.extname(item)) + "_p0.gif");

        try {
            execSync(`ffmpeg -r ${speed} -f concat -safe 0 -i "${path.join(tempItemPath, 'db.txt')}" "${fileName}" -y`);
        } catch (error: any) {
            console.error(`Error creating GIF: `, error);
        }
        if (fs.existsSync(tempItemPath)) {
            fs.rmSync(tempItemPath, { recursive: true, force: true });
        }
    }
    console.log("Success");

}

install();
main();