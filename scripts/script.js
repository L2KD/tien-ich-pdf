var url = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf';
$(function () {
    const { degrees, PDFDocument, rgb, StandardFonts } = PDFLib;

    let l2kdPDFData = null; // Current pdf loaded
    let l2kdPDFByteArrayData = null;
    let pagePositionArray = [];
    let elementInCanvasArray = [];
    let elementAdded = [];
    let elementAddedFiltered = [];
    let pdfFile = null;
    const l2kdPDFDefaultConfigs = {
        scale: 1, // default
        totalPage: 1,
        currentPage: 1,
        pageArray: [],
        signatureArray: [],
        currentSignImageBase64Data: null
    }
    let l2kdPDFConfigs = {...l2kdPDFDefaultConfigs};
    let l2kdPDFPageAsImage = [];

    // Loaded via <script> tag, create shortcut to access PDF.js exports.
    var PDFJS = window['pdfjs-dist/build/pdf'];
    // The workerSrc property shall be specified.
    PDFJS.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

    $("#top-menu-button-upload-pdf").click(function () {
        $("#choose-pdf").click();
    });

    $("#choose-pdf").change(function (event) {
        const file = event.target.files[0];
        pdfFile = file;
        console.log(file);
        loadFileToPdf(file);
    });

    // $("#top-menu-button-upload-image").text("Insert");

    // Modal handling
    const modal = document.getElementById("insert-modal");
    const closeBtn = document.getElementsByClassName("close")[0];
    const insertOptions = document.querySelectorAll(".insert-option");
    const textInputContainer = document.getElementById("text-input-container");
    const insertConfirmBtn = document.getElementById("insert-confirm");

    $("#top-menu-button-upload-image").click(function () {
        if (l2kdPDFData !== null) {
            modal.style.display = "block";
        } else {
            alert("Chưa chọn tập tin pdf");
            $("#choose-pdf").click();
        }
    });

    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    insertOptions.forEach(option => {
        option.addEventListener("click", function() {
            // Uncheck all radio buttons
            document.querySelectorAll('input[name="insert-type"]').forEach(radio => {
                radio.checked = false;
            });
            
            // Check the clicked option's radio button
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;

            // Show/hide text input based on selection
            if (radio.value === "text") {
                textInputContainer.style.display = "block";
            } else {
                textInputContainer.style.display = "none";
            }
        });
    });

    insertConfirmBtn.onclick = function() {
        const selectedType = document.querySelector('input[name="insert-type"]:checked');
        if (!selectedType) {
            alert("Vui lòng chọn loại nội dung");
            return;
        }

        if (selectedType.value === "image" || selectedType.value === "stamp") {
            $("#choose-image").click();
        } else if (selectedType.value === "text") {
            const textInput = document.getElementById("text-input");
            const text = textInput.value.trim();
            if (!text) {
                alert("Vui lòng nhập nội dung text");
                return;
            }
            addTextElement(text);
        }

        modal.style.display = "none";
        textInputContainer.style.display = "none";
        document.getElementById("text-input").value = "";
        document.querySelectorAll('input[name="insert-type"]').forEach(radio => {
            radio.checked = false;
        });
    }

    function addTextElement(text) {
        const currentPage = l2kdPDFConfigs.currentPage;
        const fontFamily = document.getElementById("font-family").value;
        const fontSize = parseInt(document.getElementById("font-size").value);
        const textColor = document.getElementById("text-color").value;
        
        // Thêm text vào elementInCanvasArray
        elementInCanvasArray.push({
            idSign: new Date().getTime(),
            type: "text",
            content: text,
            fontFamily: fontFamily,
            fontSize: fontSize,
            textColor: textColor,
            top: 300,
            left: 300,
            page: currentPage,
            width: 200,
            height: 30
        });

        // Cập nhật lại canvas để hiển thị text
        loadElementInCanvas();
    }

    $("#top-menu-input-page").click(function () {
        $(this).select();
    });

    $("#top-menu-input-page").change(function () {
        const pageNumber = Number($(this).val());
        if (pageNumber > 0 && pageNumber <= l2kdPDFConfigs.totalPage) {
            renderPage(pageNumber);
        }
    });

    function initPdfInfo() {
        $("#top-menu-input-page").val(l2kdPDFConfigs.currentPage);
        $("#top-menu-page-nums-total").val(l2kdPDFConfigs.totalPage);
    }

    function renderPage(pageNumber) {
        if (l2kdPDFData !== null) {
            const l2kdPDFPdfElement = $("#l2kd-plugin-pdf");
            l2kdPDFPdfElement.children().remove(); // empty element before load pages
            l2kdPDFPdfElement.append('<div id="l2kd-plugin-pdf-viewer-' + pageNumber + '"></div>');
            l2kdPDFData.getPage(pageNumber).then(function (page) {
                const viewport = page.getViewport({scale: l2kdPDFConfigs.scale});
                const defaultViewport = page.getViewport(1);

                // const pdfViewport = page.getViewport(1 / 72 * l2kdPDFDPI);
                const pdfViewport = viewport;
                const l2kdPDFCanvasId = 'l2kd-plugin-canvas-' + pageNumber;
                const l2kdPDFViewerElement = $("#l2kd-plugin-pdf-viewer-" + pageNumber);
                l2kdPDFViewerElement.append('<canvas id="' + l2kdPDFCanvasId + '" class="l2kd-plugin-pdf-viewport"/>');

                const l2kdPDFCanvasElement = document.getElementById(l2kdPDFCanvasId);
                const l2kdPDFContext = l2kdPDFCanvasElement.getContext('2d');
                l2kdPDFCanvasElement.height = pdfViewport.height;
                l2kdPDFCanvasElement.width = pdfViewport.width;

                l2kdPDFViewerElement.css("width", pdfViewport.width);
                // l2kdPDFViewerElement.css("box-shadow", "rgba(6, 24, 44, 0.4) 0px 0px 0px 2px, rgba(6, 24, 44, 0.65) 0px 4px 6px -1px, rgba(255, 255, 255, 0.08) 0px 1px 0px inset");
                l2kdPDFViewerElement.css("box-shadow", "rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px");
                l2kdPDFViewerElement.addClass("l2kd-plugin-pdf-viewer");

                var l2kdPDFRenderContext = {
                    canvasContext: l2kdPDFContext,
                    viewport: pdfViewport
                };
                const l2kdPDFRenderTask = page.render(l2kdPDFRenderContext);
                l2kdPDFRenderTask.promise.then(async function () {
                    console.log("page " + pageNumber + " rendered");
                    $("#top-menu-input-page").val(pageNumber);
                    $("#l2kd-empty-pdf").css("display",  "none");
                });
            }).then(function () {
                loadElementInCanvas();
            });
        }
    }

    async function loadPdf(file) {
        const loadingTask = PDFJS.getDocument(file);
        await loadingTask.promise.then(function (data) {
            l2kdPDFData = data;
            l2kdPDFConfigs.totalPage = data.numPages;
            l2kdPDFConfigs.currentPage = 1;
            initPdfInfo();
            renderPage(l2kdPDFConfigs.currentPage);
            convertPageToImage(data);
        });
    }

    async function convertPageToImage(data) {
        for (let i = 0; i < data.numPages; i++) {
            const page = await data.getPage(i + 1);
            const viewport = page.getViewport({scale: 1.0});
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            await page.render(renderContext).promise;
            // const base64Image = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]; // Extract base64 part
            const base64Image = canvas.toDataURL('image/jpeg', 0.5).split(',')[1]; // Extract base64 part
            l2kdPDFPageAsImage.push({
                width: viewport.width,
                height: viewport.height,
                base64: base64Image
            });
        }
        console.log(l2kdPDFPageAsImage);
    }

    $("#top-menu-button-download-compress").click(function () {
        downloadCompressFile();
    });
    async function downloadCompressFile() {
        const pdfDoc = await PDFDocument.create();
        for (let i = 0; i < l2kdPDFPageAsImage.length; i++) {
            const imageData = l2kdPDFPageAsImage[i];
            const page = pdfDoc.addPage();
            const jpgImage = await pdfDoc.embedJpg(imageData.base64);
            page.drawImage(jpgImage, {
                x: 0,
                y: 0,
                width: imageData.width,
                height: imageData.height
            });
        }
        const pdfBytes = await pdfDoc.save();
        const originalFileName = pdfFile.name.replaceAll('.pdf', '').replaceAll('.PDF', '');
        const compressedFileName = originalFileName + '_compressed.pdf';
        download(pdfBytes, compressedFileName, "application/pdf");
    }

    /**
     * Khởi tạo phần từ pdf để xem
     * @param pdfFile file pdf cần hiển thị
     * @returns {Promise<void>}
     */
    async function renderPdfL2KDPlugin(pdfFile) {
        const l2kdPDFPdfElement = $("#l2kd-plugin-pdf");
        l2kdPDFPdfElement.children().remove(); // empty element before load pages
        if (pagePositionArray.length > 0) {
            pagePositionArray = [];
        }

        const pages = pdfFile.numPages;
        let currentP = 0;
        let temp = 0;
        for (let i = 1; i <= pages; i++) {
        }
        l2kdPDFPdfElement.append('<div style="height: 100px"></div>');
    }

    async function getBase64(file) {
        var reader = new FileReader();
        let result;
        reader.onload = function () {
            console.log(reader.result);
            result = reader.result;
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
        await reader.readAsDataURL(file);
        return result;
    }

    async function loadFileToPdf(file) {
        //Step 2: Read the file using file reader
        let fileReader = new FileReader();
        fileReader.onload = function () {
            const result = new Uint8Array(fileReader.result);
            loadPdf(result);
            l2kdPDFByteArrayData = new Uint8Array(fileReader.result);
        };
        //Step 3:Read the file as ArrayBuffer
        await fileReader.readAsArrayBuffer(file);
    }

    $("#top-menu-button-first-page").click(function () {
        renderPage(1);
        l2kdPDFConfigs.currentPage = 1;
    });
    $("#top-menu-button-previous-page").click(function () {
        const currentPage = l2kdPDFConfigs.currentPage;
        if (currentPage > 1) {
            renderPage(currentPage - 1);
            l2kdPDFConfigs.currentPage = currentPage - 1;
        }
    });
    $("#top-menu-button-next-page").click(function () {
        const currentPage = l2kdPDFConfigs.currentPage;
        const totalPage = l2kdPDFConfigs.totalPage;
        if (currentPage < totalPage) {
            renderPage(currentPage + 1);
            l2kdPDFConfigs.currentPage = currentPage + 1;
        }
    });
    $("#top-menu-button-last-page").click(function () {
        const totalPage = l2kdPDFConfigs.totalPage;
        renderPage(totalPage);
        l2kdPDFConfigs.currentPage = totalPage;
    });
    $("#top-menu-button-zoom-in").click(function () {
        const scale = l2kdPDFConfigs.scale;
        const currentPage = l2kdPDFConfigs.currentPage;
        if (scale > 0.5) {
            l2kdPDFConfigs.scale = Number((scale - 0.1).toFixed(2));
            renderPage(currentPage);
        }
    });
    $("#top-menu-button-zoom-out").click(function () {
        const scale = l2kdPDFConfigs.scale;
        const currentPage = l2kdPDFConfigs.currentPage;
        if (scale < 2) {
            l2kdPDFConfigs.scale = Number((scale + 0.1).toFixed(2));
            renderPage(currentPage);
        }
    });

    $("#top-menu-button-share").click(async function () {
       const sharePopUpElement = $("#share-popup");
       if (sharePopUpElement.length > 0) {
           sharePopUpElement.remove();
       } else {
           await $("body").append(SHARE_POPUP_ELEMENT);
           const url = window.location.href;
           $("#share-popup-input").val(url);
           var qrcode = new QRCode("share-popup-qr", {
               text: url,
               width: 120,
               height: 120,
               colorDark : "#3E3630",
               colorLight : "#ffffff",
               correctLevel : QRCode.CorrectLevel.H
           });
           qrcode.clear(); // clear the code.
           qrcode.makeCode(url);
           $("#share-input-wrapper").mouseenter(function () {
               $("#share-popup-button-copy").css("display", "block");
           })
           $("#share-input-wrapper").mouseleave(function () {
               $("#share-popup-button-copy").css("display", "none");
           })
           $("#share-popup-button-copy").click(function () {
               $("#share-popup-input").select();
               navigator.clipboard.writeText(url);
           })
           $("#share-popup-button-close").click(function () {
               const sharePopUpElement = $("#share-popup");
               if (sharePopUpElement.length > 0) {
                   sharePopUpElement.remove();
               }
           })
       }
    });

    async function loadElementInCanvas() {
        const l2kdPluginElement = $("#l2kd-plugin-pdf");
        if (l2kdPluginElement.length > 0) {
            $(".l2kd-plugin-element-wrapper").remove();
            const currentPage = l2kdPDFConfigs.currentPage;
            const pageFilter = elementInCanvasArray.filter(element => element.page === currentPage);
            if (pageFilter.length > 0) {
                for (let i = 0; i < pageFilter.length; i++) {
                    const element = pageFilter[i];
                    let elementInCanvasElement;

                    if (element.type === "image") {
                        elementInCanvasElement = '' +
                            '<div class="l2kd-plugin-element-wrapper" id="l2kd-plugin-element-' + element.idSign + '" style="top: ' + element.top + 'px; left: ' + element.left + 'px; position: absolute">' +
                            '   <div class="l2kd-plugin-element-button-wrapper">' +
                            '       <div class="l2kd-plugin-element-button" id="l2kd-plugin-element-button-' + element.idSign + '" data-id-sign="' + element.idSign + '">' +
                            '           <i class="fa fa-times" aria-hidden="true"></i>' +
                            '       </div>' +
                            '   </div>' +
                            '   <div class="smartcav2-plugin-signature" id="l2kd-plugin-element-resize-' + element.idSign + '" style="width: ' + element.width + 'px; height: ' + element.height + 'px;">' +
                            '       <img src="' + element.imageSource + '" />' +
                            '   </div>' +
                            '</div>';
                    } else if (element.type === "text") {
                        elementInCanvasElement = '' +
                            '<div class="l2kd-plugin-element-wrapper" id="l2kd-plugin-element-' + element.idSign + '" style="top: ' + element.top + 'px; left: ' + element.left + 'px; position: absolute">' +
                            '   <div class="l2kd-plugin-element-button-wrapper">' +
                            '       <div class="l2kd-plugin-element-button" id="l2kd-plugin-element-button-' + element.idSign + '" data-id-sign="' + element.idSign + '">' +
                            '           <i class="fa fa-times" aria-hidden="true"></i>' +
                            '       </div>' +
                            '   </div>' +
                            '   <div class="text-element" id="l2kd-plugin-element-resize-' + element.idSign + '" style="width: ' + element.width + 'px; height: ' + element.height + 'px; font-family: ' + element.fontFamily + '; font-size: ' + element.fontSize + 'px; color: ' + element.textColor + ';">' +
                            '       <span>' + element.content + '</span>' +
                            '   </div>' +
                            '</div>';
                    }

                    $("#l2kd-plugin-pdf-viewer-" + element.page).append(elementInCanvasElement);

                    $("#l2kd-plugin-element-button-" + element.idSign).click(async function() {
                        const idSign = $(this).attr("data-id-sign");
                        const listAdded = elementAdded;
                        const listInCanvas = elementInCanvasArray;
                        elementAdded = listAdded.filter(el => (el.idSign + "") !== idSign);
                        elementAddedFiltered = elementAddedFiltered.filter(el => (el.idSign + "") !== idSign);
                        elementInCanvasArray = listInCanvas.filter(el => (el.idSign + "") !== idSign);
                        const elementInCanvasElement = document.getElementById("l2kd-plugin-element-" + idSign);
                        if (elementInCanvasElement) {
                            elementInCanvasElement.remove();
                        }
                    });

                    await $("#l2kd-plugin-element-" + element.idSign).draggable({
                        containment: "#l2kd-plugin-canvas-" + element.page,
                        stop: function (event, ui) {
                            const idElement = ui.helper[0].getAttribute("id");
                            const idSign = idElement.replaceAll("l2kd-plugin-element-", "");
                            const position = ui.position;
                            const findIndex = elementInCanvasArray.findIndex(sig => (sig.idSign + "") === idSign);
                            if (findIndex >= 0) {
                                elementInCanvasArray[findIndex].top = position.top;
                                elementInCanvasArray[findIndex].left = position.left;
                            }
                        }
                    });

                    await $("#l2kd-plugin-element-resize-" + element.idSign).resizable({
                        resize: function (event, ui) {
                            const idElement = ui.helper[0].getAttribute("id");
                            const idSign = idElement.replaceAll("l2kd-plugin-element-resize-", "");
                            const size = ui.size;
                            const findIndex = elementInCanvasArray.findIndex(sig => (sig.idSign + "") === idSign);
                            if (findIndex >= 0) {
                                elementInCanvasArray[findIndex].width = size.width;
                                elementInCanvasArray[findIndex].height = size.height;
                            }
                            $(this).parent().css({width: size.width});
                        }
                    });
                }
            }
        }
    }

    $("#top-menu-button-download-pdf").click(async function () {
        if (pdfFile === null) {
            alert("Chưa chọn file pdf và ảnh cần chèn");
            $("#choose-pdf").click();
            return;
        }

        //Step 2: Read the file using file reader
        let fileReader = new FileReader();
        fileReader.onload = function () {
            const result = new Uint8Array(fileReader.result);
            createPdf(result);
        };
        //Step 3:Read the file as ArrayBuffer
        await fileReader.readAsArrayBuffer(pdfFile);
    });

    async function createPdf(arrayBuffer) {
        const currentPage = l2kdPDFConfigs.currentPage;
        const pageFilter = elementInCanvasArray.filter(element => element.page === currentPage);
        const scale = l2kdPDFConfigs.scale;
        // const pdfDoc = await PDFDocument.load(arrayBuffer);

        const pdfDoc = await PDFDocument.load(arrayBuffer);
        pdfDoc.registerFontkit(fontkit);

        const fontBytes = await fetch('./resources/NotoSans-Regular.ttf').then(res => res.arrayBuffer());
        const customFont = await pdfDoc.embedFont(fontBytes, { subset: true });
        
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
                // Thêm text vào PDF với các thuộc tính đã chọn
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

    function getColorFromName(colorName) {
        switch(colorName) {
            case 'black': return rgb(0, 0, 0);
            case 'red': return rgb(1, 0, 0);
            case 'blue': return rgb(0, 0, 1);
            case 'green': return rgb(0, 1, 0);
            default: return rgb(0, 0, 0);
        }
    }

    const SHARE_POPUP_ELEMENT = '' +
        '<div id="share-popup" class="share-popup-wrapper">' +
        '   <div class="share-popup-main">' +
        '       <div class="share-popup-body">' +
        '           <div class="share-popup-scanner-wrapper">' +
        '               <div class="share-popup-button-scanner">' +
        '                   <p>scan me</p>' +
        '                   <i></i>' +
        '                   <div id="share-popup-qr" class="share-popup-qr"></div>' +
        '                   <span></span>' +
        // '                   <img  height="30px" style="margin-top: 5px;margin-left: -20px;position: absolute;"/>' +
        '               </div>' +
        '               <i class="fa fa-hand-o-right" style="margin-left: 13px; font-size: 30px; color: rgb(167, 48, 57)" aria-hidden="true"></i>' +
        '               <lottie-player src="./resources/animation_phone_scanner.json" background="Transparent" speed="1" style="width: 200px; height: 200px; margin-top: -55px;" direction="1" mode="normal" loop autoplay></lottie-player>' +
        '           </div>' +
        '           <div class="share-input-wrapper" id="share-input-wrapper">' +
        '               <input id="share-popup-input" readonly/>' +
        '               <button id="share-popup-button-copy" title="Sao chép đường dẫn" style="display: none"><i class="fa fa-clipboard" aria-hidden="true"></i></button>' +
        '           </div>' +
        '           <div class="share-footer-wrapper">' +
        '               <button id="share-popup-button-close" title="Sao chép đường dẫn" >' +
        '                   <i class="fa fa-close" aria-hidden="true"></i>' +
        '                   <span>Đóng</span>' +
        '               </button>' +
        '           </div>' +
        '       </div>' +
        '   </div>' +
        '</div>'

    $("#choose-image").change(async function (event) {
        const file = event.target.files[0];
        var reader = new FileReader();
        reader.onload = function () {
            let base64 = reader.result;
            const imageElement = document.createElement("img");
            imageElement.src = base64;
            imageElement.onload = function handleLoad() {
                const width = imageElement.width;
                const height = imageElement.height;
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.height = height;
                canvas.width = width;
                ctx.drawImage(imageElement, 0, 0);

                const selectedType = document.querySelector('input[name="insert-type"]:checked');
                if (!selectedType) {
                    alert("Vui lòng chọn loại nội dung");
                    return;
                }

                if (selectedType.value === "stamp") {
                    var imgd = ctx.getImageData(0, 0, width, height),
                        pix = imgd.data,
                        newColor = {r:0,g:0,b:0, a:0};
                    for (var i = 0, n = pix.length; i <n; i += 4) {
                        var r = pix[i],
                            g = pix[i+1],
                            b = pix[i+2];
                        if(!(r >= 100 && g <= 150)){
                            // Change the white to the new color.
                            pix[i] = newColor.r;
                            pix[i+1] = newColor.g;
                            pix[i+2] = newColor.b;
                            pix[i+3] = newColor.a;
                        } else if (r >= 100 && g <= 150) {
                            pix[i] = 255;
                            pix[i+1] = 0;
                            pix[i+2] = 0;
                        }
                    }
                    ctx.putImageData(imgd, 0, 0);
                }

                const base64Canvas  = canvas.toDataURL();
                console.log(base64Canvas);

                // Chuyển đổi canvas thành arraybuffer
                // const base64Canvas = canvas.toDataURL('image/png');
                const base64Data = base64Canvas.split(',')[1];
                const binaryString = atob(base64Data);
                const byteArray = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    byteArray[i] = binaryString.charCodeAt(i);
                }

                // Thêm ảnh vào mảng elementInCanvasArray
                elementInCanvasArray.push({
                    idSign: new Date().getTime(),
                    type: "image",
                    imageSource: base64Canvas,
                    top: 300,
                    left: 300,
                    page: l2kdPDFConfigs.currentPage,
                    width: 250,
                    height: 150,
                    imageArrayBuffer: byteArray
                });

                loadElementInCanvas();
            };
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
            alert('Có lỗi xảy ra khi đọc file ảnh');
        };
        reader.readAsDataURL(file);
        $(this).val(null);
    });

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
});
