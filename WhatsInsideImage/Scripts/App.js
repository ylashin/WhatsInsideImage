"use strict";

(function () {
    var appUrl;
    var hostUrl;
    var listItemId;
    var listId;

    var rawImageContents;
    var fileName;

    $(function () {        
        appUrl = GetUrlKeyValue("SPAppWebUrl");
        hostUrl = GetUrlKeyValue("SPHostUrl");
        var listItemIds = GetUrlKeyValue("SPListItemId");
        listId = GetUrlKeyValue("SPListId");

        listId = listId.replace("{", "").replace("}", "");

        if (!listItemIds) {
            return;
        }

        listItemId = listItemIds.split(",")[0]; // I will just work with first image for now
        // multiple images not supported

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
            appUrl, hostUrl, listId, listItemId);

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
            appUrl, hostUrl, listId, listItemId);
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
        };

        oReq.send();
        $("#s4-ribbonrow").hide();
    }



    function describeImage() {
        var formData = new FormData();

        var re = /(?:\.([^.]+))?$/;
        var ext = re.exec(fileName)[1];
        var blob = new Blob([rawImageContents], { type: "image/" + ext }); // simplistic
        var newFileName = (Math.random() * 10000000).toFixed().toString() + "." + ext;
        formData.append(newFileName, blob, newFileName);
        jQuery.ajax({
            url: "http://localhost:5001/api/describe",
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
                $("#btnApply").show();

                $("#btnApply").click(function () {
                    applyDescription();
                });
            }
        });
    }

    function applyDescription() {        

        var url = String.format("{0}/_api/SP.AppContextSite(@target)/" +
            "Web/Lists(guid'{2}')/Items({3})/?@target='{1}'",
            appUrl, hostUrl, listId, listItemId);

        var body = JSON.stringify({ '__metadata': { 'type': 'SP.Data.My_x0020_PicturesItem' }, 'Caption': $("#descriptions").val() });
        jQuery.ajax({
            url: url,
            type: "POST",
            data: body,
            headers: {
                "Accept": "application/json; odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "IF-MATCH": "*",
                "X-HTTP-Method":"MERGE",                
                "content-type": "application/json;odata=verbose"
            },
            success: function (result) {
                alert("Image description has been updated");
            },
            error: function(error)
            {
                console.error(error);
                alert("Error happened while saving image description");
            }
        });       
    }   
    

})();






