var CADESCOM_CADES_X_LONG_TYPE_1 = 0x5d;
var CADESCOM_CADES_BES = 1;
var CAPICOM_CURRENT_USER_STORE = 2;
var CAPICOM_MY_STORE = "My";
var CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
var CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME = 1;
var CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN = 1;
var CADESCOM_BASE64_TO_BINARY = 0x01;

var SERVLET_URL = "http://10.78.101.19:8081/crypto/servlet/verify/sign";
var REST_URL = "http://10.78.101.19:8081/crypto/rest/api/verify/sign";


function SignCreateAsync(certSubjectName, dataToSign) {
    return new Promise(function (resolve, reject) {
        cadesplugin.async_spawn(function* (args) {
            try {
                var oStore = yield cadesplugin.CreateObjectAsync("CAdESCOM.Store"/*'CAPICOM.store'*/);
                yield oStore.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE, CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

                var certificatesObject = yield oStore.Certificates;
                var oCertificates = yield certificatesObject.Find(
                    CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME, certSubjectName);
                var Count = yield oCertificates.Count;
                if (Count == 0) {
                    alert("Certificate not found: " + certSubjectName);
                    throw("Certificate not found: " + args[0]);
                }
                var oCertificate = yield oCertificates.Item(1);
                var oSigner = yield cadesplugin.CreateObjectAsync("CAdESCOM.CPSigner");
                yield oSigner.propset_CheckCertificate(false);
                yield oSigner.propset_Options(CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN);
                yield oSigner.propset_Certificate(oCertificate);
                // oSigner.TSAAddress = "http://cryptopro.ru/tsp/";

                var oSignedData = yield cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
                yield oSignedData.propset_ContentEncoding(cadesplugin.CADESCOM_BASE64_TO_BINARY);
                var contentBase64 = Base64.encode(dataToSign);
                yield oSignedData.propset_Content(contentBase64);

                var sSignedMessage = yield oSignedData.SignCades(oSigner, CADESCOM_CADES_BES/*CADESCOM_CADES_X_LONG_TYPE_1*/, true);
                yield oStore.Close();

                args[1](sSignedMessage);
            }
            catch (e) {
                args[2]("Failed to create signature. Error: " + cadesplugin.getLastError(e))
            }
        }, certSubjectName, resolve, reject);
    });
}


function VerifyAsync(dataToVerify, sSignedMessage) {
    // var result = verifyNovikovServlet(dataToVerify, sSignedMessage);
    // result.then(function (value) {
    //     console.log("Verify Novikov servlet", value);
    // });

    /*result = verifyNovikovRest(dataToVerify, sSignedMessage);
    result.then(function (value) {
        console.log("Verify Novikov rest", value);
    });*/

    return verifyOnClient(dataToVerify, sSignedMessage);
    // result.then(function (value) {
    //     console.log("Verify on client", value);
    // });
}

function verifyOnClient(dataToVerify, sSignedMessage) {
    return new Promise(function (resolve, reject) {
        cadesplugin.async_spawn(function* (args) {
            try {
                var oSignedData = yield cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
                var dataToVerifyBase64 = Base64.encode(dataToVerify)
                yield oSignedData.propset_ContentEncoding(cadesplugin.CADESCOM_BASE64_TO_BINARY);
                yield oSignedData.propset_Content(dataToVerifyBase64);
                try {
                    yield oSignedData.VerifyCades(sSignedMessage, CADESCOM_CADES_BES/*CADESCOM_CADES_X_LONG_TYPE_1*/, true);
                } catch (err) {
                    alert("Failed to verify signature. Error: " + cadesplugin.getLastError(err));
                    args[1](false);
                }
                args[0](true);
            }
            catch (e) {

            }
        }, resolve, reject)
    });
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

function verifyNovikovRest(dataToVerify, sSignedMessage) {
    return new Promise(function (resolve, reject) {
        var content = Base64.encode(dataToVerify);
        var data = JSON.stringify({
            signature: sSignedMessage,
            content: content
        });
        $.ajax({
            contentType: 'application/json',
            data: data,
            dataType: 'json',
            success: function(data){
                resolve(data);
            },
            // processData: false,
            type: 'POST', cached: false,
            url: REST_URL
        });
    })
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

function _certToJSON(cert) {
    return new Promise(function (resolve, reject) {
        var thumbPromise = cert.Thumbprint;
        thumbPromise.then(function (thumb) {
            var stringPromise = cert.SubjectName;
            stringPromise.then(function (string) {
                //O=ANT-Inform, L=Saint Petersburg, CN=Nikolai Sergeevich Novikov, OU=Generic Department, C=RU, E=n.novikov@spb.ant-inform.ru, S=Saint Petersburg
                var cn = string.match(/CN=([^,]+)/);
                var e = string.match(/E=([^,]+)/);
                var name;

                if (cn && e) {
                    name = cn[1] + '(' + e[1] + ')';
                } else {
                    name = string.substring(0, 40);
                }
                resolve({thumb: thumb, name: name});
            })
        })
    })
}