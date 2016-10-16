function blurUnscannedImages() {
    // Probe all image tags
    var images = document.getElementsByTagName("img");

    // Create an array with single objects so I can splice it later
    var images_to_remove = [];

    // Go through images array, then put all images with right formats to images_to_remove
    for (var i = 0; i < images.length; i++) {
        if (!(images[i].hasAttribute("_SafeSpace_scanned") || images[i].hasAttribute("_SafeSpace_blurred"))) {

            isImageValid = false;
            var filetype = images[i].src.split(".");
            filetype = filetype[filetype.length - 1];
            if (filetype.substring(0,3) == "jpg" || filetype.substring(0,4) == "jpeg" || filetype.substring(0,3) == "png") {
                isImageValid = true;
            }
            if (images[i].src != null && isImageValid) {
                images[i].style.cssText = "filter: blur(10px);";
                images[i].setAttribute("_SafeSpace_blurred", true);
                if (unscanned_images.length < 60 && !unscanned_images.includes(images[i])) {
                    unscanned_images.push(images[i]);
                } else if (unscanned_images.length > 59) {
                    var new_array = unscanned_images.slice();
                    searchCategories(new_array);
                    unscanned_images = [];
                }
            }
        }
    }
}

function searchCategories(arr) {
    chrome.storage.sync.get({"nsfw" : true, "custom_list" : ["Shark", "Spider"]}, function (obj) {
        if (obj.nsfw) {
            setTimeout(predictNSFW.bind(null, arr), howManySearches * 100);
            howManySearches++;
        }
//        if (obj.custom_list.length > 0) {
//            setTimeout(searchCustomList.bind(null, arr, obj.custom_list), howManySearches * 300);
//            howManySearches++;
//        }
    });
}
//
//function searchCustomList(images_to_remove, custom_list) {
//    // Prepare an array with URLs to pass to Clarifai.
//    var image_urls = [];
//
//    // Go through images_to_remove and remove src.
//    for (var i = 0; i < images_to_remove.length; i++) {
//        var isImageValid = false;
//        var url;
//        // Check if there is anchor to it.
//        var parentAnchor = images_to_remove[i].closest("a");
//        url = images_to_remove[i].src;
//        if (parentAnchor != null && parentAnchor.getAttribute("href") != null) {
//            url = parentAnchor.getAttribute("href");
//            var filetype = url.split(".");
//            filetype = filetype[filetype.length - 1];
//            if (filetype.substring(0,3) == "jpg" || filetype.substring(0,4) == "jpeg" || filetype.substring(0,3) == "png") {
//                console.log("Using Real Image...");
//            } else {
//                url = images_to_remove[i].src;
//            }
//        }
//
//        if (url.substring(0, 2) == "//") {
//            url = "http:" + url;
//        }
//
//        image_urls.push(url);
//    }
//
//    // Send image_urls and check for custom_list status.
//    app.models.predict(Clarifai.GENERAL_MODEL, image_urls).then(
//        function(response) {
//            console.log(response);
//            howManySearches--;
//            var outputs = response.data.outputs;
//
//            for (var i = 0; i < outputs.length; i++) {
//
//                // Check for null. Needs this or else code stops on error.
//                var percent = 0;
//                for (var j = 0; j < outputs[i].data.concepts.length; j++) {
//                    for (var k = 0; k < custom_list.length; k++) {
//                        if (outputs[i].data.concepts[j].name === custom_list[k].toLowerCase()) {
//                            if (percent < outputs[i].data.concepts[j].value)
//                                percent = outputs[i].data.concepts[j].value;
//                        }
//                    }
//                }
//
//                // if its detected content, leave image blurred.
//                if (percent > 0.75) {
//                    images_to_remove[i].setAttribute("_SafeSpace_Blurthis", true);
//                } else {
//                    if (!images_to_remove[i].hasAttribute("_SafeSpace_Blurthis"))
//                        images_to_remove[i].setAttribute("_SafeSpace_noBlurthis", true);
//                }
//                images_to_remove[i].setAttribute("_SafeSpace_scanned", true);
//            }
//        },
//        function(err) {
//            console.log(err);
//        }
//    );
//}

function predictNSFW(images_to_remove) {
    walk(document.body);

    // Prepare an array with URLs to pass to Clarifai.
    var image_urls = [];

    // Go through images_to_remove and remove src.
    for (var i = 0; i < images_to_remove.length; i++) {
        var isImageValid = false;
        var url;
        // Check if there is anchor to it.
        var parentAnchor = images_to_remove[i].closest("a");
        url = images_to_remove[i].src;
        if (parentAnchor != null && parentAnchor.getAttribute("href") != null) {
            url = parentAnchor.getAttribute("href");
            var filetype = url.split(".");
            filetype = filetype[filetype.length - 1];
            if (filetype.substring(0,3) == "jpg" || filetype.substring(0,4) == "jpeg" || filetype.substring(0,3) == "png") {
                //console.log("Using Real Image...");
            } else {
                url = images_to_remove[i].src;
            }
        }

        if (url.substring(0, 2) == "//") {
            url = "http:" + url;
        }
        image_urls.push(url);
    }

    // Send image_urls and check for NSFW status.
    app.models.predict(Clarifai.NSFW_MODEL, image_urls).then(
        function(response) {
            console.log(response);
            howManySearches--;
            var outputs = response.data.outputs;

            for (var i = 0; i < outputs.length; i++) {

                // Check for null. Needs this or else code stops on error.
                var nsfwpercent = 0;
                var nsfwindex = 0;
                if (outputs[i].data.concepts[0].name === "nsfw") {
                } else {
                    nsfwindex++;
                }
                nsfwpercent = outputs[i].data.concepts[nsfwindex].value;

                // if its NSFW content, leave image blurred.
                if (nsfwpercent < 0.75) {
                    images_to_remove[i].style.cssText = "";
                }
                images_to_remove[i].setAttribute("_SafeSpace_scanned", true);
            }
        },
        function(err) {
            console.log(err);
        }
    );
}

function walk(node) 
{
    var child, next;
	
    //if (!node.tagName || node.tagName.toLowerCase() === 'input'
//	     || node.tagName.toLowerCase() === 'textarea'
//	     || node.classList.contains('ace_editor')) {
//		return;
//    }
    //console.log(node.nodeType);
    child = node.firstChild;
    if (!child && node.textContent !== "" && node.nodeType === 3) {
        handleText(node);
    }
    while ( child ) {
        next = child.nextSibling;
        walk(child);
        child = next;
    }
}

//node.innerText
function handleText(node) 
{
    var v = node.textContent;
    var regexp;
    chrome.storage.sync.get({"swears": true, "slurs": true}, function(items){
        if (items.swears) {
            for (var i = 0; i < swearwords.length; i++) {
                    regexp = new RegExp("\\b"+swearwords[i]+"\\b", "gi");
                    v = v.replace(regexp, "XXXXXX");
                }
        }
        if (items.slurs) {
            for (var i = 0; i < slurwords.length; i++) {
                    regexp = new RegExp("\\b"+slurwords[i]+"\\b", "gi");
                    v = v.replace(regexp, "YYYYYY");
                }
        }
        node.textContent = v;
        // node.style.color = 'red';
    });
}

var app = new Clarifai.App("RurVN490s-Ff8HWyCT4CbY1htejSJR9RYOPop-aR","skxEFbPFDkVKQdvJVumHwVnUgiVoList5_SYV3jB");

var unscanned_images = [];

var howManySearches = 0;

function scanAfterIdle() {
    if (unscanned_images.length > 0) {
        new_array = unscanned_images.slice();
        searchCategories(new_array);
        unscanned_images = [];
    }
}

setInterval(scanAfterIdle, 200);

document.addEventListener("DOMNodeInserted", function() {
    blurUnscannedImages();
});

