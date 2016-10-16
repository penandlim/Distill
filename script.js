function blurUnscannedImages() {
    // Probe all image tags
    var images = document.getElementsByTagName("img");

    // Create an array with single objects so I can splice it later
    var images_to_remove = [];

    // Go through images array, then put all images with right formats to images_to_remove
    for (var i = 0; i < images.length; i++) {
        if (!images[i].hasAttribute("_SafeSpace_scanned") || !images[i].hasAttribute("_SafeSpace_blurred")) {

            isImageValid = false;
            var filetype = images[i].src.split(".");
            filetype = filetype[filetype.length - 1];
            if (filetype.substring(0,3) == "jpg" || filetype.substring(0,4) == "jpeg" || filetype.substring(0,3) == "png") {
                isImageValid = true;
            }
            if (images[i].src != null && isImageValid) {
                images[i].style.cssText = "filter: blur(20px)";
                images[i].setAttribute("_SafeSpace_blurred", true);
                if (unscanned_images.length < 127 && !unscanned_images.includes(images[i])) {
                    unscanned_images.push(images[i]);
                } else if (unscanned_images.length > 126) {
                    predictNSFW(unscanned_images.slice());
                    unscanned_images = [];
                }
            }
        }
    }
}

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
        if (parentAnchor != null) {
            url = parentAnchor.getAttribute("href");
            var filetype = url.split(".");
            filetype = filetype[filetype.length - 1];
            if (filetype.substring(0,3) != "jpg" || filetype.substring(0,4) != "jpeg" || filetype.substring(0,3) != "png")
                url = images_to_remove[i].src;
        } else {
            url = images_to_remove[i].src;
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
            var outputs = response.data.outputs;

            for (var i = 0; i < outputs.length; i++) {

                // Check for null. Needs this or else code stops on error.
                if (outputs[i].data.concepts[0].name == "nsfw") {
                    var nsfwpercent = outputs[i].data.concepts[0].value;
                }
                else {
                    var nsfwpercent = outputs[i].data.concepts[1].value;
                }

                // if its NSFW content, remove image.
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
        predictNSFW(unscanned_images.slice());
        unscanned_images = [];
    }
}

function walk(node) 
{
        var child, next;
	
    if (!node.tagName || node.tagName.toLowerCase() === 'input'
	     || node.tagName.toLowerCase() === 'textarea'
	     || node.classList.contains('ace_editor')) {
		return;
    }
    //console.log(node.nodeType);
    child = node.firstChild;
    if ( !child ) {
        handleText(node);
    } else {
	while ( child ) {
	    next = child.nextSibling;
	    walk(child);
	    child = next;
        }
    }
}
//node.innerText
function handleText(node) 
{
    var v;
    var regexp;
    console.log(node.textContent);
    if (chrome.storage.sync.get("swears", function(items){return items.swears;})) {
	for (var i; i < swears.length; i++) {
	    v = node.textContent;
	    regexp = new RegExp("/\b" + swears[i] + "\b/g");
	    if (v.search(regexp) >= 0) {
		console.log("Naughty language: " + swears[i]);
	    }
	    v = v.replace(regexp, "XXXXXX");
	    node.textContent = v;
	}
    }
    if (chrome.storage.sync.get("slurs", function(items){return items.slurs;})) {
	for (var i; i < slurs.length; i++) {
	    v = node.textContent;
	    regexp = new RegExp("/\b" + slurs[i] + "\b/g");
	    v = v.replace(regexp, "YYYYYY");
	    node.textContent = v;
	}
    }
}

var app = new Clarifai.App("RurVN490s-Ff8HWyCT4CbY1htejSJR9RYOPop-aR","skxEFbPFDkVKQdvJVumHwVnUgiVoList5_SYV3jB");

var unscanned_images = [];



document.addEventListener("DOMNodeInserted", function() {
    blurUnscannedImages();
});

document.addEventListener("DOMContentLoaded", function() {
    blurUnscannedImages();
    setInterval(scanAfterIdle, 2000);
});

