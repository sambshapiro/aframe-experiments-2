$(document).ready(function(){

  document.getElementById("media_input").addEventListener("change", function() {
    console.log("image uploaded!");
    mediaLoader()
  });


});
var reader = new FileReader();

function mediaLoader() {
  //Get the files from the input
  var files = document.getElementById("media_input").files;
  var file = document.getElementById("media_input").files[0];
  var filetype;
  for (var i = 0; i < files.length; i++) {
    filetype = files[i].type;
  }

  reader.onload = function() {

    if (filetype == 'image/gif') {

      var image = new Image();

      image.src = reader.result;

      image.onload = function() { //IMAGE HAS BEEN LOADED
        console.log("broadcasting data");
        NAF.connection.broadcastData('avatar', image.src);
        //document.getElementById("avatar-image").src = image.src;
        //$("#avatar-image").attr('src', 'url(' + image.src + ')');
        document.querySelector('a-scene').querySelectorAll('.avatar-image-class')[0].setAttribute('material', {src: 'url(' + image.src + ')', shader: "gif"});
      }
    }

    else if (filetype.includes('image')){

      var image = new Image();

      image.src = reader.result;

      image.onload = function() { //IMAGE HAS BEEN LOADED
        console.log("broadcasting data");
        NAF.connection.broadcastData('avatar', image.src);
        //document.getElementById("avatar-image").src = image.src;
        //$("#avatar-image").attr('src', 'url(' + image.src + ')');
        document.querySelector('a-scene').querySelectorAll('.avatar-image-class')[0].setAttribute('material', 'src', 'url(' + image.src + ')');
      }
    }
    $('#media_input_div').hide();

  }
  if (file) {
    reader.readAsDataURL(file);
  } else {
    console.log("Reader fail")
  }


}
