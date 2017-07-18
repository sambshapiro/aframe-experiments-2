function addImageToScene(src, position, rotation, url) {
  var containerEl = document.createElement('a-entity');
  var entityEl = document.createElement('a-image');
  containerEl.appendChild(entityEl);
  document.querySelector('a-scene').appendChild(containerEl);
  entityEl.setAttribute('visible','true');
  entityEl.setAttribute('position',position);
  entityEl.setAttribute('rotation',rotation);
  entityEl.setAttribute('material', 'src', 'url(' + src + ')');
  entityEl.setAttribute('url', 'url', url);
}

//Add all images from database into the scene
//var images = {};
$.ajax({
  dataType: 'json',
  url: location.protocol + '//' + location.host + location.pathname + '/retrieveImages',
  success: function(data) {
    console.log('success');
    var images = JSON.parse(JSON.stringify(data));
    console.log("numImages = " + images.length);
    for (var i = 0; i < images.length; i++) {
      console.log("image " + i);
      addImageToScene(images[i].src, images[i].position, images[i].rotation, images[i].url);
    }
  }
});
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};
