var gsTabId; // Id of the first tab containing a Grooveshark page
var previousSong; // The song actually playing
var playbackStatus; // Additional infos of the previousSong (typically its duration)
var sk; // Lastfm session key
var debug = true; // Toggle verbose mode
var debugUpdates = true; // Toggle ultra verbose mode

var api_key = "d7eb4630c49322130d0d9c723a404502";

// Initialisation function
function init() {
    if (debug) console.log("[BACKGROUND] init()");

    sk = localStorage["sessionKey"];

    chrome.tabs.onUpdated.addListener(addPageAction);
    chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	if (tabId == gsTabId) {
	    gsTabId == null;
	}
    });

    // Is it the first time we run the extension ?
    if (!sk) {
	if (debug) console.log("[BACKGROUND] First time : open options tab");
	chrome.tabs.create({url:"options.html"}); 
    } 
}

// Return the api_sig needed to communicate with last.fm
function gen_sig(str) {
    if (debug) console.log("[BACKGROUND] Request a MD5 hash of: " + str);
    var xhr = new XMLHttpRequest();
    // Synchronous request
    xhr.open("GET", "http://ugotpewpewd.net/md5.php?s=" + str, false);
    xhr.send(null);
    return xhr.responseText;
}

// Inject the content script into the specified tab
function inject_scripts(tabId) {
    // Workaround to be sure the tab is atleast partially loaded
    // FIXME: Use tab status instead (loading/loaded)
    setTimeout(function() {inject_scripts_bis(tabId)}, 3000);
}

function inject_scripts_bis(tabId) {
    chrome.tabs.executeScript(tabId, {'file':'jquery-1.6.min.js'});		
    chrome.tabs.executeScript(tabId, {'file':'contentscript.js'});
    chrome.pageAction.setIcon({path: "gss48.png", tabId: tabId});
    if (debug) console.log('[BACKGROUND] Scripts injected into tab #' + tabId);
}

// duration: in ms
function scrobble(previousSong, duration, timestamp) {
    if (debug) console.log("[BACKGROUND] Scrobbling, duration = "+duration);
    // The track must be longer than 30 seconds
    // Sometimes the EstimateDuration field is empty
    if ((duration > 30000) || (previousSong.EstimateDuration == 0)) {
	// elapsedTime, in seconds
	var elapsedTime = Math.round((new Date().getTime() - timestamp)/1000);
	// The track must have been played for atleast half of its duration or 4 min (240s)
	if ((elapsedTime > (duration / 2000)) || (elapsedTime > 240)) {
	    var lastfm_timestamp = Math.round(timestamp/1000);
	    var api_sig = gen_sig("album" + encodeURIComponent(previousSong.AlbumName)
				  +"api_key" + api_key
				  +"artist" + encodeURIComponent(previousSong.ArtistName)
				  +"methodtrack.scrobble"
				  +"sk" + sk
				  +"timestamp" + lastfm_timestamp
				  +"track" + encodeURIComponent(previousSong.SongName));
	    
	    var xhr = new XMLHttpRequest();
	    var params = "method=track.scrobble"
		+ "&track=" + encodeURIComponent(previousSong.SongName)
		+ "&artist=" + encodeURIComponent(previousSong.ArtistName)
		+ "&album=" + encodeURIComponent(previousSong.AlbumName)
		+ "&timestamp=" + lastfm_timestamp
		+ "&api_key=" + api_key
		+ "&sk=" + sk
		+ "&api_sig=" + api_sig;
	    
	    xhr.open("POST", "http://ws.audioscrobbler.com/2.0/", true);
	    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	    xhr.onreadystatechange = function() {
		if (xhr.readyState != 4) { return; }
		if (debug) console.log("[BACKGROUND] Last.fm response: " + xhr.responseText);
	    };
	    if (debug) console.log("[BACKGROUND] POST REQUEST: " + params);
	    xhr.send(params);
	    if (debug) console.log('[BACKGROUND] Scrobbling ' + previousSong.ArtistName + ' - ' + previousSong.SongName + '(' + lastfm_timestamp + ')');
	} else {
	    if (debug) console.log("[BACKGROUND] Not scrobbling because the song haven't been played for long enough ("+elapsedTime+" of "+ duration/1000 +"s)");
	}
    } else {
	if (debug) console.log("[BACKGROUND] Not scrobbling because the song is too short: " + duration/1000 + "s");
    }
}

function nowPlaying(currentSong) {
    var api_sig = gen_sig("album" + encodeURIComponent(currentSong.AlbumName)
			  +"api_key" + api_key
			  +"artist" + encodeURIComponent(currentSong.ArtistName)
			  +"methodtrack.updateNowPlaying"
			  +"sk" + sk
			  +"track" + encodeURIComponent(currentSong.SongName));
    
    var xhr = new XMLHttpRequest();
    var params = "method=track.updateNowPlaying"
	+ "&track=" + encodeURIComponent(currentSong.SongName)
	+ "&artist=" + encodeURIComponent(currentSong.ArtistName)
	+ "&album=" + encodeURIComponent(currentSong.AlbumName)
	+ "&api_key=" + api_key
	+ "&sk=" + sk
	+ "&api_sig=" + api_sig;
    
    xhr.open("POST", "http://ws.audioscrobbler.com/2.0/", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function() {
	    if (xhr.readyState != 4) { return; }
	    if (debug) console.log("[BACKGROUND] Last.fm response: " + xhr.responseText);
	};
    if (debug) console.log("[BACKGROUND] POST REQUEST: " + params);
    xhr.send(params);
    if (debug) console.log('[BACKGROUND] Now Playing ' + currentSong.ArtistName + ' - ' + currentSong.SongName);
}

function addPageAction(tabId, changeInfo, tab) {
    if (tab.url.indexOf('http://grooveshark.com/') == 0) {
	if (debug) console.log('[BACKGROUND] Grooveshark found in tab #' + tabId);
	chrome.pageAction.show(tabId);
	if (!gsTabId) {
	    gsTabId = tabId;
	    if (sk) {
		inject_scripts(gsTabId);
	    }
	}
    }
}

// Listener managing all the messages sent through the extension
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
	// Print requests to the console in debug mode
	if (debug && debugUpdates) console.log("[BACKGROUND] Request received: ",request.command,request);
	
	// Ignore any requests without a command or from ourself
	if (!request.command || request.source == "background") return;
	
	// Handle commands
	switch (request.command) {
	case 'statusUpdate':
	    // We do nothing if it's still the same song playing
	    if (previousSong && request.currentSong && request.currentSong.SongName == previousSong.SongName && request.currentSong.ArtistName == previousSong.ArtistName && request.currentSong.AlbumName == previousSong.AlbumName) {
		if (debug && debugUpdates) console.log('[BACKGROUND] Same song playing.');
		return;
	    }
	    // It's a new song playing
	    if (request.currentSong && request.currentSong.SongName) {
		// Scrobble the previous song if there is one
		if (previousSong) {
		    scrobble(previousSong, Math.round(playbackStatus.duration), timestamp);
		    timestamp = new Date().getTime();
		} else {
		    // This is a new song and there was no song before
		    timestamp = new Date().getTime();
		}
		// Update the Now Playing with the new song
		nowPlaying(request.currentSong);
	    } 
	    previousSong = request.currentSong;
	    // Do NOT update if Grooveshark sends a null status
	    if (request.status != null) playbackStatus = request.status;
	    break;
	case 'gsTabClosing':
	    // Check if the message is from the active grooveshark tab
	    if (sender.tab.id == gsTabId) {
		if (debug) console.log("[BACKGROUND] The active tab (#"+sender.tab.id+") has been closed");
		gsTabId = null;
	    }
	    break;
	case 'update':
	    // If there is an active grooveshark tab, inject the scripts into it
	    if (gsTabId) {
		sk = localStorage["sessionKey"];
		inject_scripts(gsTabId);
	    }
	    break;
	}
    }
);

init();