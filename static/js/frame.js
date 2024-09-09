// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

let splide = null;

// Empties the grid of images.
function clearPreview() {
  showPreview(null, null);
}

// Shows a grid of media items in the photo frame.
// The source is an object that describes how the items were loaded.
// The media items are rendered on screen in a grid, with a caption based
// on the description, model of the camera that took the photo and time stamp.
// Each photo is displayed through the fancybox library for full screen and
// caption support.
function showPreview(source, mediaItems) {
  $("#images-container").empty();

  // Display the length and the source of the items if set.
  if (source && mediaItems) {
    $("#images-count").text(mediaItems.length);
    $("#images-source").text(JSON.stringify(source));
    $("#preview-description").show();
  } else {
    $("#images-count").text(0);
    $("#images-source").text("No photo search selected");
    $("#preview-description").hide();
  }

  // Show an error message and disable the slideshow button if no items are
  // loaded.
  if (!mediaItems || !mediaItems.length) {
    $("#images_empty").show();
    $("#startSlideshow").prop("disabled", true);
  } else {
    $("#images_empty").hide();
    $("startSlideshow").removeClass("disabled");
  }

  // Loop over each media item and render it.
  $.each(mediaItems, (i, item) => {
    // Construct a thumbnail URL from the item's base URL at a small pixel size.
    const thumbnailUrl = `${item.baseUrl}=w256-h256`;
    // Constuct the URL to the image in its original size based on its width and
    // height.
    const fullUrl = `${item.baseUrl}=w${item.mediaMetadata.width}-h${
      item.mediaMetadata.height
    }`;

    // Compile the caption, conisting of the description, model and time.
    const description = item.description ? item.description : "";
    const model = item.mediaMetadata.photo.cameraModel
      ? `#Shot on ${item.mediaMetadata.photo.cameraModel}`
      : "";
    const time = item.mediaMetadata.creationTime;
    const captionText = `${description} ${model} (${time})`;

    // Each image is wrapped by a link for the fancybox gallery.
    // The data-width and data-height attributes are set to the
    // height and width of the original image. This allows the
    // fancybox library to display a scaled up thumbnail while the
    // full sized image is being loaded.
    // The original width and height are part of the mediaMetadata of
    // an image media item from the API.
    const linkToFullImage = $("<a />")
      .attr("href", fullUrl)
      .attr("data-fancybox", "gallery")
      .attr("data-width", item.mediaMetadata.width)
      .attr("data-height", item.mediaMetadata.height);
    // Add the thumbnail image to the link to the full image for fancybox.
    const thumbnailImage = $("<img />")
      .attr("src", thumbnailUrl)
      .attr("alt", captionText)
      .addClass("img-fluid rounded thumbnail");
    linkToFullImage.append(thumbnailImage);

    // The caption consists of the caption text and a link to open the image
    // in Google Photos.
    const imageCaption = $("<figcaption />")
      .addClass("hidden")
      .text(captionText);
    imageCaption.append($("<br />"));
    linkToFullImage.append(imageCaption);

    // Add the link (consisting of the thumbnail image and caption) to
    // container.
    $("#images-container").append(linkToFullImage);
  });
}

// Makes a backend request to display the queue of photos currently loaded into
// the photo frame. The backend returns a list of media items that the user has
// selected. They are rendered in showPreview(..).
var currentSlides = [];

function loadQueue() {
  //showLoadingDialog();
  $.ajax({
    type: "GET",
    url: "/getQueue",
    dataType: "json",
    success: data => {
      // Queue has been loaded. Display the media items as a grid on screen.
      //hideError();
      //showPreview(data.parameters, data.photos);
      //hideLoadingDialog();

      /*var current = splide.Components.Slides.get()
        .map(item => item.slide.dataset.id)
        .filter(Boolean);
      current = [...new Set(current)];*/
      var current = [...currentSlides];

      data.photos.forEach(item => {
        if (current.includes(item.id)) {
          current.splice(current.indexOf(item.id), 1);
          return;
        }
        const fullUrl = `${item.baseUrl}=w${item.mediaMetadata.width}-h${
          item.mediaMetadata.height
        }`;

        console.log("Adding slide", item.id);
        currentSlides.push(item.id);
        splide.add(
          `<li class="splide__slide" data-id="${
            item.id
          }"><img src="${fullUrl}" alt=""></li>`
        );
      });

      if (current.length !== 0) {
        splide.remove(slide => {
          if (!current.includes(slide.slide.dataset.id)) {
            return false;
          }
          currentSlides = currentSlides.filter(
            id => id !== slide.slide.dataset.id
          );
          return true;
        });
      }

      if (currentSlides.length < 2) {
        splide.Components.AutoScroll.pause();
      } else {
        if (splide.Components.AutoScroll.isPaused()) {
          splide.Components.AutoScroll.play();
        }
      }
    },
    error: data => {
      hideLoadingDialog();
      handleError("Could not load queue", data);
    }
  });
}

$(document).ready(() => {
  // Load the queue of photos selected by the user for the photo
  loadQueue();
  setInterval(loadQueue, 10000);

  splide = new Splide(".splide", {
    type: "loop",
    perPage: 1,
    perMove: 1,
    //autoplay: true,
    gap: 50,
    pagination: false,
    autoScroll: {
      pauseOnHover: false,
      pauseOnFocus: false,
      speed: 4,
      autoStart: false
    },
    autoWidth: true,
    arrows: false
  });
  splide.mount(window.splide.Extensions);

  // Set up the fancybox image gallery.
  /*$().fancybox({
    selector: '[data-fancybox="gallery"]',
    loop: true,
    buttons: ["slideShow", "fullScreen", "close"],
    image: { preload: true },
    transitionEffect: "fade",
    transitionDuration: 1000,
    preventCaptionOverlap: false,
    infobar: true,
    toolbar: false,
    fullScreen: { autoStart: false },
    // Automatically advance after 3s to next photo.
    slideShow: { autoStart: true, speed: 3000 },
    // Display the contents figcaption element as the caption of an image
    caption: function(instance, item) {
      return $(this)
        .find("figcaption")
        .html();
    }
  });*/

  // Clicking the 'view fullscreen' button opens the gallery from the first
  // image.
  $("#startSlideshow").on("click", e => {
    document.querySelector(".splide").requestFullscreen();
    /*$("#images-container a")
      .first()
      .click()*/
  });

  // Clicking log out opens the log out screen.
  $("#logout").on("click", e => {
    window.location = "/logout";
  });
});
