"use strict";
function WCUFMultipleFileUploader (params) 
{
	var myself 												= this;
	this.form_data 											= params.form_data;
	this.current_uploaded_file_index 						= 0;
	this.number_of_files_to_upload 							= params.files.length;
	this.files 												= params.files;
	this.file 												= params.file;
	this.file_name 											= params.file_name;
	this.xhr 												= new XMLHttpRequest(); //params.xhr;
	this.sum_all_file_sizes	 								= 0;
	this.already_loaded_globally_bytes 						= 0;
	this.bytes_loaded_until_latest_chunk_upload 			= 0;
	this.chunk_xhr;			
	this.upload_field_id 									= params.upload_field_id;
	this.crop_metadata 										= params.crop_metadata;
	this.isUploadingFileChunk 								= false;
	this.uploadcounter										= 0;
	this.uploadfilearray 									= [];		
	this.current_file;
	this.current_file_name;
	this.current_upload_session_id;
	this.formData;
	this.security 											= params.security;
	this.number_of_retries 									= 5;
	this.current_attempt 									= 0;
	this.timeout											= params.timeout;//280000 milliseconds (280 seconds). Default: 
	this.BYTES_PER_CHUNK 									= wcuf_max_chunk_size - 500  < 10485760 ? wcuf_max_chunk_size - 500 : 10485760 ; //wcuf_max_chunk_size - 500; //1048576; ->  1MB chunk sizes. 10485760 -> 10 MB
	this.BYTES_PER_CHUNK 									= this.BYTES_PER_CHUNK < 0 ? 10485760 : this.BYTES_PER_CHUNK;
	this.gone_in_timeout									= false;
	
	for(var i = 0; i < this.files.length; i++)
		this.sum_all_file_sizes += this.files[i].size;
	
	//This data is sent AFTER the chunks have been uploaed. They contain the upload metadata (quantity, is multiple, etc)
	this.xhr.timeout = this.timeout; 
	this.xhr.ontimeout = function(event)
	{
		if(myself.current_attempt++ < myself.number_of_retries)
		{
			if(myself.current_attempt > 1)
			{
				//UI
				wcuf_ui_update_time_out_text(myself.upload_field_id, myself.current_attempt, myself.number_of_retries);
			}
			//resend the metadata
			myself.xhr.send(myself.formData);
		}
		else 
			myself.onTimeout(event, this.xhr)
	};
	
	this.xhr.onreadystatechange = function(e) 
	{
		if (myself.xhr.readyState == 4) 
		{
			//1.
			if(myself.xhr.responseText === '0' || myself.xhr.responseText === '1')
			{
				
			}
			else if(myself.xhr.status == 200)
			{
				//2: All is ok, the upload can end (the continueUpload checks that the all the chunks have been uploaded)
				myself.continueUploading();
			}
			else if(myself.xhr.status == 503)
			{
				myself.onTimeout(e, myself.xhr);
			}
			else if(myself.xhr.readyState != 2 && (myself.xhr.readyState != 4)) //Error, retry uploading
			{
				myself.xhr.ontimeout();
			}
		}
	}
}
WCUFMultipleFileUploader.prototype.onTimeout = function(event, xhr)
{
	if(this.gone_in_timeout)
		return;
	
	//UI
	jQuery('#wcuf_status_'+this.upload_field_id).html(unescape(wcuf_upload_failed));
	jQuery('#wcuf_abort_upload_'+this.upload_field_id).hide();
	
	xhr.abort();
	this.gone_in_timeout	= true;
	var event 				= new Event('onWCUFMultipleFileUploaderTimeOut');
	event.timeout 			= true;
	event.element_id 		= this.upload_field_id;
	document.dispatchEvent(event);
}
WCUFMultipleFileUploader.prototype.abortUploading = function() 
{
	//UI
	jQuery('#wcuf_status_'+this.upload_field_id).html(unescape(wcuf_aborting_message));
	jQuery('#wcuf_abort_upload_'+this.upload_field_id).hide();
	
	this.xhr.abort();
	this.xhr.onreadystatechange = null;
	if(this.chunk_xhr)
	{
		this.chunk_xhr.abort();
		this.chunk_xhr.onreadystatechange = null;
	}
}
//This methods starts the "chunk upload" and checks if all thata has been sent
WCUFMultipleFileUploader.prototype.continueUploading = function() 
{
	
   if(this.current_uploaded_file_index == this.number_of_files_to_upload)
	{
		var event = new Event('onWCUFMultipleFileUploaderComplete');
		event.upload_field_id = this.upload_field_id;
		document.dispatchEvent(event);
		return false;
	}
	var i = this.current_uploaded_file_index; 
	this.current_file = this.number_of_files_to_upload == 1 ? this.file : this.files[i] ;
	this.current_file_name  = wcuf_replace_bad_char(this.current_file.name);
	var quantity = typeof this.files[i].quantity !== 'undefined' ? this.current_file.quantity : 1;
	
	this.current_upload_session_id = "chunk_"+Math.floor((Math.random() * 10000000) + 1);;
	this.formData = new FormData();
	
	
	for (var k in this.form_data)
		if (this.form_data.hasOwnProperty(k)) 
			this.formData.append(k, this.form_data[k]);
	
	this.formData.append('multiple', this.number_of_files_to_upload > 1 ? 'yes' : 'no'); //However is automatically updated when the server merges files
	this.formData.append('quantity_0', quantity);
	this.formData.append('crop_metadata', this.crop_metadata[i] ? JSON.stringify(this.crop_metadata[i]) : "{}");
	
	this.formData.append('file_session_id', this.current_upload_session_id);
	this.formData.append('file_name', this.current_file_name);
	this.formData.append('upload_field_name',this.file_name);
	this.formData = wcuf_globalHooks.applyFilters( 'wcuf_before_single_upload', this.formData, this.upload_field_id, i );
	
	this.xhr.open("POST", wcuf_ajaxurl, true); //This will be sent after the chunks have been uploaded
	this.current_uploaded_file_index++;
	
	this.startUploadingFileChunk();
	return true;
};

WCUFMultipleFileUploader.prototype.startUploadingFileChunk = function()
{
	var blob = this.current_file;
	var SIZE = blob.size;
	var start = 0;
	var end = this.BYTES_PER_CHUNK;
	this.uploadcounter=0;
	this.uploadfilearray = [];

	while( start < SIZE ) 
	{

		var chunk = blob.slice(start, end);  //blob.webkitSlice(start, end); 
		this.uploadfilearray[this.uploadcounter] = chunk;
		this.uploadcounter = this.uploadcounter+1;
		start = end;
		end = start + this.BYTES_PER_CHUNK;
	}
	this.uploadcounter = 0;
	this.continueUploadingFileChunk(this.uploadfilearray[this.uploadcounter]);
}

WCUFMultipleFileUploader.prototype.continueUploadingFileChunk = function(blobFile) 
{
	var chunkFormData = new FormData();
	var myself = this;
	
	this.chunk_xhr = new XMLHttpRequest();
	this.bytes_loaded_until_latest_chunk_upload = 0;
	
	chunkFormData.append("action", "wcuf_file_chunk_upload");
	chunkFormData.append("wcuf_file_chunk", blobFile);
	chunkFormData.append("wcuf_security", this.security );
	chunkFormData.append("wcuf_file_name", this.current_file_name);
	chunkFormData.append("wcuf_upload_field_name",  this.file_name);
	chunkFormData.append("wcuf_current_chunk_num",  this.uploadcounter);
	chunkFormData.append("wcuf_current_upload_session_id",  this.current_upload_session_id);
	chunkFormData.append("wcuf_is_last_chunk",  this.uploadfilearray.length - 1 == this.uploadcounter ? "true" : "false");
	
	this.chunk_xhr.open("POST", wcuf_ajaxurl);
	this.chunk_xhr.upload.addEventListener("progress",  function(event){myself.onSingleFileUploadProgress(myself,event)}, false);
	
	this.chunk_xhr.timeout = myself.timeout; 
	this.chunk_xhr.ontimeout = function(event)
	{
		if(myself.current_attempt++ < myself.number_of_retries)
		{
			if(myself.current_attempt > 1)
			{
				//UI
				wcuf_ui_update_time_out_text(myself.upload_field_id, myself.current_attempt, myself.number_of_retries);
			}
			
			myself.continueUploadingFileChunk(myself.uploadfilearray[myself.uploadcounter]); 
		}
		else 
			myself.onTimeout(event, myself.chunk_xhr)
	};
		
	this.chunk_xhr.onreadystatechange = function(e) 
	{
		if (myself.chunk_xhr.readyState == XMLHttpRequest.DONE && myself.chunk_xhr.responseText == '0') 
		{
			myself.onSingleFileUploadError(myself, e);
			
			return;
		}			
		//All is ok
		if (myself.chunk_xhr.readyState == 4 && myself.chunk_xhr.status == 200) 
		{
			myself.uploadcounter++;
			myself.current_attempt = 0;
			if (myself.uploadfilearray.length > myself.uploadcounter )
			{
				myself.continueUploadingFileChunk(myself.uploadfilearray[myself.uploadcounter]); 			                             
			}
			else
			{
				//After the single file has properly chunk uploaded, the global xhr sends the file meta data info in order the plugin to move the file and store into session
				try{
						
					myself.xhr.send(myself.formData);
				}catch(e){}

			}
		}
		else if(myself.chunk_xhr.status == 503)
		{
			myself.onTimeout(e, myself.chunk_xhr);
		}
		//Error, retry uploading
		else if(myself.chunk_xhr.readyState != 2 && myself.chunk_xhr.readyState != 4)
		{
			myself.chunk_xhr.ontimeout();
		}
	};
	
	this.chunk_xhr.send(chunkFormData);
}

WCUFMultipleFileUploader.prototype.onSingleFileUploadLoaded = function(myself, event, chunk_xhr) 
{
	console.log(this.responseJSON());	
}
WCUFMultipleFileUploader.prototype.onSingleFileUploadError = function(myself, event) 
{
	myself.already_loaded_globally_bytes -= myself.BYTES_PER_CHUNK;
	
	myself.BYTES_PER_CHUNK = myself.BYTES_PER_CHUNK/2;
	if(myself.BYTES_PER_CHUNK <= 0)
		myself.BYTES_PER_CHUNK = 1048576;
	
	myself.startUploadingFileChunk(myself.uploadfilearray[myself.uploadcounter]); 	
}

WCUFMultipleFileUploader.prototype.getCurrentUploadedFileIndex = function() 
{
     return this.current_uploaded_file_index;
};
WCUFMultipleFileUploader.prototype.setGloballyLoadedBytes = function(already_loaded, myself) 
{
	myself.already_loaded_globally_bytes += already_loaded - myself.bytes_loaded_until_latest_chunk_upload;
	myself.bytes_loaded_until_latest_chunk_upload = already_loaded; 
}; 

WCUFMultipleFileUploader.prototype.getNumberOfFilesToUpload = function() 
{
     return this.number_of_files_to_upload;
};

WCUFMultipleFileUploader.prototype.onSingleFileUploadProgress = function(myself, event)
{
	myself.setGloballyLoadedBytes(event.loaded, myself);
	var pc = parseInt((myself.already_loaded_globally_bytes / myself.sum_all_file_sizes * 100));
	pc = pc > 100 ? 100 : pc;
	jQuery('#wcuf_bar_'+myself.upload_field_id).css('width', pc+"%");
	jQuery('#wcuf_percent_'+myself.upload_field_id).html(pc + "%");
	

	
}
WCUFMultipleFileUploader.prototype.cloneObject = function( original )  
{
    var clone = Object.create( Object.getPrototypeOf( original ) ) ;
    var i , keys = Object.getOwnPropertyNames( original ) ;

    for ( i = 0 ; i < keys.length ; i ++ )
    {
        Object.defineProperty( clone , keys[ i ] ,
            Object.getOwnPropertyDescriptor( original , keys[ i ] )
        ) ;
    }

    return clone;
}