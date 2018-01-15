var CADESCOM_CADES_BES = 1;
var CADESCOM_CADES_X_LONG_TYPE_1 = 0x5d;

var CAPICOM_CURRENT_USER_STORE = 2;
var CAPICOM_MY_STORE = "My";
var CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
var CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME = 1;
var CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN = 1;
var CADESCOM_BASE64_TO_BINARY = 0x01;
var CAPICOM_AUTHENTICATED_ATTRIBUTE_SIGNING_TIME = 0;

var _log = logger.newLogger({name:"antinform-crypto",level:"debug"});

var URL = "http://10.78.101.19:8081/crypto/servlet/verify/sign";

var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

var module =  {
    /**
     * Создание отделенной подписи CAdES-BES.
     * @param dataToSign - контент
     * @returns {*}
     */
    makeCAdES_BES : function(dataToSign) {

        return _chooseCertificate().then(function(cert){
            return _makeCAdES_BES(dataToSign, cert);
        });

    },

    encodeBase64 : function(content){
        return Base64.encode(content);
    },

    decodeBase64 : function(base64){
        return Base64.decode(base64);
    },

    /**
     * @param dataToSign - контент
     * @returns {*}
     */
    verifyCAdES_BES : function(content, sign, url) {

        return $.ajax({
            type:"POST", cache:false,
            url:url,
            data:{
                signatura:sign,
                content:content
            }
        });

    },

};

function _chooseCertificate(){
    return new es6_promise.Promise(function(resolve, reject){

        var options = [];

        var store = cadesplugin.CreateObject('CAPICOM.store');
        store.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE, CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

        var certs = store.Certificates;

        for(var i = 1; i <= certs.Count; i++){
            var cert = certs.Item(i);
            if(!cert.IsValid()) continue;

            options.push(_certToJSON(cert));
        }

        var form1 = [
            {view:"select", name:"thumb", label:"certs", options:options},
            { view:"button", value:"Sign", event:"choose_cert", align:"center", width:400 }
        ];
        var panel = ui.panel({
            margin:0,width: 640, height:180,
            /*container:$("body"),*/
            cols: [
                { margin:0, rows:[
                        { view:"form", scroll:false, width:620, elements: form1 }
                    ]}
            ]
        });

        panel.on("choose_cert", function (args) {
            panel.hide();
            resolve(certs.Find(0, args.thumb).Item(1));
        });
    });
}

function _makeCAdES_BES(dataToSign, cert) {
    return new es6_promise.Promise(function(resolve, reject){
        var oSigner = cadesplugin.CreateObject("CAdESCOM.CPSigner");
        oSigner.Certificate = cert;
        oSigner.Options = CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN;
        var oSignedData = cadesplugin.CreateObject("CAdESCOM.CadesSignedData");
        oSignedData.ContentEncoding = CADESCOM_BASE64_TO_BINARY;
        oSignedData.Content = dataToSign;

        var signature = oSignedData.SignCades(oSigner, CADESCOM_CADES_BES, true);

        oSignedData.VerifyCades(signature, CADESCOM_CADES_BES, true);
        resolve(signature);
    });
};

function _makeCAdES_X_Long_Type_1(dataToSign, cert) {
    throw "unsupport";
};