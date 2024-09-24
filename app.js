const { PDFDocument, StandardFonts } = require('pdf-lib'); // api available at https://pdf-lib.js.org/docs/api/
const fs = require('fs');
const fsPromises = require('fs/promises');
const puppeteer = require('puppeteer');

async function makeCoverPage(name) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  page.setFont(timesFont);
  const text = `Exhibit ${name}`;
  const fontSize = 30;
  const textWidth = timesFont.widthOfTextAtSize(text, fontSize);
  const { width, height } = page.getSize();
  page.moveTo((width / 2) - (textWidth / 2), height / 2);
  page.drawText(text, { size: fontSize });
  // return await pdfDoc.save();
  const uInt8Array = await pdfDoc.save();
  return uInt8Array;
}

/***
 * the naming convention for exhibit sheets is to name them 'Exhibit A' through 'Exhibit Z'
 * then 'Exhibit AA', 'Exhibit BB', etc.  through 'Exhibit ZZ'
 * then 'Exhibit AAA', 'Exhibit BBB', etc. 
 */
function generateExhibitName(exhibitNumber) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let name = '';
  let numberOfLettersInName = Math.ceil(exhibitNumber / alphabet.length) + (exhibitNumber % alphabet.length === 0 ? 1 : 0);
  for (let j = 0; j < numberOfLettersInName; j++) {
    name = alphabet[exhibitNumber % alphabet.length] + name;
  }
  return name;
}

/***
 * @param frontPDF - a PDFDocument object
 * @param rearPDF - a PDFDocument object
 */
async function mergeDocuments(frontPDF, rearPDF) {
    const copiedPages = await frontPDF.copyPages(rearPDF, [...Array(rearPDF.getPageCount()).keys()]);
    copiedPages.forEach((page) => {
      frontPDF.addPage(page);
    })
}

async function getArticle(url) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(`${url}`, {
    waitUntil: 'networkidle2',
  });
  const uInt8Array = await page.pdf();
  await browser.close();
  return uInt8Array;
}

async function cleanFiles(paths) {
  paths.forEach(path => {
    fsPromises.rm(path);
  });
}

async function run(urls) {
  const result = await PDFDocument.create();
  for (i in urls) {
    const name = generateExhibitName(i);
    const cover = await PDFDocument.load(await makeCoverPage(name));
    const article = await PDFDocument.load(await getArticle(urls[i]));
    mergeDocuments(result, cover);
    mergeDocuments(result, article);
  }
  fs.writeFileSync('./result.pdf', await result.save());
}

/** TESTING */
const urls = [
  'https://www.google.com',
  'https://elfaro.net/es/202409/el_salvador/27557/presidencia-ordeno-una-operacion-de-espionaje-contra-periodistas-y-politicos',
  'https://pptr.dev/browsers-api/browsers.candownload/#parameters',
];

run(urls);