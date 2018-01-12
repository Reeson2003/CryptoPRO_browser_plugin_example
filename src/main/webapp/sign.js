var CADESCOM_CADES_BES = 1;
var CAPICOM_CURRENT_USER_STORE = 2;
var CAPICOM_MY_STORE = "My";
var CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
var CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME = 1;
var CADESCOM_BASE64_TO_BINARY = 1;


function SignCreate(certSubjectName, dataToSign) {
    var oStore = cadesplugin.CreateObjectAsync("CAdESCOM.Store");
    oStore.then(function (oStoreResult) {
        oStoreResult.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE,
            CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

        var oCertificates = oStoreResult.Certificates.Find(
            CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME, certSubjectName);
        if (oCertificates.Count == 0) {
            alert("Certificate not found: " + certSubjectName);
            return;
        }
        var oCertificate = oCertificates.Item(1);
        var oSigner = cadesplugin.CreateObjectAsync("CAdESCOM.CPSigner");
        oSigner.then(function (oSignerResult) {
            oSignerResult.Certificate = oCertificate;

            var oSignedData = cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
            oSignedData.then(function (oSignedDataResult) {
                // Значение свойства ContentEncoding должно быть задано
                // до заполнения свойства Content
                oSignedDataResult.ContentEncoding = CADESCOM_BASE64_TO_BINARY;
                oSignedDataResult.Content = dataToSign;

                var sSignedMessage = "";
                try {
                    sSignedMessage = oSignedData.SignCades(oSigner, CADESCOM_CADES_BES, true);
                } catch (err) {
                    alert("Failed to create signature. Error: " + cadesplugin.getLastError(err));
                    return;
                }

                oStore.Close();

                return sSignedMessage;
            })
        })
    })
}

function Verify(sSignedMessage, dataToVerify) {
    var oSignedData = cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
    oSignedData.then(function (oSignedDataResult) {
        try {
            // Значение свойства ContentEncoding должно быть задано
            // до заполнения свойства Content
            oSignedDataResult.ContentEncoding = CADESCOM_BASE64_TO_BINARY;
            oSignedDataResult.Content = dataToVerify;
            oSignedDataResult.VerifyCades(sSignedMessage, CADESCOM_CADES_BES, true);
        } catch (err) {
            alert("Failed to verify signature. Error: " + cadesplugin.getLastError(err));
            return false;
        }

        return true;
    })
}

function run() {
    var oCertName = document.getElementById("CertName");
    var sCertName = oCertName.value; // Здесь следует заполнить SubjectName сертификата
    if ("" == sCertName) {
        alert("Введите имя сертификата (CN).");
        return;
    }
    // Предварительно закодированные в BASE64 бинарные данные
    // В данном случае закодирована строка "Some Data."
    var dataInBase64 = "U29tZSBEYXRhLg==";

    // Подписаны будут исходные бинарные данные (в данном случае - "Some Data.")
    // Такая подпись должна проверяться в КриптоАРМ и cryptcp.exe
    var signedMessage = SignCreate(sCertName, dataInBase64);

    document.getElementById("signature").innerHTML = signedMessage;

    var verifyResult = Verify(signedMessage, dataInBase64);
    if (verifyResult) {
        alert("Signature verified");
    }
}