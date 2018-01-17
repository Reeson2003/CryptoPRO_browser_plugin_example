<html>
<head>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <script language="JavaScript" src="../../base64.js"></script>
    <script language="javascript" src="../../cadesplugin_api.js"></script>
    <script language="javascript" src="../../signature.js"></script>
    <script language="JavaScript" src="../../signatureConstants.js"></script>
    <script language="JavaScript" src="../../signatureAsync.js"></script>
    <script language="JavaScript" src="../../signatureSync.js"></script>
</head>
<body>
<script language="javascript">

    var certThumbprint = undefined;

    function loadCertificates() {
        new Sign().findAllCertificates(function (certificates) {
            var certListElems = getCertificatesList(certificates);
            getCertificatesElement().innerHTML = certListElems.join("");
        })
    }

    function getCertificatesList(certificatesArray) {
        var result = [];
        certificatesArray.forEach(function (element) {
            result.push(convertToListElement(element.name, element.thumb));
        });
        return result;
    }

    function setCertificateThumbprint(thumb) {
        certThumbprint = thumb;
    }

    function convertToListElement(text, thumb) {
        return "<li onclick='setCertificateThumbprint(\"" + thumb + "\")'>" + text + "<br>" + thumb + "</li>";
    }

    function sign() {
        if (certThumbprint) {
            var sCertName = certThumbprint;
            var text = getTextToSign();
            new Sign().signCreate(sCertName, text, function (signature) {
                getSignatureElement().innerHTML = signature;
            });
        }
    }

    function getCertificatesElement() {
        return document.getElementById("certificates_list");
    }

    function getTextToSign() {
        return document.getElementById("text").value;
    }

    function getSignatureElement() {
        return document.getElementById("signature");
    }

    function getVerifyResultElement() {
        return document.getElementById("verifyResult");
    }

    function verifySign() {
        var signedMessage = getSignatureElement().innerHTML;
        var text = getTextToSign();
        var sign = new Sign();
        sign.signVerifyOnClient(text, signedMessage, function (result) {
            getVerifyResultElement().innerHTML = result;
        });
    }

</script>
<button onclick="loadCertificates()">Load certificates</button>
<div id="certificates">
    <ul id="certificates_list"></ul>
</div>
<input type="text" id="text" placeholder="enter text" value="Message">
<button onclick="sign()">Sign</button>
<button onclick="verifySign()">Verify</button>
<span id="verifyResult"></span>
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
