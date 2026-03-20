const fs = require('fs');
const xml2js = require('xml2js').parseStringPromise;

async function parseExcel() {
    try {
        const basePath = 'C:\\Users\\rlsug\\Downloads\\VSN_Satsang_extracted\\xl';
        
        // Read shared strings
        const ssContent = fs.readFileSync(basePath + '\\sharedStrings.xml', 'utf-8');
        const ssData = await xml2js(ssContent);
        const sharedStrings = ssData.sst.si.map(si => {
            if (si.t) {
                return Array.isArray(si.t) ? si.t[0] : si.t;
            }
            if (si.r) {
                return (Array.isArray(si.r) ? si.r : [si.r]).map(r => Array.isArray(r.t) ? r.t[0] : r.t).join('');
            }
            return '';
        });
        
        console.log('Found', sharedStrings.length, 'shared strings\n');
        
        // Parse sheet 1
        console.log('='.repeat(100));
        console.log('TAB 1: Format#1 - Header Format');
        console.log('='.repeat(100));
        
        const sheet1Content = fs.readFileSync(basePath + '\\worksheets\\sheet1.xml', 'utf-8');
        const sheet1Data = await xml2js(sheet1Content);
        const rows1 = sheet1Data.worksheet.sheetData[0].row;
        
        console.log(`Dimensions: ${rows1.length} rows`);
        rows1.slice(0, 20).forEach((row, idx) => {
            const cells = Array.isArray(row.c) ? row.c : [row.c];
            const values = cells.map(c => {
                if (!c.v) return '';
                const val = Array.isArray(c.v) ? c.v[0] : c.v;
                return !isNaN(val) ? sharedStrings[parseInt(val)] : val;
            });
            console.log(`Row ${idx + 1}: ${values.join(' | ')}`);
        });
        
        console.log('\n' + '='.repeat(100));
        console.log('TAB 2: Format#2 - Detailed Allocation Format');
        console.log('='.repeat(100));
        
        // Parse sheet 2
        const sheet2Content = fs.readFileSync(basePath + '\\worksheets\\sheet2.xml', 'utf-8');
        const sheet2Data = await xml2js(sheet2Content);
        const rows2 = sheet2Data.worksheet.sheetData[0].row;
        
        console.log(`Dimensions: ${rows2.length} rows\n`);
        rows2.slice(0, 25).forEach((row, idx) => {
            const cells = Array.isArray(row.c) ? row.c : [row.c];
            const values = cells.map(c => {
                if (!c.v) return '';
                const val = Array.isArray(c.v) ? c.v[0] : c.v;
                return !isNaN(val) ? sharedStrings[parseInt(val)] : val;
            });
            console.log(`Row ${idx + 1}: ${values.join(' | ')}`);
        });
        
    } catch (err) {
        console.error('Error:', err.message);
    }
}

parseExcel();
