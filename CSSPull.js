const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const url = require('url');

const baseUrl = "https://kwork.ru";
const ignoreExternal = true;
const originalDirectory = 'original';
const originalPatchDirectory = 'original_patch';
const originalExternalDirectory = 'original_external';

async function downloadFile(fileUrl, fileDirectory, filePath) {
    const response = await axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream'
    });
    response.data.pipe(fs.createWriteStream(path.join(fileDirectory, filePath)));
}

async function saveCssJsFiles(baseUrl, ignoreExternal) {
    const html = await axios.get(baseUrl);
    const $ = cheerio.load(html.data);

    const cssFiles = [];
    const jsFiles = [];
    $('link[rel="stylesheet"]').each((index, element) => {
        cssFiles.push($(element).attr('href'));
    });
    $('script[src]').each((index, element) => {
        jsFiles.push($(element).attr('src'));
    });

    for (const cssFile of cssFiles) {
        const fileUrl = url.resolve(baseUrl, cssFile);
        const fileName = path.basename(fileUrl);
        const fileDirectory = path.dirname(cssFile).startsWith('http') && ignoreExternal ? originalExternalDirectory : originalDirectory;
        const filePath = path.join(fileDirectory, fileName);
        await downloadFile(fileUrl, fileDirectory, filePath);
        if(!fs.existsSync(path.join(originalPatchDirectory, fileDirectory, path.dirname(jsFile)))){
            fs.mkdirSync(path.join(originalPatchDirectory, fileDirectory, path.dirname(jsFile)))
        }
        const fileDirectoryPatch = path.join(originalPatchDirectory, fileDirectory, path.dirname(cssFile));
        if (!fs.existsSync(fileDirectoryPatch)) {
            fs.mkdirSync(fileDirectoryPatch, { recursive: true });
        }
        await downloadFile(fileUrl, fileDirectoryPatch, filePath);
    }

    for (const jsFile of jsFiles) {
        const fileUrl = url.resolve(baseUrl, jsFile);
        const fileName = path.basename(fileUrl);
        const fileDirectory = path.dirname(jsFile).startsWith('http') && ignoreExternal ? originalExternalDirectory : originalDirectory;
        const filePath = path.join(fileDirectory, fileName);
        await downloadFile(fileUrl, fileDirectory, filePath);
        
        const fileDirectoryPatch = path.join(originalPatchDirectory, fileDirectory, path.dirname(jsFile));
        if (!fs.existsSync(fileDirectoryPatch)) {
            fs.mkdirSync(fileDirectoryPatch, { recursive: true });
        }
        await downloadFile(fileUrl, fileDirectoryPatch, filePath);
    }

    const cssJsFiles = { cssFiles, jsFiles };
    fs.writeFileSync(path.join(originalDirectory, 'css_js_files.json'), JSON.stringify(cssJsFiles));
}

saveCssJsFiles(baseUrl, ignoreExternal);