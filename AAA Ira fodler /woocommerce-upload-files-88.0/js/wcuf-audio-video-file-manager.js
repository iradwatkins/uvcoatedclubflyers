"use strict";
function WCUFAudioAndVideoLenghtChecker(evt, callback)
{
	var myself = this;
	var id =  jQuery(evt.currentTarget).data('id');
	this.current_elem = jQuery('#wcuf_upload_field_'+id);
	this.min_lenght = this.current_elem.data("min-length");
	this.max_lenght = this.current_elem.data("max-length");; //sec
	this.consider_sum_length = this.current_elem.data("consider-sum-length"); //boolen
	this.is_multiple = jQuery(evt.currentTarget).hasClass('wcuf_upload_multiple_files_button');
	this.files = this.is_multiple ? wcuf_multiple_files_queues[id] : evt.target.files;
	this.current_index = 0;
	this.callback = callback;
	this.evt = evt;
	this.current_status = 0; //0: loading audio, 1: loading video, 2: end
	this.length_already_uploaded = this.current_elem.data("length-already-uploaded");
	this.total_length_sum = this.length_already_uploaded;
	
	//No need to check
	if(this.min_lenght == 0 && this.max_lenght == 0)
	{
		if(!evt.hasOwnProperty('not_invoke_the_callback') || !evt.not_invoke_the_callback)
		{
			callback(evt);
		}
		return;
	}
	
	//Audio
	this.initMediaElement('audio');
	
	this.loadNextFile();
}
WCUFAudioAndVideoLenghtChecker.prototype.initMediaElement = function(type) 
{
	var myself = this;
	this.current_index = 0;
	this.media_element = document.createElement(type); 
	this.media_element.addEventListener('loadedmetadata',function(event){myself.processLoadedAudioMetaData(myself, event)},false);
	this.media_element.addEventListener('error',function(event){myself.onLoadingError(myself, event)},false);
}

WCUFAudioAndVideoLenghtChecker.prototype.loadNextFile = function() 
{
	if(this.current_index < this.files.length)
	{
		var objectUrl = URL.createObjectURL(this.files[this.current_index++]);
		this.media_element.src = objectUrl;
	}
	else //End
	{
		if(this.consider_sum_length && ( this.total_length_sum < this.min_lenght || (this.max_lenght != 0 && this.total_length_sum > this.max_lenght )))
		{
			this.displayErrorPopup('length'); //ToDo: change error type?
		}	
		else 
		{
			this.media_element = null;
			this.callback(this.evt);
		}
	}
}
WCUFAudioAndVideoLenghtChecker.prototype.processLoadedAudioMetaData = function(myself, event) 
{
	
	var duration = Math.trunc(event.target.duration);
	this.total_length_sum += duration;
	
	
	if(!this.consider_sum_length && ( duration < this.min_lenght || (this.max_lenght != 0 && duration > this.max_lenght )))
	{
		this.displayErrorPopup('length');
	}
	else 
		myself.loadNextFile();
}
WCUFAudioAndVideoLenghtChecker.prototype.onLoadingError = function(myself, event) 
{
	
	if(this.min_lenght != 0 || this.max_lenght != 0)
	{
		this.displayErrorPopup('invalid_file');
	}
	else 
		myself.loadNextFile();
}
WCUFAudioAndVideoLenghtChecker.prototype.displayErrorPopup = function(type) 
{
	this.media_element = null;
	
	if(type == 'length')
	{
		var size_string = "<br/>";
		size_string += this.min_lenght != 0 ? wcuf_media_min_length_text+" "+this.secondsToHms(this.min_lenght)+"<br/>" : ""; 
		size_string += this.max_lenght != 0 ? wcuf_media_max_length_text+" "+this.secondsToHms(this.max_lenght)+"<br/>" : ""; 

		wcuf_show_popup_alert(wcuf_media_length_error+" "+size_string);
	}
	else if('invalid_file')
	{
		wcuf_show_popup_alert(wcuf_media_file_type_error);
	}
}
WCUFAudioAndVideoLenghtChecker.prototype.secondsToHms = function(d) 
{
    d = Number(d);

    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    return ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
}