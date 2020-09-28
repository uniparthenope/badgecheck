const observableModule = require("tns-core-modules/data/observable");
let BarcodeScanner = require("nativescript-barcodescanner").BarcodeScanner;
let barcodescanner = new BarcodeScanner();
const httpModule = require("tns-core-modules/http");
const dialogs = require("tns-core-modules/ui/dialogs");
let toasty = require("nativescript-toasty");
const frame = require("tns-core-modules/ui/frame");
let appSettings = require("tns-core-modules/application-settings");

let QR_LEN = 1000;
let viewModel;
let page;
let qrcodes = [];
let debug;

function onNavigatingTo(args) {

    page = args.object;
    viewModel = observableModule.fromObject({});
    debug = appSettings.getBoolean("debug_mode",false);

    scanQR();

    page.bindingContext = viewModel;
}

exports.onNavigatingTo = onNavigatingTo;

function scanQR() {
    let count = 0;
    barcodescanner.scan({
        formats: "QR_CODE, EAN_13, CODE_128",
        cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
        cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
        message: 'GUIDA RAPIDA:\n\nPer ottenere il QR-Code aprire l`app ufficiale "app@uniparthenope".\n- Effettuare l`accesso.\n- Aprire la pagina BADGE.\n- Doppio-click sul QR-Code per zoom.\n\nUniversità degli Studi di Napoli "Parthenope"', // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
        //message: "Scan QR",
        preferFrontCamera: appSettings.getBoolean("front_camera",true),     // Android only, default false
        showFlipCameraButton: false,   // default false
        showTorchButton: false,       // iOS only, default false
        torchOn: false,               // launch with the flashlight on (default false)
        resultDisplayDuration: 1500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text// Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
        beepOnScan: true,             // Play or Suppress beep on scan (default true)
        openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
        reportDuplicates: false,
        closeCallback: () => {
            //console.log("Scanner closed @ " + new Date().getTime());
            //ALWAYS ON
            const nav = {
                moduleName: "scan/scan",
                clearHistory: true
            };
            frame.Frame.topmost().navigate(nav);
        },
        continuousScanCallback: function (result) {

            if(debug){
                //QrCode Scansionato
                new toasty.Toasty({"text": "\n\nSCANSIONATO!\nContatto il server...\n",
                    position: toasty.ToastPosition.TOP_RIGHT,
                    duration: toasty.ToastDuration.SHORT,
                    yAxisOffset: 100,
                    backgroundColor:"#AAAA00" }).show();
            }

            console.log(result);

            httpModule.request({
                url : global.url_general + "Badges/v1/checkQrCode",
                method : "POST",
                headers : {
                    "Content-Type": "application/json",
                    "Authorization" : "Basic "+ global.encodedStr
                },
                content : JSON.stringify({
                    token : result.text,
                    id_tablet : appSettings.getString("id_tab","NA")
                })
            }).then((response) => {
                const result = response.content.toJSON();

                //QrCode Scansionato
                if (debug){
                    new toasty.Toasty({"text": "\n\nCONTROLLATO!\nRisposta server ricevuta...\n",
                        position: toasty.ToastPosition.TOP_RIGHT,
                        duration: toasty.ToastDuration.SHORT,
                        yAxisOffset: 100,
                        backgroundColor:"#AAAA00" }).show();
                }

                if(response.statusCode === 500){
                    new toasty.Toasty({"text": result.message,
                        position: toasty.ToastPosition.CENTER,
                        duration: toasty.ToastDuration.LONG,
                        yAxisOffset: 100,
                        backgroundColor: result.color}).show();
                }
                else {
                    new toasty.Toasty({"text": result.message,
                        position: toasty.ToastPosition.CENTER,
                        duration: toasty.ToastDuration.LONG,
                        yAxisOffset: 100,
                        backgroundColor: result.color}).show();
                }

            }, error => {
                console.error(error);
            });

        },
    }).then(
        function(result) {
            console.log("Scan format: " + result.format);
            console.log("Scan text:   " + result.text);
        },
        function(error) {
            console.log("No scan: " + error);
        }
    );

}

exports.tap_scan = function () {
    scanQR();
};

function scanQR_new() {
    barcodescanner.scan({
        formats: "QR_CODE, EAN_13, CODE_128",
        cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
        cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
        message: 'GUIDA RAPIDA:\n\nPer ottenere il QR-Code aprire l`app ufficiale "app@uniparthenope".\n- Effettuare l`accesso.\n- Aprire la pagina BADGE.\n- Doppio-click sul QR-Code per zoom.\n\nUniversità degli Studi di Napoli "Parthenope"', // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
        //message: "Scan QR",
        preferFrontCamera: true,     // Android only, default false
        showFlipCameraButton: false,   // default false
        showTorchButton: false,       // iOS only, default false
        torchOn: false,               // launch with the flashlight on (default false)
        resultDisplayDuration: 0,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text// Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
        beepOnScan: true,             // Play or Suppress beep on scan (default true)
        openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
        reportDuplicates: true,
        closeCallback: () => {
            //console.log("Scanner closed @ " + new Date().getTime());
            //ALWAYS ON
            const nav = {
                moduleName: "scan/scan",
                clearHistory: true
            };
            frame.Frame.topmost().navigate(nav);
        },
        continuousScanCallback: function (result) {
            console.log(result);
            check_array(); // Controllo se la coda supera QR_LEN elementi

            if(qrcodes.includes(result.text)){
                new toasty.Toasty({"text": "\n\nNON AUTORIZZATO !\n\n" + "Già Scansionato!",
                    position: toasty.ToastPosition.CENTER,
                    duration: toasty.ToastDuration.LONG,
                    yAxisOffset: 100,
                    backgroundColor:"#AA0000" }).show();
            }
            else{
                qrcodes.push(result.text);
                httpModule.request({
                    url : global.url_general + "Badges/v1/checkQrCode",
                    method : "POST",
                    headers : {
                        "Content-Type": "application/json",
                        "Authorization" : "Basic "+ global.encodedStr
                    },
                    content : JSON.stringify({
                        token : result.text,
                        id_tablet : appSettings.getString("id_tab","NA")
                    })
                }).then((response) => {
                    const result = response.content.toJSON();

                    if(response.statusCode === 500){
                        new toasty.Toasty({"text": "\n\nNON AUTORIZZATO !\n\n" + result.errMsg,
                            position: toasty.ToastPosition.CENTER,
                            duration: toasty.ToastDuration.LONG,
                            yAxisOffset: 100,
                            backgroundColor:"#AA0000" }).show();
                    }
                    else {
                        new toasty.Toasty({"text": "\n\nAUTORIZZATO !\n\n",
                            position: toasty.ToastPosition.CENTER,
                            duration: toasty.ToastDuration.LONG,
                            yAxisOffset: 100,
                            backgroundColor:"#00AA00" }).show();
                    }

                }, error => {
                    console.error(error);
                });
            }

        },
    }).then(
        function(result) {
            console.log("Scan format: " + result.format);
            console.log("Scan text:   " + result.text);
        },
        function(error) {
            console.log("No scan: " + error);
        }
    );

}
function check_array() {
    if(qrcodes.length > QR_LEN){
        let last = qrcodes[QR_LEN];

        qrcodes = [];
        qrcodes.push(last);
    }
}
