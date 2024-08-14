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

    $("#top-menu-button-upload-image").click(function () {
        if (l2kdPDFData !== null) {
            $("#choose-image").click();
        } else {
            alert("Chưa chọn tập tin pdf");
            $("#choose-pdf").click();
        }
    });

    $("#choose-image").change(async function (event) {
        const file = event.target.files[0];

        var reader = new FileReader();
        reader.onload = function () {
            let base64 = reader.result;
            // base64 = base64.replaceAll("data:image/jpeg;base64,", "").replaceAll("data:image/png;base64,", "");

            // const imageElement = document.getElementById("image-no-background-img");
            const imageElement = document.createElement("img");
            imageElement.src = base64;
            imageElement.onload = function handleLoad() {
                const width = imageElement.width;
                const height = imageElement.height;
                // const canvas = document.getElementById("image-no-background-canvas");
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const image = imageElement;
                canvas.height = height;
                canvas.width = width;
                ctx.drawImage(image,0,0);
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
                const base64Canvas  = canvas.toDataURL();
                console.log(base64Canvas);

                var req = new XMLHttpRequest;
                req.open('GET', base64Canvas);
                req.responseType = 'arraybuffer';
                req.onload = function fileLoaded(e)
                {
                    var byteArray = new Uint8Array(e.target.response);
                    // var shortArray = new Int16Array(e.target.response);
                    // var unsignedShortArray = new Int16Array(e.target.response);
                    // etc.

                    elementInCanvasArray.push({
                        idSign: new Date().getTime(),
                        imageSource: base64Canvas,
                        vaiTro: "vaiTro",
                        top: 300,
                        left: 300,
                        page: l2kdPDFConfigs.currentPage,
                        width: 250,
                        height: 150,
                        vaiTroStt: "1",
                        imageArrayBuffer: byteArray
                        // imageArrayBuffer: base64
                    });
                    loadElementInCanvas();
                }
                req.send();


            };
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
        reader.readAsDataURL(file);
        $(this).val(null);
    });

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
        download(pdfBytes, "pdf-lib_modification_example.pdf", "application/pdf");
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
                    const elementInCanvasElement = '' +
                        '<div class="l2kd-plugin-element-wrapper" id="l2kd-plugin-element-' + element.idSign + '" style="top: ' + element.top + 'px; left: ' + element.left + 'px; position: absolute">' +
                        '   <div class="l2kd-plugin-element-button-wrapper">' +
                        '       <div class="l2kd-plugin-element-button" id="l2kd-plugin-element-button-' + element.idSign + '" data-id-sign="' +  element.idSign + '">' +
                        '           <i class="fa fa-times" aria-hidden="true"></i>' +
                        '       </div>' +
                        // '       <div class="l2kd-plugin-element-button-vai-tro-text">' +
                        // '           <span>' + element.vaiTro + '</span>' +
                        // '       </div>' +
                        '   </div>' +
                        '   <div class="smartcav2-plugin-signature" id="l2kd-plugin-element-resize-' + element.idSign +'" style="width: ' + element.width + 'px; height: ' + element.height + 'px;">' +
                        '       <img src="' + element.imageSource + '" />' +
                        '   </div>' +
                        '</div>';

                    $("#l2kd-plugin-pdf-viewer-" + element.page).append(elementInCanvasElement);

                    $("#l2kd-plugin-element-button-" + element.idSign).click(async function() {
                        const idSign = $(this).attr("data-id-sign");
                        const listAdded = elementAdded;
                        const listInCanvas = elementInCanvasArray;
                        elementAdded = listAdded.filter(el => (el.idSign + "") !== idSign);
                        elementAddedFiltered = elementAddedFiltered.filter(el => (el.idSign + "") !== idSign);
                        elementInCanvasArray = listInCanvas.filter(el => (el.idSign + "") !== idSign);
                        // await loadDanhSachChuKyDaThem();
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

                            console.log('top: ' + position.top);
                            console.log('left: ' + position.left);
                        }
                    });
                    await $("#l2kd-plugin-element-resize-" + element.idSign).resizable({
                        resize: function ( event, ui ) {
                            const idElement = ui.helper[0].getAttribute("id");
                            const idSign = idElement.replaceAll("l2kd-plugin-element-resize-", "");
                            const size = ui.size;
                            const findIndex = elementInCanvasArray.findIndex(sig => (sig.idSign + "") === idSign);
                            if (findIndex >= 0) {
                                elementInCanvasArray[findIndex].width = size.width;
                                elementInCanvasArray[findIndex].height = size.height;
                            }
                            $(this).parent().css({width: size.width});
                            // const signatureWrapperElement = $("#l2kd-plugin-element-button-167297857973101").parents("div:first");
                            // signatureWrapperElement.css({width: size.width});
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
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        for (let i = 0; i < pageFilter.length; i++) {
            const imageConfig = pageFilter[i];
            const imgData = imageConfig.imageArrayBuffer;
            const pngImage = await pdfDoc.embedPng(imgData);
            const page = pdfDoc.getPage(currentPage - 1);
            page.drawImage(pngImage, {
                x: imageConfig.left / scale,
                y: page.getHeight() - imageConfig.top / scale - 38 / scale - imageConfig.height / scale,
                width: imageConfig.width / scale,
                height: imageConfig.height / scale
            });
        }
        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, "pdf-lib_modification_example.pdf", "application/pdf");
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
});
