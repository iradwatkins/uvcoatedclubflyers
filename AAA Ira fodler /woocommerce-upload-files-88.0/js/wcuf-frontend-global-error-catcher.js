"use strict";
// Try to catch unhandled/uncaught exceptions
var wcuf_global_error_already_catched = false;
window.onerror = function (msg, url, line) 
{
	if(wcuf_global_error_already_catched)
		return true;

	wcuf_global_error_already_catched = true;
	console.log("WCUF managed a unhandled/uncaught error by 3rd party plugin. This may cause the WCUF plugin to not properly work ");
    console.log("Error caught[via window.onerror]: " + msg);
    console.log("from: " + url);
    console.log("line: " + line);
    return true; 
};

window.addEventListener('error', function (evt) 
{
	if(wcuf_global_error_already_catched)
		return true;

	wcuf_global_error_already_catched = true;
	console.log("WCUF managed a unhandled/uncaught error by 3rd party plugin. This may cause the WCUF plugin to not properly work ");
    console.log("Caught[via 'error' event]:  " + evt.message);
    console.log("from: " + evt.filename);
    console.log("line: " + evt.lineno);
    console.log(evt); 
    evt.preventDefault();
});
//
