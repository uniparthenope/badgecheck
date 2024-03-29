const observableModule = require("tns-core-modules/data/observable");
const frame = require("tns-core-modules/ui/frame");
let appSettings = require("tns-core-modules/application-settings");
const dialogs = require("tns-core-modules/ui/dialogs");



let viewModel;
let page;

function onNavigatingTo(args) {

    page = args.object;
    viewModel = observableModule.fromObject({});

    page.getViewById("id_tab").text = appSettings.getString("id_tab","ID-Tablet");
    page.getViewById("front_camera").checked = appSettings.getBoolean("front_camera", true);
    page.getViewById("debug_mode").checked = appSettings.getBoolean("debug", false);


    let forget_btn = page.getViewById("btn_forget");
    if(appSettings.getBoolean("remember",false))
        forget_btn.visibility = "visible";
    else
        forget_btn.visibility = "collapsed";

    page.bindingContext = viewModel;
}
exports.onNavigatingTo = onNavigatingTo;

exports.tap_save = function(){
    let id_tab = page.getViewById("id_tab").text;
    let front_camera = page.getViewById("front_camera").checked;
    let debug_mode = page.getViewById("debug_mode").checked;


    if ( id_tab !== ""){
        appSettings.setString("id_tab", id_tab);
        appSettings.setBoolean("front_camera",front_camera);
        appSettings.setBoolean("debug_mode",debug_mode);

        dialogs.confirm({
            title: "Successo",
            message: "Salvataggio effettuato!",
            okButtonText: "OK"
        }).then(function (result) {
        });

    }
    else{
        dialogs.confirm({
            title: "Errore",
            message: "ID-Tablet non può essere vuoto!",
            okButtonText: "OK"
        }).then(function (result) {
        });
    }
};
exports.tap_forget = function() {
    appSettings.setBoolean("remember",false);
    appSettings.setString("token","");
    const nav = {
        moduleName: "login/login",
        clearHistory: true
    };
    frame.Frame.topmost().navigate(nav);
};