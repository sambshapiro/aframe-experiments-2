slackNotify();

function slackNotify() {
  var formData = new FormData();
  formData.append("roomJoined", location.pathname);
  var xhttp = new XMLHttpRequest();
  xhttp.open("POST", "https://hooks.zapier.com/hooks/catch/2398106/5ih5oc/", true);
  xhttp.send(formData);
}
