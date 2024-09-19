const { PDFDocument, StandardFonts } = require('pdf-lib'); // api available at https://pdf-lib.js.org/docs/api/
const fs = require('fs');
const puppeteer = require('puppeteer');

async function makeCoverPage(name) {
  // set up document 
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  page.setFont(timesFont);

  // write on page
  const text = `Exhibit ${name}`;
  const fontSize = 30;
  const textWidth = timesFont.widthOfTextAtSize(text, fontSize);
  const { width, height } = page.getSize();
  page.moveTo((width / 2) - (textWidth / 2), height / 2); 
  page.drawText(text, {size: fontSize});

  // save document
  fs.writeFileSync(`./coversheets/cover ${name}.pdf`, await pdfDoc.save());
}

// the naming convention for exhibit sheets is to name them 'Exhibit A' through 'Exhibit Z'
// then 'Exhibit AA', 'Exhibit BB', etc.  through 'Exhibit ZZ'
// then 'Exhibit AAA', 'Exhibit BBB', etc.
function run(numberOfExhibits) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for(let i = 0; i < numberOfExhibits; i++) {
    let name = '';

    // calculate how many letters will be in the name
    let loops = Math.ceil(i / alphabet.length) + (i % alphabet.length === 0 ? 1 : 0);
    for(let j = 0; j < loops; j++) {

      // calculate which letter to put in the name
      name = alphabet[i % alphabet.length] + name;
    }
    makeCoverPage(name);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// proof of concept, just takes one article and creates one coversheet and merges them together
async function mergeCoverAndExhibit() {
  // TODO: make the article naming convention dynamic
  const uint8array = fs.readFileSync('./articles/test.pdf');
  const pdfDoc = await PDFDocument.load(uint8array);
  // TODO: make the naming convention dynamic
  const name = "A";
  const coverletter = fs.readFileSync(`./coversheets/cover ${name}.pdf`);
  const pdfDoc2 = await PDFDocument.load(coverletter);
  const copiedpages = await pdfDoc2.copyPages(pdfDoc, [...Array(pdfDoc.getPageCount()).keys()]);
  for(i in copiedpages) {
    pdfDoc2.addPage(copiedpages[i]);
  }
  fs.writeFileSync('./result.pdf', await pdfDoc2.save());
}

async function getExhibits() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.google.com/?client=safari', {
    waitUntil: 'networkidle2',
  });
  await page.pdf({
    path: './articles/test.pdf',
  });
  await browser.close();
}

/** TESTING */
getExhibits().then(() => { 
  run(1); 
  mergeCoverAndExhibit(); 
});