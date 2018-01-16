var CadesConstants = {
    STORE: "CAdESCOM.Store",
    SIGNER: "CAdESCOM.CPSigner",
    SIGNED_DATA: "CAdESCOM.CadesSignedData",
    userStore: cadesplugin.CAPICOM_CURRENT_USER_STORE,
    MY_STORE: cadesplugin.CAPICOM_MY_STORE,
    STORE_MAXIMUM_ALLOWED: cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED,
    FIND_SUBJECT_NAME: cadesplugin.CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME,
    INCLUDE_WHOLE_CHAIN: cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN,
    BASE_64_TO_BINARY: cadesplugin.CADESCOM_BASE64_TO_BINARY,
    CADES_BES: cadesplugin.CADESCOM_CADES_BES,
};

var SignSync = function () {
    return {
        checkBrowserPlugin: function (callback) {
            new PluginSupportCheckerSync(callback).check();
        },
        findAllCertificates: function (callback) {
            new CertificatesLoaderSync(callback).load();
        },
        findCertificates: function (name, callback) {
            new CertificatesLoaderSync(name, callback).load();
        },
        signCreate: function (certSubjectName, dataToSign, callback) {
            new SignCreatorSync(certSubjectName, dataToSign, callback).sign();
        },
        signVerifyOnClient: function (signedData, signature, callback) {
            new SignVerifierSync(signedData, signature, callback).verify();
        },
        signVerifyRemote: function (signedData, signature, callback) {

        }
    }
};

function PluginSupportCheckerSync(callback) {
    return {
        callback: callback,
        check: function () {
            this.checkSync(this.callback);
        },
        checkSync: function (callback) {
            window.addEventListener("message", function (event) {
                    if (event.data == "cadesplugin_loaded") {
                        callback(true);
                    } else if (event.data == "cadesplugin_load_error") {
                        callback(false);
                    }
                },
                false);
            window.postMessage("cadesplugin_echo_request", "*");
        }
    }
}

function CertificatesLoaderSync(name, callback) {
    return {
        name: name,
        callback: callback,
        load: function () {
            this.loadSync(this.callback, this.name);
        },
        loadSync: function (callback, name) {
            var oStore = cadesplugin.CreateObject(CadesConstants.STORE);
            oStore.Open(CadesConstants.userStore, CadesConstants.MY_STORE, CadesConstants.STORE_MAXIMUM_ALLOWED);
            var oCertificates = oStore.Certificates.Find(CadesConstants.FIND_SUBJECT_NAME, name);
            if (oCertificates.Count == 0) {
                callback("Certificate not found");
            }
            callback(oCertificates);
            oStore.close();
        }
    }
}

function SignCreatorSync(certSubjectName, dataToSign, callback) {
    return {
        certSubjectName: certSubjectName,
        dataToSign: dataToSign,
        callback: callback,
        sign: function () {
            var props = this;
            new CertificatesLoaderSync(this.certSubjectName,this.certsLoadCallback(props)).load();
        },
        certsLoadCallback: function (props) {
            props = this;
            return function (certificates) {
                props.callback(props.signCreateSync(certificates, props.dataToSign));
            }
        },
        signCreateSync: function (certificates, dataToSign) {
            var oCertificate = certificates.Item(1);
            var oSigner = cadesplugin.CreateObject(CadesConstants.SIGNER);
            oSigner.CheckCertificate = false;
            oSigner.Options = cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN;
            oSigner.Certificate = oCertificate;

            var oSignedData = cadesplugin.CreateObject(CadesConstants.SIGNED_DATA);
            oSignedData.ContentEncoding = cadesplugin.CADESCOM_BASE64_TO_BINARY;
            var contentBase64 = Base64.encode(dataToSign);
            oSignedData.Content = contentBase64;
            var sSignedMessage = undefined;
            try {
                sSignedMessage = oSignedData.SignCades(oSigner, cadesplugin.CADESCOM_CADES_BES, true);
            } catch (err) {
                sSignedMessage = "Failed to create signature.";
            }
            return sSignedMessage;
        }
    }
}

function SignVerifierSync(dataToVerify, signature, callback) {
    return {
        dataToVerify: dataToVerify,
        signature: signature,
        callback: callback,
        verify: function () {
            var props = this;
            this.verifySync(props);
        },
        verifySync: function (props) {
            props.callback(props.getVerifyResult(props))
        },
        getVerifyResult: function(props) {
            var oSignedData = cadesplugin.CreateObject(CadesConstants.SIGNED_DATA);
            oSignedData.ContentEncoding = cadesplugin.CADESCOM_BASE64_TO_BINARY;
            var dataToVerifyBase64 = Base64.encode(props.dataToVerify);
            oSignedData.Content = dataToVerifyBase64;
            try {
                oSignedData.VerifyCades(props.signature, cadesplugin.CADESCOM_CADES_BES, true);
            } catch (err) {
                return false;
            }
            return true;
        }
    }
}

var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function (e) {
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
    },
    decode: function (e) {
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
    },
    _utf8_encode: function (e) {
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
    },
    _utf8_decode: function (e) {
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
};