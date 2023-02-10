const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const url = require('url');

const baseUrl = 'https://kwork.com/';
const ignoreExternal = false;
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
    $('link[rel="stylesheet"]').each((index, element) => {
        cssFiles.push($(element).attr('href'));
    });

    
    for (const cssFile of cssFiles) {   
        
        console.log(cssFiles)
        const fileUrl = url.resolve(baseUrl, cssFile);
        const fileName = path.basename(fileUrl);
        const fileDirectory = path.dirname(cssFile).startsWith('http') && ignoreExternal ? originalExternalDirectory : originalDirectory;
        console.log(fileUrl);
        const filePath = path.join(fileDirectory, fileName);
        if (!fs.existsSync(path.join(originalPatchDirectory, fileDirectory))) {
            fs.mkdirSync(path.join(originalPatchDirectory, fileDirectory), { recursive: true });}        
        await downloadFile(fileUrl, fileDirectory, filePath);
        const fileDirectoryPatch = path.join(originalPatchDirectory, fileDirectory, path.dirname(cssFile));
        await downloadFile(fileUrl, fileDirectoryPatch, filePath);
    }
    cssFiles = {cssFiles};
    fs.writeFileSync(path.join(originalDirectory, 'cssfiles.json'), JSON.stringify(cssFiles));
}

saveCssJsFiles(baseUrl, ignoreExternal);