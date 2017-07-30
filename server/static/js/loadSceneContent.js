function addImageToScene(src, position, rotation, link, gif) {
  var containerEl = document.createElement('a-entity');
  var entityEl = document.createElement('a-image');
  containerEl.appendChild(entityEl);
  document.querySelector('a-scene').appendChild(containerEl);
  entityEl.setAttribute('visible','true');
  entityEl.setAttribute('position',position);
  entityEl.setAttribute('rotation',rotation);
  entityEl.setAttribute('material', 'src', 'url(' + src + ')');
  entityEl.setAttribute('material', 'alphaTest', .001);
  entityEl.setAttribute('material', 'transparent', true);
  entityEl.setAttribute('mylink', 'link', link);
  if (gif) {
    entityEl.setAttribute('material', 'shader', 'gif');
  }
}

document.addEventListener("DOMContentLoaded", function(event) {

  //Add all images from database into the scene
  //var images = {};
  /*$.ajax({
    dataType: 'json',
    url: location.protocol + '//' + location.host + location.pathname + '/retrieveImages',
    success: function(data) {
      var images = JSON.parse(JSON.stringify(data));
      console.log("numImages = " + images.length);
      for (var i = 0; i < images.length; i++) {
        addImageToScene(images[i].src, images[i].position, images[i].rotation, images[i].link, images[i].gif);
      }
    }
  });*/

  $.ajax({
    dataType: 'json',
    url: location.protocol + '//' + location.host + location.pathname + '/retrieveMediaCards',
    success: function(data) {
      var mediaCards = JSON.parse(JSON.stringify(data));
      for (var i = 0; i < mediaCards.length; i++) {
        addScrapedContent(
          mediaCards[i].title,
          mediaCards[i].description,
          mediaCards[i].src,
          mediaCards[i].link,
          mediaCards[i].imgPosition,
          mediaCards[i].titlePosition,
          mediaCards[i].descriptionPosition,
          mediaCards[i].rotation
        );
      }
    }
  });

});

function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};
