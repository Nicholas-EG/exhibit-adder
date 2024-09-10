const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function makeCoverPage(name) {
  // set up document 
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
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

run(10)