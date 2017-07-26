function addRoomButton() {
  $("#add_room_div").show();
}

function addRoom() {
  window.location = window.location.protocol + "//" + window.location.host + "/room/" + document.getElementById("enterRoomName").value;
}

document.addEventListener("DOMContentLoaded", function(event) {
  $("input#enterRoomName").on({
    keydown: function(e) {
      if (e.which === 32)
      return false;
    }
  });
});
