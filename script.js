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
                    var new_array = unscanned_images.slice(0);
                    searchCategories(new_array);
                    unscanned_images = [];
                }
            }
        }
    }
}

function searchCategories(arr) {
    chrome.storage.sync.get({"nsfw" : true, "bans" : ""}, function (obj) {
        var images_to_remove_queue = arr.slice(0);
        prepareImgURLs(images_to_remove_queue);

        if (obj.nsfw) {
            censorNSFW = true;
            predictNSFW(images_to_remove_queue);
            // setTimeout(predictNSFW.bind(null, arr), howManySearches * 100);
            howManySearches++;
        } else {
            censorNSFW = false;
        }

        custom_list = obj.bans.split(" ");
        if (custom_list.length > 0) {
            censorCustom = true;
            searchCustomList(images_to_remove_queue, custom_list);
            // setTimeout(searchCustomList.bind(null, arr, custom_list), howManySearches * 100);
            howManySearches++;
        } else {
            censorCustom = false;
        }
    });
}

function prepareImgURLs(arrrr) {
    // Prepare an array with URLs to pass to Clarifai.
    _image_urls = [];

    // Go through images_to_remove and remove src.
    for (var i = 0; i < arrrr.length; i++) {
        var isImageValid = false;
        var url;
        // Check if there is anchor to it.
        var parentAnchor = arrrr[i].closest("a");
        url = arrrr[i].src;
        if (parentAnchor != null && parentAnchor.getAttribute("href") != null) {
            url = parentAnchor.getAttribute("href");
            var filetype = url.split(".");
            filetype = filetype[filetype.length - 1];
            if (filetype.substring(0,3) == "jpg" || filetype.substring(0,4) == "jpeg" || filetype.substring(0,3) == "png") {
                //console.log("Using Real Image...");
            } else {
                url = arrrr[i].src;
            }
        }

        if (url.substring(0, 2) == "//") {
            url = "http:" + url;
        }
        _image_urls.push(url);
    }
}


function searchCustomList(itr, custom_list) {

    // Send image_urls and check for custom_list status.
    app.models.predict(Clarifai.GENERAL_MODEL, _image_urls).then(
        function(response) {
            howManySearches--;
            var outputs = response.data.outputs;

            for (var i = 0; i < outputs.length; i++) {

                // Check for null. Needs this or else code stops on error.
                var percent = 0;
                for (var j = 0; j < outputs[i].data.concepts.length; j++) {
                    for (var k = 0; k < custom_list.length; k++) {
                        if (outputs[i].data.concepts[j].name === custom_list[k].toLowerCase()) {
                            if (percent < outputs[i].data.concepts[j].value)
                                percent = outputs[i].data.concepts[j].value;
                        }
                    }
                }

                // if its detected content, leave image blurred.
                if (percent > 0.75) {
                    itr[i].setAttribute("_blur_custom", true);
                    // console.log("Censored by custom list!");
                } else {
                    itr[i].setAttribute("_no_blur_custom", true);
                    // console.log("Passed custom list!");
                    if (censorNSFW) {
                        if (itr[i].hasAttribute("_no_blur_nsfw")) {
                            itr[i].style.cssText = "";
                            // console.log("Passed custom & blur list!");
                        }
                    } else {
                        itr[i].style.cssText = "";
                    }
                }
            }
        },
        function(err) {
            console.log(err);
        }
    );
}


function predictNSFW(itr2) {

    // Send image_urls and check for NSFW status.
    app.models.predict(Clarifai.NSFW_MODEL, _image_urls).then(
        function(response) {
            // console.log(response);
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

                if (nsfwpercent > 0.75) {
                    itr2[i].setAttribute("_blur_nsfw", true);
                    // console.log("Censored by NSFW filter!");
                } else {
                    itr2[i].setAttribute("_no_blur_nsfw", true);
                    // console.log("Passed nsfw filter!");
                    if (censorCustom) {
                        if (itr2[i].hasAttribute("_no_blur_custom")) {
                            itr2[i].style.cssText = "";
                            // console.log("Passed nsfw & custom list!");
                        }
                    } else {
                        itr2[i].style.cssText = "";
                    }
                }
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

function handleText(node) {
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
var _image_urls = [];

var howManySearches = 0;

var censorNSFW = false;
var censorCustom = false;

function scanAfterIdle() {
    if (unscanned_images.length > 0) {
        new_array = unscanned_images.slice();
        searchCategories(new_array);
        unscanned_images = [];
    }
}

setInterval(scanAfterIdle, 500);

document.addEventListener("DOMNodeInserted", function() {
    blurUnscannedImages();
});

document.addEventListener("DOMContentLoaded", function() {
    walk(document.body);
});

