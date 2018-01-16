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