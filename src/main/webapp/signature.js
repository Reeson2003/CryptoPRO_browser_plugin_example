function isPromiseSupported() {
    return (typeof Promise !== "undefined" && Promise.toString().indexOf("[native code]") !== -1);
}


var Sign = function () {
    var sign;
        if (isPromiseSupported()) {
            sign = new SignAsync();
        } else {
            sign = new SignSync();
        }
    return {
        sign: sign,
        checkBrowserPlugin: function (callback) {
            this.sign.checkBrowserPlugin(callback);
        },
        findAllCertificates: function (callback) {
            this.sign.findCertificatesByName("",callback);
        },
        findCertificatesByName: function(name, callback) {
            this.sign.findCertificatesByName(name, callback);
        },
        findCertificateByThumbprint: function(thumb, callback){
            this.sign.findCertificateByThumbprint(thumb, callback);
        },
        signCreate: function (certSubjectName, dataToSign, callback) {
            this.sign.signCreate(certSubjectName, dataToSign, callback);
        },
        signVerifyOnClient: function (signedData, signature, callback) {
            this.sign.signVerifyOnClient(signedData, signature, callback);
        },
        signVerifyRemote: function (signedData, signature, callback) {
            /*throw "unsupported";*/
            verifyRemote(signedData, signature).then(function (success) {
                callback(success.status);
            })
        }
    }
};

function verifyRemote(dataToVerify, sign) {
    return new Promise(function (resolve, reject) {
        var content = Base64.encode(dataToVerify);
        var data = {
            signature: sign,
            data: content
        };
        return $.ajax({
            type: "POST", cache: false,
            url: REMOTE_URL,
            data: data,
            success: function (data) {
                resolve(data);
            }
        });
    })
}

function verifyNovikovServlet(dataToVerify, sign) {
    return new Promise(function (resolve, reject) {
        var content = Base64.encode(dataToVerify);
        var data = {
            signatura: sign,
            content: content
        };
        return $.ajax({
            type: "POST", cache: false,
            url: SERVLET_URL,
            data: data,
            success: function (data) {
                resolve(data);
            }
        });
    })
}

var REMOTE_URL = "http://localhost:8080/sign";

var SERVLET_URL = "http://localhost:8080/servlet/verify/sign";