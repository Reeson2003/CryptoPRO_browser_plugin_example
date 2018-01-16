var CADESCOM_CADES_BES = 1;
var CAPICOM_CURRENT_USER_STORE = 2;
var CAPICOM_MY_STORE = "My";
var CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
var CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME = 1;
var CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN = 1;

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

var Sign = function () {
    return {
        checkBrowserPlugin: function (callback) {
            new PluginSupportChecker().check(callback);
        },
        findAllCertificates: function (callback) {
            new CertificatesLoader(callback).load();
        },
        findCertificates: function(name, callback) {
            new CertificatesLoader(callback).load(name);
        },
        signCreate: function (certSubjectName, dataToSign, callback) {
            new SignCreator(certSubjectName, dataToSign, callback).sign();
        },
        signVerifyOnClient: function (signedData, signature, callback) {
            new SignVerifier(signedData, signature, callback).verify();
        },
        signVerifyRemote: function (signedData, signature, callback) {

        }
    }
}

function isPromiseSupported() {
    return (typeof Promise !== "undefined" && Promise.toString().indexOf("[native code]") !== -1);
}

function PluginSupportChecker() {
    return {
        check: function (callback) {
            var props = this;
            if (isPromiseSupported()) {
                this.promiseSupported(callback);
            } else {
                this.promiseUnsupported(callback);
            }
        },
        promiseSupported: function (callback) {
            cadesplugin.then(function () {
                    callback(true);
                },
                function () {
                    callback(false);
                }
            );
        },
        promiseUnsupported: function (callback) {
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

function CertificatesLoader(name) {
    return {
        name: name,
        load: function (callback) {
            if (isPromiseSupported()) {
                this.promiseSupported(callback, this.name);
            } else {
                this.promiseUnsupported(callback, this.name);
            }
        },
        promiseSupported: function (callback, name) {
            this.loadCertsPromise(name).then(function (success) {
                callback(success);
            }, function (error) {
                callback(error);
            });
        },
        loadCertsPromise: function (name) {
            return new Promise(function (resolve, reject) {
                cadesplugin.async_spawn(function* (args) {
                    try {
                        var oStore = yield cadesplugin.CreateObjectAsync(CadesConstants.STORE);
                        yield oStore.Open(CadesConstants.userStore, CadesConstants.MY_STORE,
                            CadesConstants.STORE_MAXIMUM_ALLOWED);
                        var certificatesObject = yield oStore.Certificates;
                        var oCertificates = yield certificatesObject.Find(
                            CadesConstants.FIND_SUBJECT_NAME, args[2]);
                        var Count = yield oCertificates.Count;
                        if (Count == 0) {
                            args[1]("Certificates not found")
                        }
                        args[0](oCertificates);
                    } catch (err) {
                        args[1](err);
                    } finally {
                        oStore.Close();
                    }
                }, resolve, reject, name);
            })
        },
        promiseUnsupported: function (callback, name) {
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

function SignCreator(certSubjectName, dataToSign, callback) {
    return {
        certSubjectName: certSubjectName,
        dataToSign: dataToSign,
        callback: callback,
        sign: function () {
            new CertificatesLoader(this.certSubjectName).load(this.certsLoadCallback());
        },
        certsLoadCallback: function (props, callback) {
            props = this;
            return function (certificates) {
                if (isPromiseSupported()) {
                    props.signCreateAsync(certificates, props.dataToSign).then(function (success) {
                        props.callback(success);
                    }, function (error) {
                        props.callback(error);
                    });
                } else {
                    callback(props.signCreateSync(certificates, props.dataToSign));
                }
            }
        },
        signCreateAsync: function (certificates, dataToSign) {
            return new Promise(function (resolve, reject) {
                cadesplugin.async_spawn(function* (args) {
                    try {
                        var oCertificate = yield args[2].Item(1);
                        var oSigner = yield cadesplugin.CreateObjectAsync(CadesConstants.SIGNER);
                        yield oSigner.propset_CheckCertificate(false);
                        yield oSigner.propset_Options(CadesConstants.INCLUDE_WHOLE_CHAIN);
                        yield oSigner.propset_Certificate(oCertificate);

                        var oSignedData = yield cadesplugin.CreateObjectAsync(CadesConstants.SIGNED_DATA);
                        yield oSignedData.propset_ContentEncoding(CadesConstants.BASE_64_TO_BINARY);
                        var dataToSign = args[3];
                        var contentBase64 = Base64.encode(dataToSign);
                        yield oSignedData.propset_Content(contentBase64);
                        var sSignedMessage = yield oSignedData.SignCades(oSigner, CadesConstants.CADES_BES, true);
                        args[0](sSignedMessage);
                    }
                    catch (e) {
                        args[1]("Failed to create signature. Error: " + cadesplugin.getLastError(e))
                    }
                }, resolve, reject, certificates, dataToSign);
            });
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
            oStore.Close();
            return sSignedMessage;
        }
    }
}

function SignVerifier(dataToVerify, signature, callback) {
    return {
        dataToVerify: dataToVerify,
        signature: signature,
        callback: callback,
        verify: function () {
            var props = this;
            if (isPromiseSupported()) {
                this.verifyAsync(props);
            } else {
                this.verifySync(props);
            }
        },
        verifyAsync: function (props) {
            props.verifyPromise(props).then(
                function (success) {
                    props.callback(success);
                },
                function (error) {
                    props.callback(error);
                }
            )
        },
        verifyPromise: function (props) {
            return new Promise(function (resolve, reject) {
                cadesplugin.async_spawn(function* (args) {
                    try {
                        var dataToVerify = args[2];
                        var signature = args[3];
                        var oSignedData = yield cadesplugin.CreateObjectAsync(CadesConstants.SIGNED_DATA);
                        var dataToVerifyBase64 = Base64.encode(dataToVerify);
                        yield oSignedData.propset_ContentEncoding(CadesConstants.BASE_64_TO_BINARY);
                        yield oSignedData.propset_Content(dataToVerifyBase64);
                        try {
                            yield oSignedData.VerifyCades(signature, CadesConstants.CADES_BES, true);
                        } catch (err) {
                            args[1](false);
                        }
                        args[0](true);
                    }catch (err) {
                        args[1](err);
                    }
                }, resolve, reject, props.dataToVerify, props.signature)
            });
        },
        verifySync: function (props) {
            props.callback(props.getVerifyResult(props))
        },
        getVerifyResult(props) {
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