const boldButton = document.getElementById('bold-button');
const italicButton = document.getElementById('italic-button');
const underlineButton = document.getElementById('underline-button');

let currentStyle = {
    bold: false,
    italic: false,
    underline: false
};

boldButton.addEventListener('click', () => {
    currentStyle.bold = !currentStyle.bold;
    boldButton.classList.toggle('active');
    updateTextStyle();
});

italicButton.addEventListener('click', () => {
    currentStyle.italic = !currentStyle.italic;
    italicButton.classList.toggle('active');
    updateTextStyle();
});

underlineButton.addEventListener('click', () => {
    currentStyle.underline = !currentStyle.underline;
    underlineButton.classList.toggle('active');
    updateTextStyle();
});

function updateTextStyle() {
    const textElement = document.getElementById('text-input');
    textElement.style.fontWeight = currentStyle.bold ? 'bold' : 'normal';
    textElement.style.fontStyle = currentStyle.italic ? 'italic' : 'normal';
    textElement.style.textDecoration = currentStyle.underline ? 'underline' : 'none';
}

const { PDFDocument, StandardFonts, rgb } = PDFLib;

async function createPdf(arrayBuffer) {
    const currentPage = l2kdPDFConfigs.currentPage;
    const pageFilter = elementInCanvasArray.filter(element => element.page === currentPage);
    const scale = l2kdPDFConfigs.scale;
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Tải font Noto Sans hỗ trợ Unicode
    const fontBytes = await fetch('https://fonts.gstatic.com/s/notosans/v35/o-0IIpQlx3QUlC5A4PNr5TRASf6M7Q.woff2')
        .then(res => res.arrayBuffer());
    const customFont = await pdfDoc.embedFont(fontBytes);
    
    for (let i = 0; i < pageFilter.length; i++) {
        const element = pageFilter[i];
        const page = pdfDoc.getPage(currentPage - 1);
        
        if (element.type === "image") {
            const imgData = element.imageArrayBuffer;
            const pngImage = await pdfDoc.embedPng(imgData);
            page.drawImage(pngImage, {
                x: element.left / scale,
                y: page.getHeight() - element.top / scale - 38 / scale - element.height / scale,
                width: element.width / scale,
                height: element.height / scale
            });
        } else if (element.type === "text") {
            // Sử dụng font Unicode cho text
            page.drawText(element.content, {
                x: element.left / scale,
                y: page.getHeight() - element.top / scale - 38 / scale,
                size: element.fontSize,
                font: customFont,
                color: getColorFromName(element.textColor)
            });
        }
    }
    
    const pdfBytes = await pdfDoc.save();
    download(pdfBytes, "pdf-lib_modification_example.pdf", "application/pdf");
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
} 