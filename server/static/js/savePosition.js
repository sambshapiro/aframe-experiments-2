function savePosition() {

  var currentPosition = document.querySelector('a-scene').querySelector('#player').getAttribute('position');
  var currentRotation = document.querySelector('a-scene').querySelector('#player').getAttribute('rotation');

  var data = { position: currentPosition, rotation: currentRotation };

  $.ajax({
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json',
    url: location.protocol + '//' + location.host + location.pathname + '/savePosition',
    success: function(data) {
      console.log('successfully sent position to server.');
      var pathname = document.location.pathname.substring(1);
      var parts = pathname.split(/\//);
      var room = parts[1];
      $("<p>come back to this exact position: " + location.protocol + '//' + location.host + '/room/' + room + '/loc/' + data + "</p>").insertAfter(document.getElementById("savelocationbutton"));
    }
  });

};