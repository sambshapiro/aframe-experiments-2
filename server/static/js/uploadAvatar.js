var reader = new FileReader();

$(document).ready(function(){
  document.getElementById("avatar_input").addEventListener("change", function() {
    avatarLoader();
  });
});

function uploadAvatar() {
  $("#avatar_input").click();
}

function avatarLoader() {
  var file = document.getElementById("avatar_input").files[0];
  var filetype = file.type;

  if (file) {
    reader.readAsDataURL(file);
  } else {
    console.log("Reader fail")
  }

  reader.onload = function() {
    console.log("file type " + filetype);

    if (filetype == 'image/gif') {
      document.querySelector('a-scene').querySelectorAll('.avatar-image-class')[0].setAttribute('material', {src: 'url(' + reader.result + ')', shader: "gif"});
      document.querySelector('#avatar-hud').setAttribute('src', reader.result);
    }

    else if (filetype.includes('image')){
      document.querySelector('a-scene').querySelectorAll('.avatar-image-class')[0].setAttribute('material', 'src', 'url(' + reader.result + ')');
      document.querySelector('#avatar-hud').setAttribute('src', reader.result);
    }

    else {

    }


  }

}
