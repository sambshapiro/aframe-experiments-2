slackNotify();

function slackNotify() {

	var randColors = ['#'+Math.floor(Math.random()*16777215).toString(16), '#'+Math.floor(Math.random()*16777215).toString(16)];

	$.getJSON('http://www.geoplugin.net/json.gp?jsoncallback=?', function(data) {
  		var user_location = "from " + data.geoplugin_regionCode + ", " + data.geoplugin_regionName;
		var message = "*someone just entered room:* <" + window.location.protocol + "//" + window.location.host + location.pathname + ">";
		var data = {
		    "text": message,
		    "mrkdwn": true,
		    "attachments": [
		        {
		        	"color":randColors[0],
		            "text": user_location,
		            "footer": data.geoplugin_request
				}
			]
		};
		var xhttp = new XMLHttpRequest();
		xhttp.open("POST", "https://hooks.slack.com/services/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", true);
		xhttp.send(JSON.stringify(data));
	})
	.fail(function() {
		var message = "*someone just entered room:* <" + window.location.protocol + "//" + window.location.host + location.pathname + ">";
		var data = {
		    "text": message,
		    "mrkdwn": true
		};
		var xhttp = new XMLHttpRequest();
		xhttp.open("POST", "https://hooks.slack.com/services/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", true);
		xhttp.send(JSON.stringify(data));
	});
}
