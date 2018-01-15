<html>
<body>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script language="javascript" src="cadesplugin_api.js"></script>
<script language="JavaScript" src="signAsync.js"></script>
<script language="javascript">

    function sign() {
        var sCertName = "Test";
        var text = getTextToSign();
        var thenable = SignCreate(sCertName, text);
        thenable.then(function (value) {
            var signedMessage = value;
            getSignatureElement().innerHTML = signedMessage;
        }, function (reason) {
            console.log(reason);
        });
    }

    function getTextToSign() {
        return document.getElementById("text").value;
    }

    function getSignatureElement() {
        return document.getElementById("signature");
    }

    function verifySign() {
        var signedMessage = getSignatureElement().innerHTML;
        // console.log(Verify(signedMessage));
        console.log(getTextToSign());
        Verify(getTextToSign() ,signedMessage);
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
