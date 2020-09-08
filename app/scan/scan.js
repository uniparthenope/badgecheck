const observableModule = require("tns-core-modules/data/observable");
let BarcodeScanner = require("nativescript-barcodescanner").BarcodeScanner;
let barcodescanner = new BarcodeScanner();
const httpModule = require("tns-core-modules/http");
const dialogs = require("tns-core-modules/ui/dialogs");
let toasty = require("nativescript-toasty").Toasty;

let viewModel;
let page;

function onNavigatingTo(args) {

    page = args.object;
    viewModel = observableModule.fromObject({});
    page.bindingContext = viewModel;

    scanQR();
}

exports.onNavigatingTo = onNavigatingTo;

function scanQR() {
    let count = 0;
    barcodescanner.scan({
        formats: "QR_CODE, EAN_13, CODE_128",
        cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
        cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
        message: "Scan QR code", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
        preferFrontCamera: false,     // Android only, default false
        showFlipCameraButton: false,   // default false
        showTorchButton: false,       // iOS only, default false
        torchOn: false,               // launch with the flashlight on (default false)
        resultDisplayDuration: 0,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text// Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
        beepOnScan: true,             // Play or Suppress beep on scan (default true)
        openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
        closeCallback: () => {
            //console.log("Scanner closed @ " + new Date().getTime());
        },
        continuousScanCallback: function (result) {
            console.log(result.format + ": " + result.text + " (count: " + count + ")");
            barcodescanner.message = "SCANNED";

            httpModule.request({
                url : global.url_general + "Badges/v1/checkQrCode",
                method : "POST",
                headers : {
                    "Content-Type": "application/json",
                    "Authorization" : "Basic "+ global.encodedStr
                },
                content : JSON.stringify({
                    token : result.text
                })
            }).then((response) => {
                const result = response.content.toJSON();
                console.log(response.statusCode);

                if(response.statusCode == 500){
                    let toast = new toasty({"text": result.errMsg});
                    toast.setBackgroundColor("#BB0000");
                    toast.show();
                }
                else {
                    let toast = new toasty({"text": result.status});
                    toast.setBackgroundColor("#00BB00");
                    toast.show();
                }

            }, error => {
                console.error(error);
            });


            if (count === 3) {
                barcodescanner.stop();
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
