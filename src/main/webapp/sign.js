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
    oSigner.Certificate = oCertificate;
    oSigner.TSAAddress = "http://cryptopro.ru/tsp/";

    var oSignedData = cadesplugin.CreateObject("CAdESCOM.CadesSignedData");
    oSignedData.Content = dataToSign;

    try {
        var sSignedMessage = oSignedData.SignCades(oSigner, CADESCOM_CADES_X_LONG_TYPE_1);
    } catch (err) {
        alert("Failed to create signature. Error: " + cadesplugin.getLastError(err));
        return;
    }

    oStore.Close();

    return sSignedMessage;
}

function Verify(sSignedMessage) {
    var oSignedData = cadesplugin.CreateObject("CAdESCOM.CadesSignedData");
    try {
        oSignedData.VerifyCades(sSignedMessage, CADESCOM_CADES_X_LONG_TYPE_1);
    } catch (err) {
        alert("Failed to verify signature. Error: " + cadesplugin.getLastError(err));
        return false;
    }

    return true;
}

function run() {
    var oCertName = document.getElementById("CertName");
    var sCertName = "Pavel"; //oCertName.value; // Здесь следует заполнить SubjectName сертификата
    if ("" == sCertName) {
        alert("Введите имя сертификата (CN).");
        return;
    }
    var signedMessage = SignCreate(sCertName, "Message");

    document.getElementById("signature").innerHTML = signedMessage;

    var verifyResult = Verify(signedMessage);
    if (verifyResult) {
        alert("Signature verified");
    }
}