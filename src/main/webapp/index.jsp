<html>
<body>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script language="javascript" src="cadesplugin_api.js"></script>
<script language="javascript">
    var CADESCOM_CADES_X_LONG_TYPE_1 = 0x5d;
    var CADESCOM_CADES_BES = 1;
    var CAPICOM_CURRENT_USER_STORE = 2;
    var CAPICOM_MY_STORE = "My";
    var CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
    var CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME = 1;

    function SignCreate(certSubjectName, dataToSign) {
        return new Promise(function (resolve, reject) {
            cadesplugin.async_spawn(function* (args) {
                try {
                    var oStore = yield cadesplugin.CreateObjectAsync("CAdESCOM.Store");
                    yield oStore.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE,
                        CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

                    var CertificatesObj = yield oStore.Certificates;
                    var oCertificates = yield CertificatesObj.Find(
                        CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME, certSubjectName);

                    var Count = yield oCertificates.Count;
                    if (Count == 0) {
                        throw("Certificate not found: " + args[0]);
                    }
                    var oCertificate = yield oCertificates.Item(1);
                    var oSigner = yield cadesplugin.CreateObjectAsync("CAdESCOM.CPSigner");
                    yield oSigner.propset_Certificate(oCertificate);

                    var oSignedData = yield cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
                    yield oSignedData.propset_Content(dataToSign);

                    var sSignedMessage = yield oSignedData.SignCades(oSigner, CADESCOM_CADES_BES);

                    yield oStore.Close();

                    args[2](sSignedMessage);
                }
                catch (e) {
                    args[3]("Failed to create signature. Error: " + cadesplugin.getLastError(err));
                }
            }, certSubjectName, dataToSign, resolve, reject);
        });
    }

    function run() {
        var oCertName = document.getElementById("CertName");
        var sCertName = /*oCertName.value*/"pavel";
        if ("" == sCertName) {
            alert("Введите имя сертификата (CN).");
            return;
        }
        var message = document.getElementById("text").value;
        var thenable = SignCreate(sCertName, message);

        thenable.then(
            function (result) {
                document.getElementById("signature").innerHTML = result;
                $.post("sign",
                    {
                        signature: result
                    },
                    function (data, status) {
                        alert("Data: " + data + "\nStatus: " + status);
                    });
            },
            function (result) {
                document.getElementById("signature").innerHTML = result;
            });
    }


    function sign() {
        cadesplugin.then(function () {
                console.log("YES");
                run();
            },
            function (error) {
                console.log("NO");
            }
        );
    }

    function Verify(sSignedMessage) {

        var oSignedData2 = cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
        oSignedData2.then(function (value) {
            try {
                console.log(oSignedData2);
                value.VerifyCades(sSignedMessage, CADESCOM_CADES_X_LONG_TYPE_1);

            } catch (err) {
                alert("Failed to verify signature. Error: " + cadesplugin.getLastError(err));
                return false;
            }
            return true;
        },
        function (reason) {
            alert("Can not verify sign", reason)
        });
    }

    function verifySign() {
        var signedMessage = document.getElementById("signature").innerHTML;
        console.log(signedMessage);
        console.log(Verify(signedMessage));
    }

</script>
<h2>Hello</h2>
<input type="text" id="text" placeholder="enter text">
<button onclick="sign()">Sign</button>
<button onclick="verifySign()">Verify</button>
<br>
<textarea id="signature" style="width: 580px; height: 200px"></textarea>
<br>
<script type="application/javascript">
    function startUpload() {
        document.getElementById('uploadProcess').style.visibility = 'visible';
        return true;
    }
</script>
<p id="uploadProcess" style="visibility: hidden">Loading...</p>
<form action="upload" method="post"
      enctype="multipart/form-data"
      target="uploadTarget"
      onsubmit="startUpload()">
    <input type="file" name="file" size="100"/>
    <br/>
    <input type="submit" value="Upload File"/>
</form>
<iframe id="uploadTarget" name="uploadTarget" src="#" style="width:0;height:0;border:0px solid #fff;"></iframe>
</body>
</html>
