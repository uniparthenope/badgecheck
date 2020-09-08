const observableModule = require("tns-core-modules/data/observable");
const frame = require("tns-core-modules/ui/frame");
let base64= require('base-64');
let utf8 = require('utf8');
const dialogs = require("tns-core-modules/ui/dialogs");

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

    if (user !== "" && pass!== "") {
        let token = user + ":" + pass;
        let bytes = utf8.encode(token);
        global.encodedStr = base64.encode(bytes);

        //HTTP REQUEST ...

        const nav = {
            moduleName: "home/home",
            clearHistory: true
        };
        frame.Frame.topmost().navigate(nav);
    }
    else{
        dialogs.alert({
            title: "Errore!",
            message: "I campi Username e Password non possono essere vuoti!",
            okButtonTexext: "OK"
        });
    }
};
exports.onNavigatingTo = onNavigatingTo;
