var inject; // The injected code
var debug = false; // Toggle verbose mode

// Messages are exchanged between the content script and the page
function receiveMessage(e) {
    if (e.origin != "http://grooveshark.com") return;
    var request = JSON.parse(e.data);
    if (debug) console.log('[CONTENT] Message received: ' + request.command, request);
    switch (request.command) {
    case 'statusUpdate':
    	sendRequest(request);
        break;
    }
}

// Requests are exchanged between the content script and the extension
function sendRequest(request) {
    if (!request.source) request.source = "contentscript";
    if (debug) console.log('[CONTENT] Request sent', request);
    chrome.extension.sendRequest(request);
}

function handleClose() {
    sendRequest({"command":"gsTabClosing"});
}


function injection() {
    if (debug) console.log("[CONTENT] Injecting...");
   
    inject = document.createElement('script');
    inject.id = 'injection';
    inject.innerHTML = 'function update_status() {\
                 gs_status = {\
                     "command": "statusUpdate",\
                     "status": GS.player.getPlaybackStatus(),\
	     	     "currentSong": GS.player.currentSong,\
                 };\
             post_message(gs_status);\
        }\
         function post_message(message) {\
             message.source = "page";\
	     window.postMessage(JSON.stringify(message), "http://grooveshark.com");\
         }\
        $.subscribe("gs.player.queue.change",update_status);'; 
    
    document.body.appendChild(inject);
}

window.addEventListener("message", receiveMessage, false);
window.addEventListener("unload", handleClose, false);

injection();
