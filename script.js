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
                images[i].style.cssText = "filter: blur(20px)";
                images[i].setAttribute("_SafeSpace_blurred", true);
                if (unscanned_images.length < 30 && !unscanned_images.includes(images[i])) {
                    unscanned_images.push(images[i]);
                } else if (unscanned_images.length > 29) {
                    var new_array = unscanned_images.slice();
                    if (howManySearches < 1) {
                        predictNSFW(new_array);
                    } else {
                        setTimeout(predictNSFW.bind(null, new_array), howManySearches * 100);
                    }
                    unscanned_images = [];
                }
            }
        }
    }
}

function predictNSFW(images_to_remove) {
    howManySearches++;
    lastSearch = new Date().getTime();

    // Prepare an array with URLs to pass to Clarifai.
    var image_urls = [];

    // Go through images_to_remove and remove src.
    for (var i = 0; i < images_to_remove.length; i++) {
        var isImageValid = false;
        var url;
        // Check if there is anchor to it.
        var parentAnchor = images_to_remove[i].closest("a");
        url = images_to_remove[i].src;
        if (parentAnchor != null) {
            url = parentAnchor.getAttribute("href");
            var filetype = url.split(".");
            filetype = filetype[filetype.length - 1];
            if (filetype.substring(0,3) == "jpg" || filetype.substring(0,4) == "jpeg" || filetype.substring(0,3) == "png") {
                console.log("Using Real Image...");
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
                for (var j = 0; j < outputs[i].data.concepts.length; j++) {
                    if (outputs[i].data.concepts[j].name == "nsfw") {
                        nsfwpercent = outputs[i].data.concepts[j].value;
                        break;
                    }
                }
                // if its NSFW content, leave image blurred.
                if (nsfwpercent > 0.75) {
                    console.log("img src = " + outputs[i].input.data.image.url);
                    console.log("NSFW % = " + nsfwpercent);
                    console.log("stay blurred!");
                } else {
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

function scanAfterIdle() {
    if (unscanned_images.length > 0) {
        new_array = unscanned_images.slice();
        setTimeout(predictNSFW.bind(null, new_array), howManySearches * 200);
        unscanned_images = [];
        console.log();
    }
}

function timeSince(_time) {
    return new Date().getTime() - _time;
}

var app = new Clarifai.App("RurVN490s-Ff8HWyCT4CbY1htejSJR9RYOPop-aR","skxEFbPFDkVKQdvJVumHwVnUgiVoList5_SYV3jB");

var unscanned_images = [];

var lastDomChange = new Date().getTime();
var lastSearch = new Date().getTime();
var howManySearches = 0;

setInterval(scanAfterIdle, 200);

document.addEventListener("DOMNodeInserted", function() {
    blurUnscannedImages();
    lastDomChange = new Date().getTime();
});

