var CADESCOM_CADES_X_LONG_TYPE_1 = 0x5d;
var CAPICOM_CURRENT_USER_STORE = 2;
var CAPICOM_MY_STORE = "My";
var CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
var CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME = 1;

function SignCreate(certSubjectName, dataToSign) {
    console.log(cadesplugin)
    var oStore = cadesplugin.CreateObject("CAdESCOM.Store");
    oStore.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE,
        CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

    var oCertificates = oStore.Certificates.Find(
        CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME, certSubjectName);
    if (oCertificates.Count == 0) {
        alert("Certificate not found: " + certSubjectName);
        return;
    }
    var oCertificate = oCertificates.Item(1);
    var oSigner = cadesplugin.CreateObject("CAdESCOM.CPSigner");
    oSigner.CheckCertificate = false;
    oSigner.Options = cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN;
    oSigner.Certificate = oCertificate;
    // oSigner.TSAAddress = "http://cryptopro.ru/tsp/";

    var oSignedData = cadesplugin.CreateObject("CAdESCOM.CadesSignedData");
    oSignedData.ContentEncoding = cadesplugin.CADESCOM_BASE64_TO_BINARY;
    var contentBase64 = Base64.encode(dataToSign);
    oSignedData.Content = contentBase64;

    try {
        var sSignedMessage = oSignedData.SignCades(oSigner, cadesplugin.CADESCOM_CADES_BES, true);
    } catch (err) {
        alert("Failed to create signature. Error: " + cadesplugin.getLastError(err));
        return;
    }

    oStore.Close();

    return sSignedMessage;
}

function Verify(dataToVerify, sSignedMessage) {
    var oSignedData = cadesplugin.CreateObject("CAdESCOM.CadesSignedData");
    oSignedData.ContentEncoding = cadesplugin.CADESCOM_BASE64_TO_BINARY;
    var dataToVerifyBase64 = Base64.encode(dataToVerify);
    oSignedData.Content = dataToVerifyBase64;
    try {
        oSignedData.VerifyCades(sSignedMessage, cadesplugin.CADESCOM_CADES_BES, true);
    } catch (err) {
        alert("Failed to verify signature. Error: " + cadesplugin.getLastError(err));
        return false;
    }

    return true;
}

var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (e) {
        var t = "";
        var n, r, i, s, o, u, a;
        var f = 0;
        e = Base64._utf8_encode(e);
        while (f < e.length) {
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3) << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if (isNaN(r)) {
                u = a = 64
            } else if (isNaN(i)) {
                a = 64
            }
            t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
        }
        return t
    }, decode: function (e) {
        var t = "";
        var n, r, i;
        var s, o, u, a;
        var f = 0;
        e = e.replace(/[^A-Za-z0-9+/=]/g, "");
        while (f < e.length) {
            s = this._keyStr.indexOf(e.charAt(f++));
            o = this._keyStr.indexOf(e.charAt(f++));
            u = this._keyStr.indexOf(e.charAt(f++));
            a = this._keyStr.indexOf(e.charAt(f++));
            n = s << 2 | o >> 4;
            r = (o & 15) << 4 | u >> 2;
            i = (u & 3) << 6 | a;
            t = t + String.fromCharCode(n);
            if (u != 64) {
                t = t + String.fromCharCode(r)
            }
            if (a != 64) {
                t = t + String.fromCharCode(i)
            }
        }
        t = Base64._utf8_decode(t);
        return t
    }, _utf8_encode: function (e) {
        e = e.replace(/rn/g, "n");
        var t = "";
        for (var n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r)
            } else if (r > 127 && r < 2048) {
                t += String.fromCharCode(r >> 6 | 192);
                t += String.fromCharCode(r & 63 | 128)
            } else {
                t += String.fromCharCode(r >> 12 | 224);
                t += String.fromCharCode(r >> 6 & 63 | 128);
                t += String.fromCharCode(r & 63 | 128)
            }
        }
        return t
    }, _utf8_decode: function (e) {
        var t = "";
        var n = 0;
        var r = c1 = c2 = 0;
        while (n < e.length) {
            r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
                n++
            } else if (r > 191 && r < 224) {
                c2 = e.charCodeAt(n + 1);
                t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                n += 2
            } else {
                c2 = e.charCodeAt(n + 1);
                c3 = e.charCodeAt(n + 2);
                t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                n += 3
            }
        }
        return t
    }
}