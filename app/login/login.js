const observableModule = require("tns-core-modules/data/observable");
const frame = require("tns-core-modules/ui/frame");

let viewModel;
let page;

function onNavigatingTo(args) {

    page = args.object;
    viewModel = observableModule.fromObject({});
    page.bindingContext = viewModel;
}
exports.tap_login = function(){
    let user = page.getViewById("username").text;
    let pass = page.getViewById("password").text;

    console.log(user,pass);

    //HTTP REQUEST ...

    const nav = {
        moduleName: "home/home",
        clearHistory: true
    };
    frame.Frame.topmost().navigate(nav);
};
exports.onNavigatingTo = onNavigatingTo;
