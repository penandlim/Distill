function predictNSFW() {
    var images = document.getElementsByTagName("img");
    var images_to_remove = [];

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

    var image_urls = [];
    // Replace each image with a random one.
    for (var i = 0; i < images_to_remove.length; i++) {
        images_to_remove[i].style.cssText = "filter: blur(20px)";
        var isImageValid = false;
        var parentAnchor = images_to_remove[i].closest("a");
        if (parentAnchor == null) {
            var url = images_to_remove[i].src;
        } else {
            var url = parentAnchor.getAttribute("href");
        }
        var filetype = url.split(".");
        filetype = filetype[filetype.length - 1];
        if (filetype == "jpg" || filetype == "jpeg" || filetype == "png") {
            if (url.substring(0, 2) == "//") {
                url = "http:" + url;
            }
        }
        image_urls.push(url);
    }

    app.models.predict(Clarifai.NSFW_MODEL, image_urls).then(
        function(response) {
            console.log(response);
            var outputs = response.data.outputs;

            for (var i = 0; i < outputs.length; i++) {
                // Check for null. Needs this or else code stops on error.
                if (outputs[i].input == null) {
                    console.log("Null something went wrong.");
                } else {
                    console.log("img src = " + outputs[i].input.data.image.url);
                    if (outputs[i].data.concepts[0].name == "nsfw") {
                        var nsfwpercent = outputs[i].data.concepts[0].value;
                    }
                    else {
                        var nsfwpercent = outputs[i].data.concepts[1].value;
                    }

                    if (nsfwpercent > 0.60) {
                        images_to_remove[i].remove();
                    }

                    console.log("NSFW % = " + nsfwpercent);
                }
            }
        },
        function(err) {
            console.log(err);
        }
    );
}

var app = new Clarifai.App("RurVN490s-Ff8HWyCT4CbY1htejSJR9RYOPop-aR","skxEFbPFDkVKQdvJVumHwVnUgiVoList5_SYV3jB");

predictNSFW();