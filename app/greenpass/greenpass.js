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
let context;

let base64= require('base-64');
let utf8 = require('utf8');

function onNavigatingTo(args) {

    page = args.object;
    viewModel = observableModule.fromObject({});
    debug = appSettings.getBoolean("debug_mode",false);
    context = args.context;
    console.log(context.data);

    if (context.has_info){
        scanQR();
    }

    //scanQR();

    page.bindingContext = viewModel;
}

exports.onNavigatingTo = onNavigatingTo;

function scanQR() {
    let count = 0;
    barcodescanner.scan({
        formats: "QR_CODE, EAN_13, CODE_128",
        cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
        cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
        message: 'SCANSIONE GREEN PASS\n\nUniversità degli Studi di Napoli "Parthenope"', // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
        //message: "Scan QR",
        preferFrontCamera: appSettings.getBoolean("front_camera",true),     // Android only, default false
        showFlipCameraButton: false,   // default false
        showTorchButton: false,       // iOS only, default false
        torchOn: false,               // launch with the flashlight on (default false)
        resultDisplayDuration: 1500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text// Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
        beepOnScan: true,             // Play or Suppress beep on scan (default true)
        openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
        reportDuplicates: false,
        continuousScanCallback: function (result) {

            if(debug){
                //QrCode Scansionato
                new toasty.Toasty({"text": "\n\nSCANSIONATO!\nContatto il server...\n",
                    position: toasty.ToastPosition.TOP_RIGHT,
                    duration: toasty.ToastDuration.SHORT,
                    yAxisOffset: 100,
                    backgroundColor:"#AAAA00" }).show();
            }

            //console.log(result.text);
            //console.log(context);
            httpModule.request({
                url : global.url_general + "Badges/v3/checkGreenPass",
                method : "POST",
                headers : {
                    "Content-Type": "application/json",
                    "Authorization" : "Basic "+ global.encodedStr
                },
                content : JSON.stringify({
                    token_GP : result.text,
                    data : context.data,
                    id: context.id
                    //id_tablet : appSettings.getString("id_tab","NA")
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

                    const nav = {
                        moduleName: "scan/scan"

                    };
                    barcodescanner.stop();
                    frame.Frame.topmost().goBack()
                    //frame.Frame.topmost().navigate(nav);
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

exports.tap_save = function () {
    let name = page.getViewById("name").text;
    let surname = page.getViewById("surname").text;
    let birth = page.getViewById("birth").text;
    let s = base64.decode(context.data) + ":" + name.toUpperCase() + ":" + surname.toUpperCase() + ":" + birth;
    let bytes = utf8.encode(s);
    let _s = base64.encode(bytes);

    context.data = _s;

    //console.log(context.data);
    scanQR();

};
