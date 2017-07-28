var reader = new FileReader();

$(document).ready(function(){
  document.getElementById("media_input").addEventListener("change", function() {
    $("#link_input_div").show();
    $('#media_input_p').text("Append URL to Media?");
  });

});

function uploadMedia() {
  $("#media_input").click();
}

function useSiteContent(link) {
  console.log("sending link to server: " + link);
  var currentPosition = document.querySelector('a-scene').querySelector('#player').getAttribute('position');
  var currentRotation = document.querySelector('a-scene').querySelector('#player').getAttribute('rotation');
  var imgPosition = new THREE.Vector3(currentPosition.x+1, currentPosition.y, currentPosition.z+1);
  var titlePosition = new THREE.Vector3(currentPosition.x+1, currentPosition.y+1, currentPosition.z+1);
  var descriptionPosition = new THREE.Vector3(currentPosition.x+1, currentPosition.y+0.8, currentPosition.z+1);
  var rotation = currentRotation;
  var data = {'link':link, 'imgPosition':imgPosition, 'titlePosition':titlePosition, 'descriptionPosition':descriptionPosition, 'rotation':rotation};
  $.ajax({
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json',
    url: location.protocol + '//' + location.host + location.pathname + '/metadata',
    success: function(data) {
      console.log('successly received scraped content from server');
      addScrapedContent(data.title, data.description, data.image, data.link, imgPosition, titlePosition, descriptionPosition, rotation);
      console.log("broadcasting data");
      var broadcastData = {'title':data.title, 'description':data.description, 'image':data.image, 'link':link, 'imgPosition':imgPosition, 'titlePosition':titlePosition, 'descriptionPosition':descriptionPosition, 'rotation':rotation};
      NAF.connection.broadcastDataGuaranteed('mediaCardPlaced', JSON.stringify(broadcastData));
    }
  });
}

function validateLink(link) {
  //og: /((ftp|http|https):\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  var urlWithHeader = /((ftp|http|https):\/\/)(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  var urlWithoutHeader = /(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

  if (urlWithHeader.test(link)) return 0;
  else if (urlWithoutHeader.test(link)) return 1;
  else return 9;
}

function checkLink(callback) {
  if ( callback == mediaLoader ) {
    console.log("callback is mediaLoader");
    var el = document.getElementById("appendedLink");
  }
  else if ( callback == useSiteContent ) {
    console.log("callback is useSiteContent");
    var el = document.getElementById("search-box");
  }
  else console.error("check link function");
  var link = el.value;
  if (validateLink(link)==0) {
    callback(link);
    el.value = "";
    document.getElementById("search-box").style.backgroundColor = "rgba(255,255,255,.5)";
  }
  else if (validateLink(link)==1) {
    callback("http://" + link);
    el.value = "";
    document.getElementById("search-box").style.backgroundColor = "rgba(255,255,255,.5)";
  }
  else {
    el.value = "Invalid URL.";
    if ( callback == useSiteContent ) {
      document.getElementById("search-box").style.backgroundColor = "rgba(255,0,0,.5)";
    }
  }
}

function mediaLoader(link) {
  $("#link_input_div").hide();
  var currentPosition = document.querySelector('a-scene').querySelector('#player').getAttribute('position');
  var currentRotation = document.querySelector('a-scene').querySelector('#player').getAttribute('rotation');
  var setPosition = new THREE.Vector3(currentPosition.x+1, currentPosition.y, currentPosition.z+1);
  var setRotation = currentRotation;

  //var files = document.getElementById("media_input").files;
  var file = document.getElementById("media_input").files[0];
  var filetype = file.type;

  reader.onload = function() {

    console.log("file type " + filetype);

    if (filetype.includes('image')){
      //adds image to scene for yourself
      addImageToScene(reader.result, setPosition, setRotation, link, filetype == 'image/gif');

      var data = { src: reader.result, position: setPosition, rotation: setRotation, link: link, gif: filetype == 'image/gif'};
      console.log("broadcasting data");
      //adds image to scene for others in room NOW
      NAF.connection.broadcastDataGuaranteed('imagePlaced', JSON.stringify(data));

      //adds image to scene for others in room LATER
      //upload to s3, then broadcast in realtime and save to database for later
      awsGetSignedRequest(file, data);
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

function awsGetSignedRequest(file, data){
  const xhr = new XMLHttpRequest();
  //TODO add random unique characters after file name to prevent overwriting
  var name = (file.name).replace(/[^a-z0-9]/gi, '_').toLowerCase();
  xhr.open('GET', `/sign-s3?file-name=${name}&file-type=${file.type}`);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4){
      if(xhr.status === 200){
        const response = JSON.parse(xhr.responseText);
        awsUploadFile(file, response.signedRequest, response.url, data);
      }
      else{
        alert('Could not upload file (could not get signed URL).');
      }
    }
  };
  xhr.send();
}

//TODO add a loading indicator to be displayed between selecting a file and the upload being completed

function awsUploadFile(file, signedRequest, url, data){
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', signedRequest);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4){
      if(xhr.status === 200){
        data.src = url;
        addImageToDatabase(data);
      }
      else{
        alert('Could not upload file.');
      }
    }
  };
  xhr.send(file);
}

function addImageToDatabase(data) {
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
