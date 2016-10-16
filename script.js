function predictNSFW() {

    // Probe all image tags
    var images = document.getElementsByTagName("img");

    // Create an array with single objects so iI can splice it later
    var images_to_remove = [];

    // Go through images array, then put all images with right formats to images_to_remove
    for (var i = 0; i < images.length; i++) {
        isImageValid = false;
        console.log(images[i].src);
        var filetype = images[i].src.split(".");
        filetype = filetype[filetype.length - 1];
        if (filetype == "jpg" || filetype == "jpeg" || filetype == "png") {
            isImageValid = true;
        }
        if (images[i].src != null && isImageValid) {
            images_to_remove.push(images[i]);
        }
    }
    console.log(images_to_remove);

    // Prepare an array with URLs to pass to Clarifai.
    var image_urls = [];

    // Go through images_to_remove and remove src.
    for (var i = 0; i < images_to_remove.length; i++) {
        images_to_remove[i].style.cssText = "filter: blur(20px)";
        var isImageValid = false;

        // Check if there is anchor to it.
        var parentAnchor = images_to_remove[i].closest("a");
        if (parentAnchor != null) {
            var url = parentAnchor.getAttribute("href");
            var filetype = url.split(".");
            filetype = filetype[filetype.length - 1];
            if (filetype == "jpg" || filetype == "jpeg" || filetype == "png") {

            } else {
                var url = images_to_remove[i].src;
            }
        } else {
            var url = images_to_remove[i].src;
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
                console.log("img src = " + outputs[i].input.data.image.url);
                if (outputs[i].data.concepts[0].name == "nsfw") {
                    var nsfwpercent = outputs[i].data.concepts[0].value;
                }
                else {
                    var nsfwpercent = outputs[i].data.concepts[1].value;
                }

                // if its NSFW content, remove image.
                if (nsfwpercent > 0.60) {
                    images_to_remove[i].remove();
                } else {
                    images_to_remove[i].style.cssText = "";
                }

                console.log("NSFW % = " + nsfwpercent);

            }
        },
        function(err) {
            console.log(err);
        }
    );
}

var app = new Clarifai.App("RurVN490s-Ff8HWyCT4CbY1htejSJR9RYOPop-aR","skxEFbPFDkVKQdvJVumHwVnUgiVoList5_SYV3jB");

predictNSFW();