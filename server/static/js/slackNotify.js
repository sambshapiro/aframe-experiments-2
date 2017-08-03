slackNotify();

function slackNotify() {
	var message = "*someone just entered room:* <" + window.location.protocol + "//" + window.location.host + location.pathname + ">";
	var data = {
	    "text": message,
	    "mrkdwn": true
	}
	var xhttp = new XMLHttpRequest();
	xhttp.open("POST", "https://hooks.slack.com/services/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", true);
	console.log("sending " + JSON.stringify(data));
	xhttp.send(JSON.stringify(data));
}
