function checkRoomCount() {
  var xhr = new XMLHttpRequest();
  var url = location.protocol + '//' + location.host + '/roomCountData';
  xhr.open('GET', url, true);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4){
      if(xhr.status === 200){
        console.log("response text: " + xhr.responseText)
        const response = JSON.parse(xhr.responseText);
        updateRoomCounts(response);
      }
    }
  };
  xhr.send();
}

function toggleTheSidebar() {
  //if not closed, close it
  if ($( "#sidebar" ).data("closed") != true) {
    //if on mobile
    if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      $( "#openRoomsHeading").hide();
      $( "#roomTable").hide();
      $( "#sidebar" ).animate({
        width: "10vw",
      }, 1000, function() {
        // Animation complete.
        $( "#sidebar" ).data("closed",true);
      });
    }
    //if on desktop
    else {
      $( "#openRoomsHeading").hide();
      $( "#roomTable").hide();
      $( "#sidebar" ).animate({
        width: "3vw",
      }, 1000, function() {
        // Animation complete.
        $( "#sidebar" ).data("closed",true);
      });
    }
  }
  //if closed, open it
  else {
    //if on mobile
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
     $( "#sidebar" ).animate({
        width: "70vw",
      }, 1000, function() {
        $( "#openRoomsHeading").show();
        $( "#roomTable").show();
        $( "#sidebar" ).data("closed",false);
      });
    }
    //if on desktop
    else {
      $( "#sidebar" ).animate({
        width: "30vw",
      }, 1000, function() {
        $( "#openRoomsHeading").show();
        $( "#roomTable").show();
        $( "#sidebar" ).data("closed",false);
      });
    }
  }
};

setInterval(checkRoomCount, 10000);

function updateRoomCounts(data) {
  var table = document.getElementById("roomTable");
  while (table.firstChild) {
	  table.removeChild(table.firstChild);
	}
  console.log("length of roomCount data " + data.roomNames.length);
  console.log("room 0 " + data.roomNames[0]);
  console.log("room 0 " + data.roomCounts[0]);
  for (var i = 0; i < data.roomNames.length; i++) {
    var row = document.createElement("tr");
    row.className = "roomTableRow";

    var colRoomName = document.createElement("th");
    colRoomName.className = "roomName";
    var a = document.createElement('a');
    a.href =  data.roomNames[i];
    a.innerHTML = data.roomNames[i];
    colRoomName.appendChild(a);

    var colNumUsers = document.createElement("th");
    colNumUsers.className = "numUsers";
    var textnodeColNumUsers = document.createTextNode(data.roomCounts[i]);
    colNumUsers.appendChild(textnodeColNumUsers);

    row.appendChild(colRoomName);
    row.appendChild(colNumUsers);
    table.appendChild(row);
  }
}