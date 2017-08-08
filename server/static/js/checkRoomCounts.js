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
    var textnodeColRoomName = document.createTextNode(data.roomNames[i]);
    colRoomName.appendChild(textnodeColRoomName);

    var colNumUsers = document.createElement("th");
    colNumUsers.className = "numUsers";
    var textnodeColNumUsers = document.createTextNode(data.roomCounts[i]);
    colNumUsers.appendChild(textnodeColNumUsers);

    row.appendChild(colRoomName);
    row.appendChild(colNumUsers);
    table.appendChild(row);
  }
}