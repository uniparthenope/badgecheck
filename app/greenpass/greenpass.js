const observableModule = require("tns-core-modules/data/observable");
let BarcodeScanner = require("nativescript-barcodescanner").BarcodeScanner;
let barcodescanner = new BarcodeScanner();
const httpModule = require("tns-core-modules/http");
const dialogs = require("tns-core-modules/ui/dialogs");
let toasty = require("nativescript-toasty");
const frame = require("tns-core-modules/ui/frame");
let appSettings = require("tns-core-modules/application-settings");
let sound = require("nativescript-sound");
let fm = require("tns-core-modules/file-system")

let QR_LEN = 1000;
let viewModel;
let page;
let qrcodes = [];
let debug;
let context;
let validity = [24, 48];
let val_index = 0;
let warning;

let base64= require('base-64');
let utf8 = require('utf8');

function onNavigatingTo(args) {

    page = args.object;
    viewModel = observableModule.fromObject({
        validity: validity
    });
    debug = appSettings.getBoolean("debug_mode",false);
    let path = fm.path.join(fm.knownFolders.currentApp().path, '/sounds/wrong.mp3');
    if(fm.File.exists(path)){
        warning = sound.create(path);

    }
    context = args.context;
    console.log(context.data);


    getListGreenPass();


    //scanQR();

    //page.bindingContext = viewModel;
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
                else if (response.statusCode === 203){
                    dialogs.confirm({
                        title: "Conferma Dati Personali",
                        message: result.msg,
                        okButtonText: "Confermo",
                        cancelButtonText: "Rifiuto",
                        neutralButtonText: "Chiama Assistenza"
                    }).then(function (dialog_result) {
                        barcodescanner.stop();
                        if(dialog_result){
                            //console.log("CONFERMATO!!");
                            //Invia conferma a API
                            httpModule.request({
                                url : global.url_general + "Badges/v3/checkGreenPassNoScan",
                                method : "POST",
                                headers : {
                                    "Content-Type": "application/json",
                                    "Authorization" : "Basic "+ global.encodedStr
                                },
                                content : JSON.stringify({
                                    id: context.id,
                                    expiry: result.expiry
                                    //id_tablet : appSettings.getString("id_tab","NA")
                                })
                            }).then((response) => {
                                const result = response.content.toJSON();
                                console.log(result);

                                new toasty.Toasty({"text": result.message,
                                    position: toasty.ToastPosition.CENTER,
                                    duration: toasty.ToastDuration.LONG,
                                    yAxisOffset: 100,
                                    backgroundColor: result.color}).show();
                            });
                            frame.Frame.topmost().goBack();

                        }
                        else{
                            frame.Frame.topmost().goBack();
                            const nav = {
                                moduleName: "scan/scan",
                                clearHistory: true
                            };
                            frame.Frame.topmost().navigate(nav);
                        }

                    });

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
                    frame.Frame.topmost().goBack();
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

function getListGreenPass() {
    httpModule.request({
        url: global.url_general + "Badges/v3/listGreenPass",
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + global.encodedStr
        },
    }).then((response) => {
        const result = response.content.toJSON();
        if (response.statusCode === 200) {
            validity = result.validity;
            console.log(validity);
            page.bindingContext = viewModel;
        }
    });
}

exports.tap_scanGP = function () {
    if(!context.has_info){
        context.data = 'NODATA';
    }
    scanQR();
};

exports.tap_cartaceo = function () {
    dialogs.confirm({
        title: "Conferma Dati Personali",
        message: "Confermo che la certificazione presentata ha durata di: " + validity[val_index] + "h",
        okButtonText: "Confermo",
        cancelButtonText: "Annulla",
        neutralButtonText: "Chiama Assistenza"
    }).then(function (dialog_result) {
        console.log(dialog_result);
        if(dialog_result) {
            //console.log("CONFERMATO!!");
            //Invia conferma a API
            httpModule.request({
                url: global.url_general + "Badges/v3/checkGreenPassNoScan",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Basic " + global.encodedStr
                },
                content: JSON.stringify({
                    id: context.id,
                    expiry: validity[val_index]
                    //id_tablet : appSettings.getString("id_tab","NA")
                })
            }).then((response) => {
                const result = response.content.toJSON();
                console.log(result);

                new toasty.Toasty({
                    "text": result.message,
                    position: toasty.ToastPosition.CENTER,
                    duration: toasty.ToastDuration.LONG,
                    yAxisOffset: 100,
                    backgroundColor: result.color
                }).show();
            });
            frame.Frame.topmost().goBack();
        }
        else if (dialog_result === undefined){
            console.log("DRIIIIIIN!!!!");
            warning.play();

        }}
    );
}

exports.onListPickerLoaded = function (fargs) {
    const listPickerComponent = fargs.object;
    listPickerComponent.on("selectedIndexChange", (args) => {
        const picker = args.object;
        val_index = picker.selectedIndex;

    });
}
exports.tap_altro = function () {
    //color="white" backgroundColor="#22384f"
    let layout = page.getViewById("validity-layout");
    let button = page.getViewById("altro");

    if(layout.visibility === "visible"){
        layout.visibility = "collapsed";
        button.color = "white";
        button.backgroundColor = "#22384f";
    }
    else{
        layout.visibility = "visible";
        button.color = "#22384f";
        button.backgroundColor = "white";
    }

}