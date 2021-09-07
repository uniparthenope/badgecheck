const observableModule = require("tns-core-modules/data/observable");
let BarcodeScanner = require("nativescript-barcodescanner").BarcodeScanner;
let barcodescanner = new BarcodeScanner();
const httpModule = require("tns-core-modules/http");
const dialogs = require("tns-core-modules/ui/dialogs");
const frame = require("tns-core-modules/ui/frame");
let appSettings = require("tns-core-modules/application-settings");
let sound = require("nativescript-sound");
let fm = require("tns-core-modules/file-system");

let QR_LEN = 1000;
let viewModel;
let page;
let qrcodes = [];
let debug;
let context;
let validity = [];
let res_val;
let val_index = 0;
let warning, confirm;
let loading;

let base64= require('base-64');
let utf8 = require('utf8');
const TIMEOUT = 2000;

function onNavigatingTo(args) {

    page = args.object;
    viewModel = observableModule.fromObject({
        validity: validity
    });
    debug = appSettings.getBoolean("debug_mode",false);
    loading = page.getViewById("activityIndicator");

    let w_path = fm.path.join(fm.knownFolders.currentApp().path, '/sounds/wrong.mp3');
    if(fm.File.exists(w_path))
        warning = sound.create(w_path);
    let c_path = fm.path.join(fm.knownFolders.currentApp().path, '/sounds/confirm.mp3');
    if(fm.File.exists(c_path))
        confirm = sound.create(c_path);

    context = args.context;


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
        message: 'SCANSIONE CERTIFICAZIONE VERDE COVID-19\n\nUniversità degli Studi di Napoli "Parthenope"', // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
        //message: "Scan QR",
        preferFrontCamera: appSettings.getBoolean("front_camera",true),     // Android only, default false
        showFlipCameraButton: true,   // default false
        showTorchButton: false,       // iOS only, default false
        torchOn: false,               // launch with the flashlight on (default false)
        resultDisplayDuration: 1500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text// Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
        beepOnScan: true,             // Play or Suppress beep on scan (default true)
        openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
        reportDuplicates: false,
        continuousScanCallback(result){
            if(debug){
                //QrCode Scansionato
                /*
                new toasty.Toasty({"text": "\n\nSCANSIONATO!\nContatto il server...\n",
                    position: toasty.ToastPosition.TOP_RIGHT,
                    duration: toasty.ToastDuration.SHORT,
                    yAxisOffset: 100,
                    backgroundColor:"#AAAA00" }).show();

                 */
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
                    /*
                    new toasty.Toasty({"text": "\n\nCONTROLLATO!\nRisposta server ricevuta...\n",
                        position: toasty.ToastPosition.TOP_RIGHT,
                        duration: toasty.ToastDuration.SHORT,
                        yAxisOffset: 100,
                        backgroundColor:"#AAAA00" }).show();

                     */
                }

                if(response.statusCode === 500){
                    warning.play();
                    show_dialog(result.message, TIMEOUT);
                    /*
                    new toasty.Toasty({"text": result.message,
                        position: toasty.ToastPosition.CENTER,
                        duration: toasty.ToastDuration.LONG,
                        yAxisOffset: 100,
                        backgroundColor: result.color}).show();

                     */
                }
                else if (response.statusCode === 203){
                    warning.play();
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
                                /*
                                                                new toasty.Toasty({"text": result.message,
                                                                    position: toasty.ToastPosition.CENTER,
                                                                    duration: toasty.ToastDuration.LONG,
                                                                    yAxisOffset: 100,
                                                                    backgroundColor: result.color}).show();

                                 */
                                show_dialog(result.message, TIMEOUT);

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
                    console.log(result)
                    /*
                    new toasty.Toasty({"text": result.message,
                        position: toasty.ToastPosition.CENTER,
                        duration: toasty.ToastDuration.LONG,
                        yAxisOffset: 100,
                        backgroundColor: result.color}).show();

                     */
                    confirm.play();
                    show_dialog_back(result.message, TIMEOUT);

                }

            }, error => {
                console.error(error);
            });
        }

    }).then(function(result) {
            console.log("OK");
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
        res_val = response.content.toJSON();

        if (response.statusCode === 200) {

            while(validity.length > 0)
                validity.pop();

            for(let x=0; x<res_val.length; x++ ){
                validity.push(res_val[x].desc);
            }

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
    loading.visibility="visible";
    dialogs.confirm({
        title: "Conferma Dati Personali",
        message: "Confermo che la certificazione presentata ha durata di: " + res_val[val_index].expire + " giorni",
        okButtonText: "Confermo",
        cancelButtonText: "Annulla",

    }).then(function (dialog_result){
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
                    expiry: res_val[val_index].expire
                    //id_tablet : appSettings.getString("id_tab","NA")
                })
            }).then((response) => {
                const result = response.content.toJSON();
                console.log(result);
/*
                new toasty.Toasty({
                    "text": result.message,
                    position: toasty.ToastPosition.CENTER,
                    duration: toasty.ToastDuration.LONG,
                    yAxisOffset: 100,
                    backgroundColor: result.color
                }).show();

 */
                dialogs.alert({
                    message: result.message,
                    okButtonText: "OK"
                });
            });
            //loading.visibility="visible";
            frame.Frame.topmost().goBack();

        }
        else{
            loading.visibility="collapsed";
        }
    });
    /*
    barcodescanner.scan({
        formats: "QR_CODE, EAN_13, CODE_128",
        cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
        cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
        message: 'SCANSIONE QR-CODE OPERATORE\n\nUniversità degli Studi di Napoli "Parthenope"', // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
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
            dialogs.confirm({
                title: "Conferma Dati Personali",
                message: "Confermo che la certificazione presentata ha durata di: " + validity[val_index] + "h",
                okButtonText: "Confermo",
                cancelButtonText: "Annulla",

            }).then(function (dialog_result){
                if(dialog_result){
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
                    });
                }
            });

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
                    id: context.id,
                    expiry: validity[val_index],
                    operator_id: result.text
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
                    console.log(result)
                    new toasty.Toasty({"text": result.message,
                        position: toasty.ToastPosition.CENTER,
                        duration: toasty.ToastDuration.LONG,
                        yAxisOffset: 100,
                        backgroundColor: result.color}).show();
                    confirm.play();

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
    });

     */

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
    let layout = page.getViewById("validity-operator");
    let layout_det = page.getViewById("validity-layout");
    let button = page.getViewById("altro");
    let button_scan = page.getViewById("scan");


    if(layout.visibility === "visible"){
        layout.visibility = "collapsed";
        layout_det.visibility = "collapsed";
        button.color = "white";
        button.backgroundColor = "purple";
        button_scan.visibility = "visible";
        button.text = "Altra Certificazione - Richiedi assistenza Operatore";
    }
    else{
        layout_det.visibility = "collapsed";
        button_scan.visibility = "collapsed";
        warning.play();
        // Send API or Notification to an operator ...
        layout.visibility = "visible";
        button.color = "gray";
        button.backgroundColor = "white";
        button.text = "Indietro";
    }

}

exports.tap_operatore = function () {
    barcodescanner.scan({
        formats: "QR_CODE, EAN_13, CODE_128",
        cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
        cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
        message: 'SCANSIONE QR-CODE OPERATORE\n\nUniversità degli Studi di Napoli "Parthenope"', // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
        //message: "Scan QR",
        preferFrontCamera: appSettings.getBoolean("front_camera",true),     // Android only, default false
        showFlipCameraButton: false,   // default false
        showTorchButton: false,       // iOS only, default false
        torchOn: false,               // launch with the flashlight on (default false)
        resultDisplayDuration: 1500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text// Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
        beepOnScan: true,             // Play or Suppress beep on scan (default true)
        openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
        reportDuplicates: false,
        continuousScanCallback(result){
            httpModule.request({
                url : global.url_general + "Badges/v3/checkOperator",
                method : "POST",
                headers : {
                    "Content-Type": "application/json",
                    "Authorization" : "Basic "+ global.encodedStr
                },
                content : JSON.stringify({
                    operator_id: result.text
                })
            }).then((response) => {
                const _result = response.content.toJSON();
                console.log(_result);
                console.log(response.statusCode);

                if(response.statusCode === 200){
                    /*
                    new toasty.Toasty({"text": _result.message,
                        position: toasty.ToastPosition.CENTER,
                        duration: toasty.ToastDuration.LONG,
                        yAxisOffset: 100,
                        backgroundColor: _result.color}).show();

                     */
                    show_dialog(_result.message, TIMEOUT);
                    let layout = page.getViewById("validity-layout");
                    let old_layout = page.getViewById("validity-operator");
                    old_layout.visibility = "collapsed";
                    layout.visibility = "visible";


                }
                else{
                    show_dialog(_result.message, TIMEOUT);
                    /*
                    new toasty.Toasty({"text": _result.message,
                        position: toasty.ToastPosition.CENTER,
                        duration: toasty.ToastDuration.LONG,
                        yAxisOffset: 100,
                        backgroundColor: _result.color}).show();

                     */
                }
            });
        }

    }).then(function(result) {
        console.log("OK");
    },
        function(error) {
            console.log("No scan: " + error);
        });
}

function show_dialog(message, timeout){
    dialogs.alert({
        message: message,
    });
    setTimeout(() =>{
        barcodescanner.stop();
    },timeout);
}

function show_dialog_back(message, timeout){
    dialogs.alert({
        message: message,
    });
    setTimeout(() =>{
        barcodescanner.stop();
        frame.Frame.topmost().goBack();
    },timeout);
}