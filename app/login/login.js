const observableModule = require("tns-core-modules/data/observable");
const frame = require("tns-core-modules/ui/frame");
let app = require("tns-core-modules/application");
let base64= require('base-64');
let utf8 = require('utf8');
const dialogs = require("tns-core-modules/ui/dialogs");
const Color = require("tns-core-modules/color");
const httpModule = require("tns-core-modules/http");
const Sound = require("nativescript-sound-kak");
let appversion = require("nativescript-appversion");
let appSettings = require("tns-core-modules/application-settings");


let viewModel;
let page;

function onNavigatingTo(args) {

    page = args.object;
    viewModel = observableModule.fromObject({});
    let rem = appSettings.getBoolean("remember",false);

    if (rem)
        autoconnect();

    appversion.getVersionName().then(function(v) {
        global.ver = v;
        page.getViewById("version").text = "v. " + v;

    });


    page.bindingContext = viewModel;
}
exports.tap_login = function(){
    let user = page.getViewById("username").text;
    let pass = page.getViewById("password").text;

    let loading = page.getViewById("activityIndicator");

    if (user !== "" && pass!== "") {
        loading.visibility = "visible";
        let token = user + ":" + pass;
        let bytes = utf8.encode(token);
        global.encodedStr = base64.encode(bytes);

        httpModule.request({
            url: global.url + "login" ,
            method: "GET",
            headers: {
                "Content-Type" : "application/json",
                "Authorization" : "Basic "+ global.encodedStr
            }
        }).then((response) => {
            const result = response.content.toJSON();
            console.log(response.statusCode);

            if(response.statusCode === 401){
                loading.visibility = "collapsed";
                dialogs.confirm({
                    title: "Autenticazione Fallita!",
                    message: result.errMsg,
                    okButtonText: "OK"
                }).then(function (result) {
                });
            }
            else {
                loading.visibility = "collapsed";

                let rem = page.getViewById("remember").checked;
                appSettings.setBoolean("remember", rem);

                if(rem)
                    appSettings.setString("token",global.encodedStr);

                if (result.user.grpId === 7 || result.user.grpId === 99){
                    const nav = {
                        moduleName: "home/home",
                        clearHistory: true
                    };
                    frame.Frame.topmost().navigate(nav);
                }
                else{
                    loading.visibility = "collapsed";

                    dialogs.alert({
                        title: "Errore: Login",
                        message: "Utente non supportato!",
                        okButtonText: "OK"
                    });
                }
            }

        }, error => {
            loading.visibility = "collapsed";

            dialogs.confirm({
                title: "Errore: Login",
                message: error.toString(),
                okButtonText: "OK"
            }).then(function (result) {
            });
        });


    }
    else{
        dialogs.alert({
            title: "Errore!",
            message: "I campi Username e Password non possono essere vuoti!",
            okButtonText: "OK"
        });
    }
};
exports.onNavigatingTo = onNavigatingTo;

function autoconnect(){
    let loading = page.getViewById("activityIndicator");
    loading.visibility = "visible";
    global.encodedStr = appSettings.getString("token","");
    if(global.encodedStr !== ""){
        httpModule.request({
            url: global.url + "login" ,
            method: "GET",
            headers: {
                "Content-Type" : "application/json",
                "Authorization" : "Basic "+ global.encodedStr
            }
        }).then((response) => {
            const result = response.content.toJSON();
            console.log(response.statusCode);

            if(response.statusCode === 401){
                loading.visibility = "collapsed";
                dialogs.confirm({
                    title: "Autenticazione Fallita!",
                    message: result.errMsg,
                    okButtonText: "OK"
                }).then(function (result) {
                });
            }
            else {
                loading.visibility = "collapsed";

                if (result.user.grpId === 7 || result.user.grpId === 99){
                    const nav = {
                        moduleName: "home/home",
                        clearHistory: true
                    };
                    frame.Frame.topmost().navigate(nav);
                }
                else{
                    loading.visibility = "collapsed";

                    dialogs.alert({
                        title: "Errore: Login",
                        message: "Utente non supportato!",
                        okButtonText: "OK"
                    });
                }
            }

        }, error => {
            loading.visibility = "collapsed";

            dialogs.confirm({
                title: "Errore: Login",
                message: error.toString(),
                okButtonText: "OK"
            }).then(function (result) {
            });
        });
    }


}
