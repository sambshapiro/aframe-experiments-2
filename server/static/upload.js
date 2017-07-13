var firstUpload = true;
var reader = new FileReader();

$(document).ready(function(){

  document.getElementById("media_input").addEventListener("change", function() {
    console.log("image uploaded!");
    mediaLoader();
  });

});

function mediaLoader() {
  //var files = document.getElementById("media_input").files;
  var file = document.getElementById("media_input").files[0];
  var filetype = file.type;
  /*for (var i = 0; i < files.length; i++) {
    filetype = files[i].type;
  }*/

  reader.onload = function() {

    console.log("file type " + filetype);
    console.log("FILE " + file);

    if (filetype == 'image/gif') {

      console.log("broadcasting data");
      var data = { src: reader.result, position: setPosition, rotation: setRotation };
      //NAF.connection.broadcastData('imagePlaced', data);
      //document.getElementById("avatar-image").src = image.src;
      //$("#avatar-image").attr('src', 'url(' + image.src + ')');
      document.querySelector('a-scene').querySelectorAll('.avatar-image-class')[0].setAttribute('material', {src: 'url(' + reader.result + ')', shader: "gif"});

      document.querySelector('#avatar-hud').setAttribute('material', {src: 'url(' + reader.result + ')', shader: "gif"});
    }

    else if (filetype.includes('image')){

      console.log ("firstUpload " + firstUpload);
      if (!firstUpload) {
        var containerEl = document.createElement('a-entity');
        var entityEl = document.createElement('a-image');
        containerEl.appendChild(entityEl);
        document.querySelector('a-scene').appendChild(containerEl);
        entityEl.setAttribute('visible','true');
        var currentPosition = document.querySelector('a-scene').querySelector('#player').getAttribute('position');
        var currentRotation = document.querySelector('a-scene').querySelector('#player').getAttribute('rotation');
        var setPosition = new THREE.Vector3(currentPosition.x+1, currentPosition.y, currentPosition.z+1);
        var setRotation = currentRotation;
        entityEl.setAttribute('position',setPosition);
        entityEl.setAttribute('rotation',currentRotation);
        var currentImageSrc = document.querySelector('a-scene').querySelectorAll('.avatar-image-class')[0].getAttribute('material').src;
        entityEl.setAttribute('material', 'src', 'url(' + currentImageSrc + ')');

        var data = { src: currentImageSrc, position: setPosition, rotation: setRotation };
        console.log("broadcasting data");
        //NAF.connection.broadcastDataGuaranteed('imagePlaced', JSON.stringify(data));

        $.ajax({
          type: 'POST',
          data: JSON.stringify(data),
          contentType: 'application/json',
          url: window.location.href + 'imageUpload',
          success: function(data) {
            console.log('success');
            console.log(JSON.stringify(data));
          }
        });
        //dbcollection_images.insert([newImage]);
        //console.log("image added to database");
      }
      //document.getElementById("avatar-image").src = image.src;
      //$("#avatar-image").attr('src', 'url(' + image.src + ')');
      document.querySelector('a-scene').querySelectorAll('.avatar-image-class')[0].setAttribute('material', 'src', 'url(' + reader.result + ')');

      document.querySelector('#avatar-hud').setAttribute('src', 'url(' + reader.result + ')');
      //var preview = document.createElement()
    }

    else {


    }

    $('#media_input_div').hide();
    if (firstUpload) firstUpload = false;

  }
  if (file) {
    reader.readAsDataURL(file);
  } else {
    console.log("Reader fail")
  }


}
