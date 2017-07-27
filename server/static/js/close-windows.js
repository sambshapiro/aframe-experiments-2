function closeAllWindows() {
  $("#media_choice_div").hide();
  $("#link_input_div").hide();
  $("#add_room_div").hide();
  document.getElementById("enterRoomName").value = '';
}

$(document).keyup(function(e) {
     if (e.keyCode == 27) { // escape key maps to keycode `27`
        closeAllWindows();
    }
});
