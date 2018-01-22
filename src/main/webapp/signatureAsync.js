var SignAsync = function () {
    return {
        checkBrowserPlugin: function (callback) {
            new PluginSupportCheckerAsync(callback).check();
        },
        findCertificatesByName: function (name, callback) {
            new CertificatesLoaderAsync(name, "name", callback).load();
        },
        findCertificatesByThumbprint: function (thumb, callback) {
            new CertificatesLoaderAsync(name, "thumb", callback).load();
        },
        signCreate: function (certSubjectName, dataToSign, callback) {
            new SignCreatorAsync(certSubjectName, dataToSign, callback).sign();
        },
        signVerifyOnClient: function (signedData, signature, callback) {
            new SignVerifierAsync(signedData, signature, callback).verify();
        },
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

function CertificatesLoaderAsync(name, searchBy, callback) {
    var type = undefined;
    if (searchBy === "name")
        type = CadesConstants.FIND_SUBJECT_NAME;
    else
        type = CadesConstants.FIND_SHA1_HASH;
    return {
        type: type,
        name: name,
        callback: callback,
        load: function () {
            this.loadAsync();
        },
        loadAsync: function () {
            var props = this;
            this.loadCertsPromise(this.name, this.type).then(function (success) {
                props.getCertificatesAsync(success).then(
                    function (success) {
                        props.callback(success);
                    }
                )
            }, function (error) {
                props.callback(error);
            });
        },
        loadCertsPromise: function (name, type) {
            return new Promise(function (resolve, reject) {
                cadesplugin.async_spawn(function* (args) {
                    try {
                        var oStore = yield cadesplugin.CreateObjectAsync(CadesConstants.STORE);
                        yield oStore.Open(CadesConstants.userStore, CadesConstants.MY_STORE,
                            CadesConstants.STORE_MAXIMUM_ALLOWED);
                        var certificatesObject = yield oStore.Certificates;
                        var oCertificates = yield certificatesObject.Find(
                            type, args[2]);
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
        getCertificatesAsync: function (certificates) {
            var props = this;
            return new Promise(function (resolve, reject) {
                var result = [];
                var count = certificates.Count;
                count.then(function (countSuccess) {
                    var certToArray = function (certSuccess) {
                        props.certToJSONAsync(certSuccess).then(
                            function (certJsonSuccess) {
                                result.push(certJsonSuccess);
                            },
                            function (error) {
                                reject(error);
                            }
                        );
                    };
                    for (var i = 1; i <= countSuccess - 1; i++) {
                        certificates.Item(i).then(certToArray)
                    }
                    certificates.Item(countSuccess).then(function (certSuccess) {
                        props.certToJSONAsync(certSuccess).then(
                            function (certJsonSuccess) {
                                result.push(certJsonSuccess);
                                resolve(result);
                            },
                            function (error) {
                                reject(error);
                            }
                        );
                    })
                })
            })
        },
        certToJSONAsync: function (cert) {
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
    }
}

function SignCreatorAsync(certSubjectName, dataToSign, callback) {
    return {
        certSubjectName: certSubjectName,
        dataToSign: dataToSign,
        callback: callback,
        sign: function () {
            this.signAsync();
        },
        signAsync: function () {
            var certsPromise = new CertificatesLoaderAsync()
                .loadCertsPromise(this.certSubjectName, CadesConstants.FIND_SHA1_HASH);
            var props = this;
            certsPromise.then(function (certs) {
                var signPromise = props.signCreatePromise(certs, props.dataToSign);
                signPromise.then(function (sign) {
                    props.callback(sign);
                }, function (error) {
                    props.callback(error);
                })
            })
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