var reader = new FileReader();

$(document).ready(function(){
  document.getElementById("media_input").addEventListener("change", function() {
    $("#link_input_div").show();
    $('#media_input_p').text("Append URL to Media?");
    //mediaLoader();
  });

});

function uploadMedia() {
  $("#media_input").click();
}

function checkLink() {
  var link = document.getElementById("appendedLink").value;
  //og: /((ftp|http|https):\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  var urlWithHeader = /((ftp|http|https):\/\/)(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  var urlWithoutHeader = /(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  if (urlWithHeader.test(link)) {
    mediaLoader(link);
  }
  else if (urlWithoutHeader.test(link)) {
    mediaLoader("http://" + link);
  }
  else {
    document.getElementById("appendedLink").value = "Invalid URL.";
  }
}

function mediaLoader(link) {
  document.getElementById("appendedLink").value = "";
  var currentPosition = document.querySelector('a-scene').querySelector('#player').getAttribute('position');
  var currentRotation = document.querySelector('a-scene').querySelector('#player').getAttribute('rotation');
  var setPosition = new THREE.Vector3(currentPosition.x+1, currentPosition.y, currentPosition.z+1);
  var setRotation = currentRotation;

  $("#link_input_div").hide();
  //var files = document.getElementById("media_input").files;
  var file = document.getElementById("media_input").files[0];
  var filetype = file.type;

  reader.onload = function() {

    console.log("file type " + filetype);

    if (filetype == 'image/gif') {

      console.log("broadcasting data");
      var data = { src: reader.result, position: setPosition, rotation: setRotation };
      //NAF.connection.broadcastData('imagePlaced', data);
      //document.getElementById("avatar-image").src = image.src;
      //$("#avatar-image").attr('src', 'url(' + image.src + ')');
      document.querySelector('a-scene').querySelectorAll('.avatar-image-class')[0].setAttribute('material', {src: 'url(' + reader.result + ')', shader: "gif"});
      document.querySelector('#avatar-hud').setAttribute('src', reader.result);
    }

    else if (filetype.includes('image')){
      //adds image to scene for yourself
      addImageToScene(reader.result, setPosition, setRotation, link);

      var data = { src: reader.result, position: setPosition, rotation: setRotation, link: link };
      console.log("broadcasting data");
      //adds image to scene for others in room NOW
      NAF.connection.broadcastDataGuaranteed('imagePlaced', JSON.stringify(data));

      //adds image to scene for others in room LATER
      $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: location.protocol + '//' + location.host + location.pathname + '/imageUpload',
        success: function(data) {
          console.log('success');
        }
      });
    }

    else {


    }


  }
  if (file) {
    reader.readAsDataURL(file);
  } else {
    console.log("Reader fail")
  }


}
