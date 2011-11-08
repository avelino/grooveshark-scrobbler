var isAllowed = false; // Has the extension been allowed by Lastfm ?
var token;
var sk;
var step1, step2, step3;
var debug = false;

var api_key = "d7eb4630c49322130d0d9c723a404502";

function loadOptions() {
    step1 = document.getElementById("step1");
    step2 = document.getElementById("step2");
    step3 = document.getElementById("step3");

    sk = localStorage["sessionKey"];
    if (!sk) {
	if (isAllowed) {
	    // Last part of the authentication
	    if (debug) console.log("[OPTIONS] Getting session key...");
	    sk = getSessionKey();
	    if (debug) console.log("[OPTIONS] Storing the session key...");
	    localStorage["sessionKey"] = sk;
	    showSuccess();
	    // FIXME: SEND A MESSAGE TO REFRESH THE EXTENSION
	    var request = {"command": "update",
			   "source": "options"};
	    if (debug) console.log("[OPTIONS] Sending an update to the extension");
	    chrome.extension.sendRequest(request);
	} else {
	    // First part of the authentication
	    if (debug) console.log("[OPTIONS] Getting token...");
	    token = getToken();
	    if (debug) console.log("[OPTIONS] Token received: "+token);
	    showStep1();
	}
    } else {
	showSuccess();
    }
}

function showStep1() {
    step1.innerHTML = '<span class="step">STEP 1</span> Allow this extension in Last.fm<br /><button class="center" onclick="loadLastfm();">Allow</button>';
    step1.className = "box";
    step2.innerHTML = '<span class="step">STEP 2</span> Confirm you have allowed this extension in Last.fm<br /><button class="center" disabled="true" onclick="allowed();">Confirm</button>';
    step2.className = "disabled";
    step3.innerHTML = '';
    step3.className = "hidden";
}

function showStep2() {
    step1.innerHTML = '<span class="step">STEP 1</span> Done';
    step1.className = "disabled";
    step2.innerHTML = '<span class="step">STEP 2</span> Confirm you have allowed this extension in Last.fm<br /><button class="center "onclick="allowed();">Confirm</button>';
    step2.className = "box";
    step3.innerHTML = '';
    step3.className = "hidden";
}

function showSuccess() {
    step1.innerHTML = '';
    step1.className = "hidden";
    step2.innerHTML = '';
    step2.className = "hidden";
    step3.innerHTML = 'This extension is connected to Last.fm !'
    step3.className = "success";
}

function loadLastfm() {
    if (debug) console.log("[OPTIONS] Loading Last.fm...");
    chrome.tabs.create({url:"http://www.last.fm/api/auth/?api_key="+api_key+"&token="+token});
    showStep2();
}

function allowed() {
    if (debug) console.log("[OPTIONS] Extension allowed");
    isAllowed = true;
    loadOptions();
}

// Return the api_sig needed to communicate with last.fm
function gen_sig(str) {
    var xhr = new XMLHttpRequest();
    // Synchronous request
    xhr.open("GET", "http://ugotpewpewd.net/md5.php?s=" + str, false);
    xhr.send(null);
    return xhr.responseText;
}

// Return a lastfm token
function getToken() {
    if (token) return token;
    var api_sig = gen_sig("api_key"+api_key+"methodauth.getToken");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://ws.audioscrobbler.com/2.0/?method=auth.getToken&api_key="+api_key+"&api_sig="+api_sig, false);
    xhr.send(null);
    var res = xhr.responseXML;
    token = res.getElementsByTagName("token")[0].firstChild.nodeValue;
    return token;
}

// Return the lastfm session key
function getSessionKey() {
    if (sk) return sk;
    var api_sig = gen_sig("api_key"+api_key+"methodauth.getSessiontoken"+token);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key="+api_key+"&token="+token+"&api_sig="+api_sig, false);
    xhr.send(null);
    var res = xhr.responseXML;
    sk = res.getElementsByTagName("key")[0].firstChild.nodeValue;
    return sk;
}
