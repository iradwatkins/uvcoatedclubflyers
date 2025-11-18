"use strict";
function Van_MultipleFileUploader (params) 
{
	var myself = this;
	
	this.on_progess_callback = params.on_progess_callback; 
	this.on_single_file_upload_complete_callback = params.on_single_file_upload_complete_callback; 
	
    /* this.form_data = params.form_data;  */
	this.current_uploaded_file_index = 0;
	this.number_of_files_to_upload = params.files.length;
	this.files = params.files;
	//this.xhr = new XMLHttpRequest(); 
	this.sum_all_file_sizes = 0;
	this.already_loaded_globally_bytes = 0;
	this.bytes_loaded_until_latest_chunk_upload = 0;
	this.isUploadingFileChunk = false;
	this.uploadcounter=0;
	this.uploadfilearray = [];		
	this.current_file;
	this.current_file_name;
	this.current_upload_session_id;
	this.formData;
	this.BYTES_PER_CHUNK = wcuf_max_chunk_size - 500  < 10485760 ? wcuf_max_chunk_size - 500 : 10485760 ; //wcuf_max_chunk_size - 500; //1048576; ->  1MB chunk sizes. 10485760 -> 10 MB
	this.BYTES_PER_CHUNK = this.BYTES_PER_CHUNK < 0 ? 10485760 : this.BYTES_PER_CHUNK;
	this.security = params.security;
	
	for(var i = 0; i < this.files.length; i++)
		this.sum_all_file_sizes += this.files[i].size;
	
	
}
 
Van_MultipleFileUploader.prototype.continueUploading = function() 
{
	//Used to display progress bar
	
	if(this.current_uploaded_file_index > 0)
	{
		var event = new Event('on_Van_SingleFileUploadComplete');
		event.session_id = this.current_upload_session_id;
		event.file_name = this.current_file_name;
		
		this.on_single_file_upload_complete_callback(event);
	}
	
   if(this.current_uploaded_file_index == this.number_of_files_to_upload)
	{
		var event = new Event('on_Van_MultipleFileUploaderComplete');
		document.dispatchEvent(event);
		return false;
	}
		
	var i = this.current_uploaded_file_index; 
	this.current_file = this.files[i];
	this.current_file_name  = wcuf_replace_bad_char(this.current_file.name); 
	
	
	this.current_upload_session_id = "chunk_"+Math.floor((Math.random() * 10000000) + 1);;
	this.formData = new FormData();
	
	
	for (var k in this.form_data)
		if (this.form_data.hasOwnProperty(k)) 
			this.formData.append(k, this.form_data[k]); 
	
	//Every time a chunked file is uploaded, it is notified to the server that processes it and its metadata
	this.current_uploaded_file_index++;
	
	this.startUploadingFileChunk();
	return true;
};

Van_MultipleFileUploader.prototype.startUploadingFileChunk = function()
{
	var blob = this.current_file;
	var SIZE = blob.size;
	var start = 0;
	var end = this.BYTES_PER_CHUNK;
	this.uploadcounter=0;
	this.uploadfilearray = [];

	while( start < SIZE ) 
	{

		var chunk = blob.slice(start, end);  
		this.uploadfilearray[this.uploadcounter] = chunk;
		this.uploadcounter = this.uploadcounter+1;
		start = end;
		end = start + this.BYTES_PER_CHUNK;
	}
	this.uploadcounter = 0;
	this.continueUploadingFileChunk(this.uploadfilearray[this.uploadcounter]);
}

Van_MultipleFileUploader.prototype.continueUploadingFileChunk = function(blobFile) 
{
	var chunkFormData = new FormData();
	var chunk_xhr = new XMLHttpRequest();
	var myself = this;
	this.bytes_loaded_until_latest_chunk_upload = 0;
	
	
	chunkFormData.append("action", "wcuf_file_chunk_upload");
	chunkFormData.append("wcuf_security", this.security );
	chunkFormData.append("wcuf_file_chunk", blobFile);
	chunkFormData.append("wcuf_file_name", this.current_file_name);
	chunkFormData.append("wcuf_upload_field_name",  this.file_name);
	chunkFormData.append("wcuf_current_chunk_num",  this.uploadcounter);
	chunkFormData.append("wcuf_current_upload_session_id",  this.current_upload_session_id);
	chunkFormData.append("wcuf_is_last_chunk",  this.uploadfilearray.length - 1 == this.uploadcounter ? "true" : "false");
	
	chunk_xhr.open("POST", wcuf_ajaxurl);
	chunk_xhr.upload.addEventListener("progress",  function(event){myself.onSingleFileUploadProgress(myself,event)}, false);
	chunk_xhr.onreadystatechange = function(e) 
	{
		if (chunk_xhr.readyState == XMLHttpRequest.DONE && chunk_xhr.responseText == '0') 
		{
			myself.onSingleFileUploadError(myself, e);
			return;
		}			
		
		if (chunk_xhr.readyState == 4 && chunk_xhr.status == 200) 
		{
			myself.uploadcounter++;
			if (myself.uploadfilearray.length > myself.uploadcounter )
			{
				myself.continueUploadingFileChunk(myself.uploadfilearray[myself.uploadcounter]); 			                             
			}
			else
			{
				//After the single file has properly chunk uploaded, the global xhr sends the file meta data info in order the plugin to move the file and store into session
				try{
						
					myself.continueUploading();
				}catch(e){}

			}
		}
	};
	chunk_xhr.send(chunkFormData);

}

Van_MultipleFileUploader.prototype.onSingleFileUploadLoaded = function(myself, event, chunk_xhr) 
{
	console.log(this.responseJSON());	
}
Van_MultipleFileUploader.prototype.onSingleFileUploadError = function(myself, event) 
{
	myself.already_loaded_globally_bytes -= myself.BYTES_PER_CHUNK;
	
	myself.BYTES_PER_CHUNK = myself.BYTES_PER_CHUNK/2;
	if(myself.BYTES_PER_CHUNK <= 0)
		myself.BYTES_PER_CHUNK = 1048576;
	
	myself.startUploadingFileChunk(myself.uploadfilearray[myself.uploadcounter]); 	
}

Van_MultipleFileUploader.prototype.getCurrentUploadedFileIndex = function() 
{
     return this.current_uploaded_file_index;
};
Van_MultipleFileUploader.prototype.setGloballyLoadedBytes = function(already_loaded, myself) 
{
	myself.already_loaded_globally_bytes += already_loaded - myself.bytes_loaded_until_latest_chunk_upload;
	myself.bytes_loaded_until_latest_chunk_upload = already_loaded; 
}; 

Van_MultipleFileUploader.prototype.getNumberOfFilesToUpload = function() 
{
     return this.number_of_files_to_upload;
};

Van_MultipleFileUploader.prototype.onSingleFileUploadProgress = function(myself, event)
{
	myself.setGloballyLoadedBytes(event.loaded, myself);
	var pc = parseInt((myself.already_loaded_globally_bytes / myself.sum_all_file_sizes * 100));
	pc = pc > 100 ? 100 : pc;
	
	var event = new Event('on_Van_FileUploadProgress');
	event.pc = pc;
	myself.on_progess_callback(event);
}
Van_MultipleFileUploader.prototype.cloneObject = function( original )  
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