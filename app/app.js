const application = require("tns-core-modules/application");
const StoreUpdate = require("nativescript-store-update");

let domain = "https://api.uniparthenope.it";
//let domain = "http://api.uniparthenope.it:5000";

//let domain = "http://127.0.0.1:5000";

global.url = domain + "/UniparthenopeApp/v1/";
global.url_general = domain + "/";

global.ver;

StoreUpdate.StoreUpdate.init({
    notifyNbDaysAfterRelease: 0,
    majorUpdateAlertType: StoreUpdate.AlertTypesConstants.FORCE,
    minorUpdateAlertType:StoreUpdate.AlertTypesConstants.FORCE,
    patchUpdateAlertType:StoreUpdate.AlertTypesConstants.FORCE,
    countryCode: it
})

require("nativescript-eventify");

application.run({ moduleName: "app-root" });
