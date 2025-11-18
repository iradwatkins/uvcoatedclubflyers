"use strict";
function wcuf_override_console() 
{
    
	
    var methods, generateNewMethod, i, j, cur, old, addEvent;

    if ("console" in window) {
        methods = [
            "log", "assert", "clear", "count",
            "debug", "dir", "dirxml", "error",
            "exception", "group", "groupCollapsed",
            "groupEnd", "info", "profile", "profileEnd",
            "table", "time", "timeEnd", "timeStamp",
            "trace", "warn"
        ];

        generateNewMethod = function (oldCallback, methodName) {
            return function () {
                var args;
                alert("called console." + methodName + ", with " + arguments.length + " argument(s)");
                args = Array.prototype.slice.call(arguments, 0);
                Function.prototype.apply.call(oldCallback, console, arguments);
            };
        };

        for (i = 0, j = methods.length; i < j; i++) {
            cur = methods[i];
            if (cur in console) {
                old = console[cur];
                console[cur] = generateNewMethod(old, cur);
            }
        }
    }

    window.onerror = function (msg, url, line) {
        alert("Some of your installed plugin are generating javascript errors that MAY prevent WCUF configurator to work properly.\nFix or disable them.\n\nError type: " + msg + "\nOn script: " + url + "\nLine: " + line + "\n\nTo DISABLE this warning message, go to Option menu and disalbe the 'Show warning message' option.");
	 };

	
}
wcuf_override_console();
