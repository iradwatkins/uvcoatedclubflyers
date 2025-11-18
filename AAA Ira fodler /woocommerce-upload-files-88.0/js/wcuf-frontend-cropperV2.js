"use strict";
var wcuf_cropper_popup;
var wcuf_cropper_js;
var wcuf_crop_is_multiple_file_upload;
var wcuf_crop_event_to_propagate;
var wcuf_crop_curr_file;
var wcuf_crop_curr_upload_id;
var wcuf_crop_curr_rotation;
var wcuf_cropped_image_width;
var wcuf_cropped_image_height;
var wcuf_cropper_autoadjust;
var wcuf_cropper_enable_ratio_usage;
var wcuf_crop_file_unique_id;
var wcuf_crop_enable_compression = false;
var wcuf_user_can_resize = false;
var wcuf_crop_compression_quality = 1;
var wcuf_crop_coordinates = {};
jQuery(document).ready(function()
{
	jQuery(document).on('click', '.wcuf_single_crop_button', wcuf_crop_single_file_when_multiple_uploading);
	jQuery(document).on('click', '#wcuf_crop_cancel_button', wcuf_close_popup_dialog);
	jQuery(document).on('click', '.wcuf_crop_manipulation_button', wcuf_crop_manipulate_image);
	jQuery(document).on('click', '#wcuf_crop_save_button', wcuf_crop_save_and_close);
	jQuery(document).on('click', '#wcuf_crop_landascape', wcuf_rotate_crop_area);
	jQuery(document).on('click', '#wcuf_crop_portrait', wcuf_rotate_crop_area);
	jQuery(document).on('click', '.mfp-close', wcuf_close_cropper_modal);
});
function wcuf_show_cropper_on_file_selection(id, event) //invoked when cropping a single file
{
	wcuf_crop_is_multiple_file_upload = false;
	const file_unique_id = jQuery(event.currentTarget).data('file-unique-id');
	wcuf_crop_file_unique_id = file_unique_id;
	
	wcuf_crop_event_to_propagate = event;
	wcuf_crop_event_to_propagate.file_id = id,
	wcuf_crop_event_to_propagate.file_unique_id = file_unique_id,
	wcuf_crop_event_to_propagate.file_index = 0;
	wcuf_crop_event_to_propagate.disable_auto_upload = wcuf_crop_event_to_propagate.hasOwnProperty('disable_auto_upload') && wcuf_crop_event_to_propagate;
	
	wcuf_crop_init_vars(id, event.target.files[0]);
	wcuf_crop_init_popup();
	return false
}
function wcuf_crop_single_file_when_multiple_uploading(event) //invoked when cropping one of the file of a multiple files selection
{
	wcuf_crop_is_multiple_file_upload = true;
	
	event.preventDefault();
	event.stopImmediatePropagation(); 
	
	const file_id = jQuery(event.currentTarget).data('id');
	const file_unique_id = jQuery(event.currentTarget).data('file-unique-id');
	wcuf_crop_file_unique_id = file_unique_id;
	let file_index = -1;
	
	//File reference
	for(let i = 0; i < wcuf_multiple_files_queues[file_id].length; i++)
		if( wcuf_multiple_files_queues[file_id][i].unique_id == file_unique_id)
			file_index = i;
	
	if(file_index < 0)
		return false;
	
	wcuf_crop_event_to_propagate = {target: {files:[wcuf_multiple_files_queues[file_id][file_index]]},
					  file_id: file_id,
					  file_unique_id: file_unique_id,
					  file_index: file_index};
	//
	
	//Init
	wcuf_crop_init_vars(file_id, wcuf_multiple_files_queues[file_id][file_index]);
	wcuf_crop_init_popup()	
	
	return false
}

function wcuf_crop_init_vars(id, file_ref)
{
	wcuf_crop_coordinates[id] = wcuf_crop_coordinates[id]  || {};
	wcuf_crop_curr_rotation = 0;
	wcuf_crop_curr_upload_id = id;
	wcuf_crop_curr_file = file_ref;
	wcuf_manage_crop_actions_ui(true);
	jQuery('#wcuf_crop_status').html("");
}
// *********** Setting up the popup and loading the image ***********
//1
function wcuf_crop_init_popup()
{
	jQuery("#wcuf_cropper_popup").css({'display':'block'});
	wcuf_cropper_popup = jQuery.magnificPopup.open({
	  items: {
		src: '#wcuf_cropper_popup'
	  },
	  type: 'inline',
	  closeOnBgClick: false,
	  enableEscapeKey: false,
	  closeOnContentClick: false,
	  callbacks: {
		  open: function()
		  {
			  wcuf_crop_load_image_data()
		  },
		  close: wcuf_on_cropper_popup_closed
	  }
	});
	
	wcuf_cropper_popup = jQuery.magnificPopup.instance;
}
//2
function wcuf_crop_load_image_data()
{
	//The choosen uploaded file is read. Once done, it is passed to the Cropper
	var reader = new FileReader();
	reader.onload = function(e) //Load event
	{
		var image_loaded_result = wcuf_dataURItoBlob(e.target.result);
		if(image_loaded_result.type == "image/jpeg" || image_loaded_result.type == "image/png")
		{
			
			wcuf_init_cropper(e.target.result);
		}		  
	}
	reader.readAsDataURL(wcuf_crop_curr_file);
		
}
//3
function wcuf_init_cropper(image_data_base64)
{
	var image_holder = document.getElementById("wcuf_image_to_crop");
	image_holder.src = image_data_base64;
			
	//Options 
	wcuf_cropped_image_width = jQuery("#wcuf_upload_field_"+wcuf_crop_curr_upload_id).data('cropped-width');
	wcuf_cropped_image_height = jQuery("#wcuf_upload_field_"+wcuf_crop_curr_upload_id).data('cropped-height');
	wcuf_cropper_autoadjust = jQuery("#wcuf_upload_field_"+wcuf_crop_curr_upload_id).data('cropper-autoadjust') && wcuf_cropped_image_width != wcuf_cropped_image_height;
	
	wcuf_cropper_enable_ratio_usage = jQuery("#wcuf_upload_field_"+wcuf_crop_curr_upload_id).data('cropper-enable-ratio') == 1;
	wcuf_crop_enable_compression = jQuery("#wcuf_upload_field_"+wcuf_crop_curr_upload_id).data('cropper-compress-image') ? true : false;
	wcuf_crop_compression_quality = jQuery("#wcuf_upload_field_"+wcuf_crop_curr_upload_id).data('cropper-compression-quality');
	wcuf_user_can_resize = jQuery("#wcuf_upload_field_"+wcuf_crop_curr_upload_id).data('cropper-allow-resize');
	var image_fit_canvas = jQuery("#wcuf_upload_field_"+wcuf_crop_curr_upload_id).data('cropper-image-fit-canvas') ? true : false;
	var shape = jQuery("#wcuf_upload_field_"+wcuf_crop_curr_upload_id).data('crop-area-shape');

	if(wcuf_cropped_image_height/wcuf_cropped_image_width == 1)
		jQuery('#wcuf_crop_landascape, #wcuf_crop_portrait').hide();
	
	
	//Cropper init
	if(wcuf_cropper_js)
		wcuf_cropper_js.destroy();
	wcuf_cropper_js = new Cropper(image_holder, {
	  autoCropArea: 1,
	  autoCrop: true,
	  cropBoxMovable: true,
	  restore:false,
	  viewMode: image_fit_canvas ? 3 : 2, 															//2: the images fits using the shortest edge. 3: longest edge
	  aspectRatio: wcuf_cropped_image_width && wcuf_cropped_image_width ? 1 : null, 				//If resizable, no aspect ration is set
	  cropBoxResizable: wcuf_user_can_resize,
	  dragMode: wcuf_user_can_resize ? 'crop' : 'move',
	  zoomable: wcuf_options.disable_zoom_controller == "false",
	  zoomOnTouch: wcuf_options.disable_zoom_controller == "false",
	  zoomOnWheel: wcuf_options.disable_zoom_controller == "false", 	  
	 /*  data:wcuf_cropper_is_resizable ? null :
	    { //define cropbox size
		  width: wcuf_cropped_image_width,
		  height:  wcuf_cropped_image_height,
		},  */
	  ready: function (e) 
	  {
		 //Dynamic crop area adjust
		wcuf_crop_adjust_area();
	  },
	  close: function(e)
	  {
		  wcuf_close_popup_dialog(e);
	  }
	});
	
}
function wcuf_close_cropper_modal(event)
{
	wcuf_close_popup_dialog(event);
}
// *********** End loading and setup ***********

// *********** Image manipulation (rotate, crop, etc) ***********
function wcuf_rotate_crop_area(event)
{
	var mode = jQuery(event.currentTarget).data("mode");
	var min = wcuf_cropped_image_width > wcuf_cropped_image_height ? wcuf_cropped_image_height : wcuf_cropped_image_width;
	var max = wcuf_cropped_image_width > wcuf_cropped_image_height ? wcuf_cropped_image_width : wcuf_cropped_image_height;
	wcuf_cropper_js.setAspectRatio(mode == "landscape" ? max/min : min/max);
}
function wcuf_crop_adjust_area()
{
	var img_data = wcuf_cropper_js.getImageData();
	var cropper_area_width = wcuf_cropped_image_width;
	var cropper_area_height =  wcuf_cropped_image_height;
	var adjust_crop_area = false;
	var selected_ratio = cropper_area_width/cropper_area_height;
	
	if(cropper_area_width && cropper_area_height)
		adjust_crop_area = true;
	
		
	
	if(wcuf_cropper_enable_ratio_usage)
	{
		if(selected_ratio > 1)
		{
			cropper_area_width = img_data.naturalWidth; 
			cropper_area_height = img_data.naturalWidth / selected_ratio;
		}
		else if(selected_ratio == 1) //square
		{
			cropper_area_width = img_data.naturalWidth > img_data.naturalHeight ? img_data.naturalHeight : img_data.naturalWidth;
			cropper_area_height = cropper_area_width;
		}
		else 
		{
			cropper_area_width = img_data.naturalHeight * selected_ratio;
			cropper_area_height = img_data.naturalHeight;
		}
		
		adjust_crop_area = true;
		
	}
	
	if(wcuf_cropper_autoadjust)
	{
		//If the rotation has been performed via server, the current image width / height is the one retuned by the getImageData() (because a new image, sent by the server, was reloaded). 
		//Otherwise we need to recopute it (the original image is the same, it has only be rotated by the controller)
		var current_image_width = wcuf_options.crop_rotation_method != 'server_side' && (Math.abs(wcuf_crop_curr_rotation) == 90 || Math.abs(wcuf_crop_curr_rotation) == 270) ? img_data.naturalHeight : img_data.naturalWidth;
		var current_image_height = wcuf_options.crop_rotation_method != 'server_side' && (Math.abs(wcuf_crop_curr_rotation) == 90 || Math.abs(wcuf_crop_curr_rotation) == 270) ? img_data.naturalWidth : img_data.naturalHeight;


		var maintain = (current_image_width/current_image_height <= 1 && cropper_area_width/cropper_area_height <= 1) || 
						(current_image_width/current_image_height > 1 && cropper_area_width/cropper_area_height > 1);
		
		if(!maintain)
		{
			var tmp = cropper_area_width;
			cropper_area_width = cropper_area_height;
			cropper_area_height = tmp;
			
			adjust_crop_area = true;
		} 
		
		selected_ratio = cropper_area_width/cropper_area_height;
	}
	
	
	//In the new version the cropbox is managed using ratio. The output is eventually resized according the upload field crop width and height settings
	if(adjust_crop_area)
		/* wcuf_cropper_js.setData({ 
					  width: cropper_area_width,
					  height:  cropper_area_height,
					});  */
	
		wcuf_cropper_js.setAspectRatio(selected_ratio);			
	//wcuf_center_crop_area();
}
function wcuf_center_crop_area() //no use
{
	var container_data = wcuf_cropper_js.getContainerData();
	var croparea_data = wcuf_cropper_js.getCropBoxData();
	var image_data = wcuf_cropper_js.getImageData();
	var canvas_data = wcuf_cropper_js.getData();
	var left = croparea_data.left + ((image_data.width/2) - (croparea_data.width/2));
	var top = ((image_data.height/2) - (croparea_data.height/2));
	

	if((Math.abs(canvas_data.rotate) == 90 || Math.abs(canvas_data.rotate) == 270))
	{
		
		var left = croparea_data.left + ((image_data.height/2) - (croparea_data.height/2));
		var top = croparea_data.height + ((image_data.left/2) - (croparea_data.left/2));
	}
	wcuf_cropper_js.setCropBoxData({ 
		left:left,
		top:top,
		width:croparea_data.width,
		height:croparea_data.height,
	}); 
}
function wcuf_crop_manipulate_image(event)
{
	event.preventDefault();
	event.stopImmediatePropagation();
	
	var action = jQuery(event.currentTarget).data('action');
	var param =  jQuery(event.currentTarget).data('param');
	
	switch(action)
	{
		case 'rotate': 
			//rotation paramenter value management
			wcuf_crop_curr_rotation -= param;
			wcuf_crop_curr_rotation = Math.abs(wcuf_crop_curr_rotation) == 360 ? 0 : wcuf_crop_curr_rotation;
			
			if(wcuf_options.crop_rotation_method == 'server_side')
				wcuf_crop_upload_image_for_rotatation(param); 
			else
			{
				wcuf_cropper_js.rotate(param);
				wcuf_crop_adjust_area();
			}
		break;
		case 'zoom': wcuf_cropper_js.zoom(param);
		break;
	}
	
	return false
}
//  Remote image processing (crop and rotatio)
function wcuf_crop_upload_image_for_rotatation(degrees)
{
	var xhr = new XMLHttpRequest();
	if(!xhr.upload)
		return;
	
	//UI
	wcuf_manage_crop_actions_ui(false);
	xhr.onreadystatechange = function(event) 
	{
		if (xhr.readyState == 4) 
		{
			//1.
			jQuery('#wcuf_crop_status').html(xhr.status == 200 ? wcuf_success_msg : wcuf_failure_msg);
			if(xhr.status == 200)
			{
				//2
				wcuf_manage_crop_actions_ui(true);
				//Upload and rotation is ended --> Reload image
				wcuf_init_cropper(event.target.response);
			}
		}
	};
	
	// **** SENDING IMAGE TO SERVER ****
	//data structure to manage progress bar
	var a = function(event)
	{
			jQuery('#wcuf_crop_remote_processing_upload_bar').css('width', event.pc+"%");
			jQuery('#wcuf_crop_rotating_upload_percent').html(event.pc + "%");
	};
	//When the file upload ends, the following data structure is sent. The data structure contains the actions to perform (action to perform: rotation, degree to rotate, etc)
	var b = function(event)
	{
				var formData = new FormData();
				formData.append('action', 'wcuf_rotate_image'); 
				formData.append('degrees', wcuf_crop_curr_rotation);
				formData.append('session_id', event.session_id);
				formData.append('file_name', event.file_name);
				xhr.open("POST", wcuf_ajaxurl, true); //3rd parameter: async ->true/false
				xhr.send(formData); 
				//NOTE: see the xhr.onreadystatechange to know when the rotation process end, which callback is invoked (wcuf_reload_image)
	};
	var multiple_file_uploader = new Van_MultipleFileUploader({files: [wcuf_crop_curr_file], on_progess_callback: a, on_single_file_upload_complete_callback:b, security:wcuf_options.security});
	multiple_file_uploader.continueUploading();
}
// *********** End image manipulation ***********
	
// *********** Save the cropped image ***********
function wcuf_crop_save_and_close(event)
{
	//UI 
	jQuery("#wcuf_single_crop_button_"+wcuf_crop_file_unique_id).remove(); //The crop button is removed
	wcuf_manage_crop_actions_ui(false);
	 
	if(wcuf_options.crop_method == 'server_side')
	{
		wcuf_crop_via_server_and_save();
		return;
	}
	
	//Metadata containing the coordinate of the cropped portion of the original image
	wcuf_crop_coordinates[wcuf_crop_event_to_propagate.file_id][wcuf_crop_event_to_propagate.file_index] = wcuf_crop_coordinates[wcuf_crop_event_to_propagate.file_id][wcuf_crop_event_to_propagate.file_index] || {};
	wcuf_crop_coordinates[wcuf_crop_event_to_propagate.file_id][wcuf_crop_event_to_propagate.file_index] = wcuf_cropper_js.getData();	
	
	var cropped_data =  wcuf_cropper_js.getCroppedCanvas(!wcuf_cropper_enable_ratio_usage ? { width: wcuf_cropped_image_width, height: wcuf_cropped_image_height} : {})/* .toDataURL() */;
	cropped_data.toBlob(function(blob) 
	 {
		 //It seems that the Compressor (even if doing nothing) forces the image "onto the background layer". This seems making the JPG complianto to its standard and compatible with Photoshop
		 //So compression is always perfomed. It is set to 1 when not "enabled"
		/* if(!wcuf_crop_enable_compression)
		{
			wcuf_crop_set_image_data(blob,wcuf_crop_event_to_propagate.target.files[0].name);
			wcuf_close_popup_dialog(event);
		}
		else
		{ */
		  
		 new Compressor(blob, 
			{
				quality: wcuf_crop_enable_compression ? wcuf_crop_compression_quality : 1,
				success(result) 
				{
					wcuf_crop_set_image_data(result, wcuf_crop_event_to_propagate.target.files[0].name);
					wcuf_close_popup_dialog(event);
				},
				error(err) 
				{
				   console.log("WooCommerce Upload Files: no compression performed");
				  console.log(err.message);
				  wcuf_crop_set_image_data(blob,wcuf_crop_event_to_propagate.target.files[0].name);
				  wcuf_close_popup_dialog(event);
				}
			});
		//}
	 });
	
}
function wcuf_crop_set_image_data(blob, name)
{
	blob.name = wcuf_crop_event_to_propagate.target.files[0].name; //not used
	wcuf_crop_event_to_propagate.blob = blob;	
	wcuf_end_cropping_process();
}
function wcuf_crop_via_server_and_save()
{
	//UI
	wcuf_manage_crop_actions_ui(false);

	var xhr = new XMLHttpRequest();
	xhr.responseType = 'blob';
	if(!xhr.upload)
		return;
	xhr.onreadystatechange = function(event) 
	{
		if (xhr.readyState == 4) 
		{
			//1.
			jQuery('#wcuf_status').html(xhr.status == 200 ? wcuf_success_msg : wcuf_failure_msg);
			if(xhr.status == 200)
			{
				
				
				//In case the output is a base64 string (remember to change the responseType to text)
				/* var result = JSON.parse(event.target.response);
				evt.blob = wcuf_b64toBlob(result.data, result.type); */
				
				wcuf_crop_set_image_data(event.target.response, wcuf_crop_event_to_propagate.target.files[0].name);
				wcuf_close_popup_dialog(event);

			}
		}
	};
	
	// **** SENDING IMAGE TO SERVER ****
	//data structure to manage progress bar
	var a = function(event)
	{
			jQuery('#wcuf_crop_rotating_upload_bar').css('width', event.pc+"%");
			jQuery('#wcuf_crop_rotating_upload_percent').html(event.pc + "%");
	};
	//When the file upload ends, the following data structure is sent. The data structure contains the actions to perform (action to perform: rotation, degree to rotate, etc)
	var b = function(event)
	{
		var crop_data = wcuf_cropper_js.getData()
		var formData = new FormData();
		
		formData.append('action', 'wcuf_crop_image'); 
		formData.append('width', crop_data.width);
		formData.append('height', crop_data.height);
		formData.append('startX', crop_data.x);
		formData.append('startY', crop_data.y);
		formData.append('ratio_usage', wcuf_cropper_enable_ratio_usage ? "true" : "false");
		formData.append('final_width', wcuf_cropped_image_width == 0 ? crop_data.width : wcuf_cropped_image_width);
		formData.append('final_height', wcuf_cropped_image_height == 0 ? crop_data.height : wcuf_cropped_image_height);
		formData.append('quality', wcuf_crop_enable_compression ? wcuf_crop_compression_quality : 1);
		formData.append('degree', wcuf_crop_curr_rotation);
		formData.append('session_id', event.session_id);
		formData.append('file_name', event.file_name);
		xhr.open("POST", wcuf_ajaxurl, true); //3rd parameter: async ->true/false
		xhr.send(formData); 
		//NOTE: see the xhr.onreadystatechange to know when the rotation process end, which callback is invoked (wcuf_reload_image)
	};
	var multiple_file_uploader = new Van_MultipleFileUploader({files: [wcuf_crop_curr_file], on_progess_callback: a, on_single_file_upload_complete_callback:b, security:wcuf_options.security});
	multiple_file_uploader.continueUploading();
	return false;
}
function wcuf_end_cropping_process()
{
	if(wcuf_crop_is_multiple_file_upload) //Multiple files upload
		wcuf_on_crop_performed_during_multiple_upload(wcuf_crop_event_to_propagate);
	else if(!wcuf_crop_event_to_propagate.disable_auto_upload)
		wcuf_backgroud_file_upload(wcuf_crop_event_to_propagate); //In case of single file, once the cropping ended, the upload is automatically started
}
//  Used in case of multple file upload
function wcuf_on_crop_performed_during_multiple_upload(event)
{
	const file_id = event.file_id;
	let file_index = -1;
	const file_unique_id = event.file_unique_id;
	const file_preview_name = "#wcuf_single_image_preview_"+file_unique_id;
	
	for(let i = 0; i < wcuf_multiple_files_queues[file_id].length; i++)
		if( wcuf_multiple_files_queues[file_id][i].unique_id == file_unique_id)
			file_index = i;
	if(file_index < 0)
		return;		
	
	//UI: remove mandatory crop border 
	jQuery('#wcuf_single_file_in_multiple_list_'+file_unique_id).removeClass('wcuf_mandatory_crop');
	
	//update
	
	jQuery(file_preview_name).attr('src',   URL.createObjectURL(event.blob) );
	const quantity = wcuf_multiple_files_queues[file_id][file_index].quantity;
	const file_name = wcuf_multiple_files_queues[file_id][file_index].name;
	const type = wcuf_multiple_files_queues[file_id][file_index].type;
	wcuf_multiple_files_queues[file_id][file_index] = event.blob;
	wcuf_multiple_files_queues[file_id][file_index].quantity = quantity;
	wcuf_multiple_files_queues[file_id][file_index].is_cropped = true;
	wcuf_multiple_files_queues[file_id][file_index].file_unique_id = file_unique_id; //Is needed?
	wcuf_multiple_files_queues[file_id][file_index].unique_id = file_unique_id; //unique id
	//in case of issue try decommenting: wcuf_multiple_files_queues[file_id][file_index].type = type;
	wcuf_multiple_files_mandatory_crop[file_id][file_index] = false; 
}
// *********** UI ***********
function wcuf_manage_crop_actions_ui(show)
{
	if(show)
	{
		jQuery("#wcuf_crop_container").css('opacity',"1");
		jQuery("#wcuf_crop_container").css('pointer-events',"all");
		jQuery("#wcuf_crop_container_actions").fadeIn();
		jQuery("#wcuf_crop_upload_image_for_rotating_status_box").fadeOut();
		
		//Progress bar 
		jQuery('#wcuf_crop_remote_processing_upload_bar').css('width', "0%");
	}
	else
	{
		jQuery("#wcuf_crop_container_actions").fadeOut();
		jQuery("#wcuf_crop_container").css('opacity',"0.5");
		jQuery("#wcuf_crop_container").css('pointer-events',"none");
		jQuery("#wcuf_crop_upload_image_for_rotating_status_box").fadeIn();
		
		//Progress bar 
		wcuf_ui_set_bar_background();
		jQuery('#wcuf_crop_remote_processing_upload_bar').css('width', "0%");
	}
}
//  Close functions
function wcuf_close_popup_dialog(event)
{
	event.preventDefault();
	event.stopImmediatePropagation();
	
	if(!wcuf_cropper_js)
		return;
	
	//Chrome issue: in case of single file, the input has to be reset. Otherwise, if selecting the same file, no popup is displayed (no "onchnage" is triggered)
	var id = wcuf_crop_event_to_propagate.file_id;
	var is_multiple = jQuery("#wcuf_upload_field_"+id).data('is-multiple-files');
	if(!is_multiple)
			jQuery("#wcuf_upload_field_"+id).val("");
	
	wcuf_cropper_popup.close();
	wcuf_on_cropper_popup_closed();
	
	return false;
}
function wcuf_on_cropper_popup_closed()
{
	//Ensure that controls are displayed (maybe the popup was previosly closed without resetting the controls)
	wcuf_manage_crop_actions_ui(true);
	var image_holder = document.getElementById("wcuf_image_to_crop");
	image_holder.src = "";
    wcuf_cropper_js.destroy();
}
// *********** Misc ***********
function wcuf_dataURItoBlob(dataURI) 
{
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}