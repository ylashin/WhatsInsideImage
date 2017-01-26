"use strict";

(function () {
    var appUrl;
    var hostUrl;
    var listItemIds;
    var listId;

    var rawImageContents;
    var fileName;

    $(function () {
        //1loadScripts();
        appUrl = GetUrlKeyValue("SPAppWebUrl");
        hostUrl = GetUrlKeyValue("SPHostUrl");
        listItemIds = GetUrlKeyValue("SPListItemId");
        listId = GetUrlKeyValue("SPListId");

        listId = listId.replace("{", "").replace("}", "");

        if (!listItemIds) {
            listItemIds = "1";// "Addin is installed. Please use it from the ribbon of a picture library!";
            listId = "DCACEC82-6E8A-4758-9B3E-BC33F9951CC0";
        }
        initializePage();

    });

    function bufferToBase64(buf) {
        var binstr = Array.prototype.map.call(buf, function (ch) {
            return String.fromCharCode(ch);
        }).join("");
        return btoa(binstr);
    }

    function initializePage() {
        
        var url = String.format("{0}/_api/SP.AppContextSite(@target)/" +
            "Web/Lists(guid'{2}')/Items({3})/File/?@target='{1}'",
            appUrl, hostUrl, listId, listItemIds);

        jQuery.ajax({
            url: url,
            type: "GET",
            headers: { "Accept": "application/json; odata=verbose" },
            success: function (result) {
                fileName = result.d.Name;
                console.log(fileName);
                loadBinaryContents();
            }
        });
        
    }

    function loadBinaryContents() {
        var url = String.format("{0}/_api/SP.AppContextSite(@target)/" +
            "Web/Lists(guid'{2}')/Items({3})/File/$value?@target='{1}'",
            appUrl, hostUrl, listId, listItemIds);
        var oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function (oEvent) {
            var arrayBuffer = oReq.response;
            rawImageContents = new Uint8Array(arrayBuffer);
            var b64 = bufferToBase64(rawImageContents);
            var dataUrl = "data:image/jpg;base64," + b64; // we can inspect file metadata for correct image type
            var img = $('<img id="selectedImage">');
            img.attr("src", dataUrl);
            img.attr("style", "width:700px;height:466px");
            img.appendTo("#addin-main-contents");

            $("#describe-actions").show();

            $("#btnDescribe").click(function () {
                describeImage();
            });
            $("#btnApply").click(function () {
                applyDescription();
            });
        };

        oReq.send();
        $("#s4-ribbonrow").hide();
    }

    function describeImage() {
        var formData = new FormData();
        var blob = new Blob([rawImageContents], { type: "image/jpeg" });
        formData.append("file.jpg", blob, "file.jpg");
        jQuery.ajax({
            url: "http://192.168.1.6:5001/api/describe",
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            type: "POST",
            success: function (result) {
                var options = "";
                for (var i = 0; i < result.length; i++) {
                    options += '<option value="' + result[i] + '">' + result[i] + "</option>";
                }
                $("#descriptions").append(options);
                $("#selections-section").show();
            }
        });
    }

    function applyDescription() {
        console.log($("#descriptions").val());

        /*
         url: http://site url/_api/web/lists/GetByTitle(‘Test')/items(item id)
method: POST
body: { '__metadata': { 'type': 'SP.Data.TestListItem' }, 'Title': 'TestUpdated'}
headers:
    Authorization: "Bearer " + accessToken
     X-RequestDigest: form digest value
    "IF-MATCH": etag or "*"
    "X-HTTP-Method":"MERGE",
    accept: "application/json;odata=verbose"
    content-type: "application/json;odata=verbose"
    content-length:length of post body
         */
    }


    
    

})();






