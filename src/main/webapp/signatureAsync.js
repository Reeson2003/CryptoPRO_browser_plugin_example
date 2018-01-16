var SignAsync = function () {
    return {
        checkBrowserPlugin: function (callback) {
            new PluginSupportCheckerAsync(callback).check();
        },
        findAllCertificates: function (callback) {
            new CertificatesLoaderAsync(callback).load();
        },
        findCertificates: function (name, callback) {
            new CertificatesLoaderAsync(name, callback).load();
        },
        signCreate: function (certSubjectName, dataToSign, callback) {
            new SignCreatorAsync(certSubjectName, dataToSign, callback).sign();
        },
        signVerifyOnClient: function (signedData, signature, callback) {
            new SignVerifierAsync(signedData, signature, callback).verify();
        },
        signVerifyRemote: function (signedData, signature, callback) {

        }
    }
};

function PluginSupportCheckerAsync(callback) {
    return {
        callback: callback,
        check: function () {
            this.checkAsync(this.callback);
        },
        checkAsync: function (callback) {
            cadesplugin.then(function () {
                    callback(true);
                },
                function () {
                    callback(false);
                }
            );
        }
    }
}

function CertificatesLoaderAsync(name, callback) {
    return {
        name: name,
        callback: callback,
        load: function () {
            this.loadAsync(props);
        },
        loadAsync: function () {
            var props = this;
            this.loadCertsPromise(this.name).then(function (success) {
                props.callback(success);
            }, function (error) {
                props.callback(error);
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
        }
    }
}

function SignCreatorAsync(certSubjectName, dataToSign, callback) {
    return {
        certSubjectName: certSubjectName,
        dataToSign: dataToSign,
        callback: callback,
        sign: function () {
            new CertificatesLoaderAsync(this.certSubjectName, this.certsLoadCallback()).loadAsync();
        },
        certsLoadCallback: function () {
            var props = this;
            return function (certificates) {
                props.signCreateAsync(certificates, props.dataToSign).then(function (success) {
                    props.callback(success);
                }, function (error) {
                    props.callback(error);
                });
            }
        },
        signCreateAsync: function (certificates, dataToSign) {
            return this.signCreatePromise(certificates, dataToSign);
        },
        signCreatePromise: function (certificates, dataToSign) {
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
        }
    }
}

function SignVerifierAsync(dataToVerify, signature, callback) {
    return {
        dataToVerify: dataToVerify,
        signature: signature,
        callback: callback,
        verify: function () {
            var props = this;
            this.verifyAsync(props);
        },
        verifyAsync: function (props) {
            props.signVerifyPromise(props).then(
                function (success) {
                    props.callback(success);
                },
                function (error) {
                    props.callback(error);
                }
            )
        },
        signVerifyPromise: function (props) {
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
                    } catch (err) {
                        args[1](err);
                    }
                }, resolve, reject, props.dataToVerify, props.signature)
            });
        },
    }
}