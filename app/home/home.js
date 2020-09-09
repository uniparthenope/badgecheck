const observableModule = require("tns-core-modules/data/observable");
const frame = require("tns-core-modules/ui/frame");
let toasty = require("nativescript-toasty");


let viewModel;
let page;

function onNavigatingTo(args) {

    page = args.object;
    viewModel = observableModule.fromObject({});


    page.bindingContext = viewModel;
}
exports.tap_scan = function(){
    const nav = {
        moduleName: "scan/scan"
    };
    frame.Frame.topmost().navigate(nav);
};
exports.tap_test = function(){
    new toasty.Toasty({"text": "\n\nAUTORIZZATO\n\n^_^",
        position: toasty.ToastPosition.CENTER,
        duration: toasty.ToastDuration.LONG,
        yAxisOffset: 100,
        backgroundColor:"#00AA00" }).show();
};
exports.onNavigatingTo = onNavigatingTo;
