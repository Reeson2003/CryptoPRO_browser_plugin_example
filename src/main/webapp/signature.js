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
            throw "unsupported";
        }
    }
};