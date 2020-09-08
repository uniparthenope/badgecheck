const observableModule = require("tns-core-modules/data/observable");
const frame = require("tns-core-modules/ui/frame");

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
exports.onNavigatingTo = onNavigatingTo;
