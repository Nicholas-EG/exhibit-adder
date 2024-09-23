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
  fs.writeFileSync(`./coversheets/cover ${name}.pdf`, await pdfDoc.save());
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
 * @param frontDocument - a string path to the desired document
 * @param rearDocument - a string path to the desired document
 */
async function mergeDocuments(frontDocument, rearDocument) {
  try {
    const frontBinary = fs.readFileSync(frontDocument);
    const frontPDF = await PDFDocument.load(frontBinary);
    const rearBinary = fs.readFileSync(rearDocument);
    const rearPDF = await PDFDocument.load(rearBinary);
    const copiedPages = await frontPDF.copyPages(rearPDF, [...Array(rearPDF.getPageCount()).keys()]);
    copiedPages.forEach((page) => {
      frontPDF.addPage(page);
    })
    fs.writeFileSync('./result.pdf', await frontPDF.save());
  } catch (frontFileDoesNotExist) {
    const rearBinary = fs.readFileSync(rearDocument);
    const rearPDF = await PDFDocument.load(rearBinary);
    fs.writeFileSync('./result.pdf', await rearPDF.save());
  }
}

async function getArticles(urls) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  for (i in urls) {
    await page.goto(`${urls[i]}`, {
      waitUntil: 'networkidle2',
    });
    fs.writeFileSync(`./articles/article ${generateExhibitName(i)}.pdf`, await page.pdf());
  }
  await browser.close();
}

async function cleanFiles(paths) {
  paths.forEach(path => {
    fsPromises.rm(path);
  });
}

async function run(urls) {
  getArticles(urls).then(console.log('done'));
}

/** TESTING */
const urls = [
  'https://www.google.com',
  // 'https://elfaro.net/es/202409/el_salvador/27557/presidencia-ordeno-una-operacion-de-espionaje-contra-periodistas-y-politicos',
  'https://pptr.dev/browsers-api/browsers.candownload/#parameters',
];

// getArticle(urls[1], 'B');
run(urls);
// mergeDocuments('./coversheets/cover A.pdf', './coversheets/cover B.pdf')