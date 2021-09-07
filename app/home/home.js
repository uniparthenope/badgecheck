const observableModule = require("tns-core-modules/data/observable");
const frame = require("tns-core-modules/ui/frame");
let appSettings = require("tns-core-modules/application-settings");
const dialogs = require("tns-core-modules/ui/dialogs");
let appversion = require("nativescript-appversion");


let viewModel;
let page;

function onNavigatingTo(args) {

    page = args.object;
    viewModel = observableModule.fromObject({});
    appversion.getVersionName().then(function(v) {
        global.ver = v;
    });

    if (appSettings.getString("id_tab") === undefined){
        dialogs.alert({
            title: "Attenzione",
            message: "ID-Tablet non è stato ancora impostato!",
            okButtonText: "OK"
        }).then(function () {
            const nav = {
                moduleName: "settings/settings"
            };
            frame.Frame.topmost().navigate(nav);
        });
    }
    else
        page.getViewById("id_tab").text = appSettings.getString("id_tab");

    page.getViewById("version").text = "v. " + global.ver;

    page.bindingContext = viewModel;
}
exports.tap_scan = function(){
    const nav = {
        moduleName: "scan/scan"
    };
    frame.Frame.topmost().navigate(nav);
};
exports.tap_settings = function(){
    const nav = {
        moduleName: "settings/settings"
    };
    frame.Frame.topmost().navigate(nav);
};
exports.onNavigatingTo = onNavigatingTo;
