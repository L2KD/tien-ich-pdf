var url = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf';


$(function () {
    let l2kdPDFData = null; // Current pdf loaded
    let pagePositionArray = [];
    const l2kdPDFDefaultConfigs = {
        scale: 1, // default
        totalPage: 1,
        currentPage: 1,
        pageArray: [],
        signatureArray: [],
        currentSignImageBase64Data: null
    }
    let l2kdPDFConfigs = {...l2kdPDFDefaultConfigs};

    // Loaded via <script> tag, create shortcut to access PDF.js exports.
    var PDFJS = window['pdfjs-dist/build/pdf'];
    // The workerSrc property shall be specified.
    PDFJS.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

    $("#top-menu-button-upload-pdf").click(function () {
        $("#choose-pdf").click();
    });

    $("#choose-pdf").change(function (event) {
        const file = event.target.files[0];
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

    $("#choose-image").change(function (event) {
        const file = event.target.files[0];
        console.log(file);
    });

    $("#top-menu-input-page").click(function () {
        $(this).select();
    });

    $("#top-menu-input-page").change(function () {
        const pageNumber = Number($(this).val());
        if (pageNumber > 0 && pageNumber <= l2kdPDFConfigs.totalPage) {
            renderPage(pageNumber);
        }
    })

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
        });
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

    function getBase64(file) {
        var reader = new FileReader();
        let result;
        reader.readAsDataURL(file);
        reader.onload = function () {
            console.log(reader.result);
            result = reader.result;
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
        return result;
    }

    function loadFileToPdf(file) {
        //Step 2: Read the file using file reader
        var fileReader = new FileReader();
        fileReader.onload = function () {
            result = new Uint8Array(fileReader.result);
            loadPdf(result);
        };
        //Step 3:Read the file as ArrayBuffer
        fileReader.readAsArrayBuffer(file);
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