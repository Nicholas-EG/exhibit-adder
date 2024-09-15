const { PDFDocument, StandardFonts } = require('pdf-lib'); // api available at https://pdf-lib.js.org/docs/api/
const fs = require('fs');

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


// proof of concept, just takes one article and creates one coversheet and merges them together
async function mergeCoverAndExhibit(num) {
  // TODO: make the article naming convention dynamic
  const uint8array = fs.readFileSync('./articles/test.pdf');
  const pdfDoc = await PDFDocument.load(uint8array);
  run(num);
  setTimeout(() => {console.log("check");
  }, "2000");
  /** FIXME: the line below generates an error if the coversheet is newly created. fs is unable to find the coversheet.
   *  Possible that the file is not fully loaded when run exits, so fs is unable to find it. Possible fix would be
   *  to add a short sleep() period right after run to give the computer time to finalize placing the docs.
   */
  // TODO: make the naming convention dynamic
  const coverletter = fs.readFileSync('./coversheets/cover A.pdf');
  const pdfDoc2 = await PDFDocument.load(coverletter);
  const copiedpages = await pdfDoc2.copyPages(pdfDoc, [...Array(pdfDoc.getPageCount()).keys()]);
  for(i in copiedpages) {
    pdfDoc2.addPage(copiedpages[i]);
  }
  fs.writeFileSync('./result.pdf', await pdfDoc2.save());
}

mergeCoverAndExhibit(1);