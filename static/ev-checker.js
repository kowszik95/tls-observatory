function checkResult(id) {
    return fetch("/api/v1/results?id=" + id)
	.then(function(response) {
            return response.json().then(function(json) {
		let completion_percent = json.completion_perc;
		if (completion_percent !== 100) {
                    console.log("Not done yet, running again");
                    var result = document.getElementById("result");
                    result.innerHTML += ".";
		    return new Promise(resolve => setTimeout(resolve, 1000)).then(function() { return checkResult(id) });
		}
                return Promise.resolve(json.analysis.find(analysis => analysis.analyzer == "ev-checker"));
            });
	});
}

function startScan(target, oid, rootCertificate) {
    let params = {
	"ev-checker": {
	    "oid": oid,
	    "rootCertificate": rootCertificate
	}
    };
    let queryParams = {
	"rescan": true,
	"target": target,
	"params": JSON.stringify(params)
    };
    let query = Object.keys(queryParams)
	.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(queryParams[k]))
	.join('&');
    let url = "/api/v1/scan?" + query
    return fetch(url, {method: "POST"}).then(function(response) {
        if (!response.ok) {
            throw "Server error. Status: " + response.status + " " + response.statusText; 
        }
	return response.json().then(function(json) {
	    return json.scan_id;
	});
    })
	.catch(function(err) {
            throw "Could not initiate scan: " + err;
	});
}

function send() {
    var target = document.getElementById("target").value;
    var oid = document.getElementById("oid").value;
    var rootCertificate = document.getElementById("rootCertificate").value;
    var result = document.getElementById("result");
    startScan(target, oid, rootCertificate).then(function(id) {
        console.log("Scan started with id", id);
        result.innerHTML = "Scan started, waiting for result...";
        return checkResult(id).then(function(params) {
	    if (params.success) {
                result.innerHTML = "ev-checker exited successfully: " + params.result;
                result.style.color = "Green";
	    } else {
                result.innerHTML = "ev-checker reported failure: " + params.result;
                result.style.color = "Red";
	    }
        });
    })
	.catch(function(err) {
            result.innerHTML = "Error: " + err;
            result.style.color = "Red";
	});
}