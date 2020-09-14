const application = require("tns-core-modules/application");

let domain = "https://api.uniparthenope.it";
//let domain = "http://127.0.0.1:5000";

global.url = domain + "/UniparthenopeApp/v1/";
global.url_general = domain + "/";

global.ver;

application.run({ moduleName: "app-root" });
