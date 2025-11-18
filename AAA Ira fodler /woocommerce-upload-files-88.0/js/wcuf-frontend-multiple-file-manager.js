"use strict";
var wcuf_multiple_files_queues = new Array();
var wcuf_multiple_files_mandatory_crop = new Array();
var wcuf_images_to_preview = new Array();
var wcuf_canvas;
var wcuf_canvas_contex;
var wcuf_unique_id = 0;
var wcuf_rotation = {
  1: 'rotate(0deg)',
  3: 'rotate(180deg)',
  6: 'rotate(90deg)',
  8: 'rotate(270deg)'
};
jQuery(document).on('click', '.wcuf_delete_single_file_in_multiple_list', wcuf_delete_single_file_in_multiple_list);
jQuery(document).on('change', '.wcuf_quantity_per_file_input', wcuf_set_quantity_per_file);
jQuery(document).on('click', '.wcuf_just_selected_multiple_files_delete_button', wcuf_bulk_delete_just_selected_files);
jQuery(document).on('click', '.wcuf_upload_multiple_files_mirror_button', wcuf_manage_mirror_button);

function wcuf_manage_multiple_file_browse(evt)
{
	var id =  jQuery(evt.currentTarget).data('id'); 
	var disable_image_preview =  jQuery(evt.currentTarget).data('images-preview-disabled'); 
	var enable_crop =  jQuery(evt.currentTarget).data('enable-crop-editor') == "1"; 
	var detect_pdf =  jQuery(evt.currentTarget).data('detect-pdf'); 
	var disable_quantity_selector = jQuery(evt.currentTarget).data('disable-quantity-selector'); 
	var mandatory_crop =  jQuery(evt.currentTarget).data('crop-mandatory-for-multiple-uploads'); 
	var options = {'disable_image_preview':disable_image_preview, 'detect_pdf':detect_pdf, 'enable_crop':enable_crop, 'mandatory_crop': mandatory_crop, 'disable_quantity_selector': disable_quantity_selector};
	var files = evt.target.files;
	
	if(typeof wcuf_multiple_files_queues[id] === 'undefined')
		wcuf_multiple_files_queues[id] = new Array();
	
	if(typeof wcuf_multiple_files_mandatory_crop[id] === 'undefined')
		wcuf_multiple_files_mandatory_crop[id] = new Array();
	
	jQuery('button.button#wcuf_upload_multiple_files_button_'+id).css('display', 'inline-block');
	
	wcuf_canvas = document.createElement("canvas");
	wcuf_canvas_contex = wcuf_canvas.getContext("2d");
	
	for( var i = 0; i < files.length; i++)
	{
		files[i].quantity = 1;
		files[i].unique_id = wcuf_unique_id++;
		wcuf_multiple_files_queues[id].push(files[i]);
		wcuf_multiple_files_mandatory_crop[id].push(mandatory_crop);
		wcuf_append_new_file_ui(id,files[i], i, options);
	}
	wcuf_process_next_element_to_preview();//starts the process: ALTERNATIVE METHOD NOT USED
	jQuery( document.body ).trigger( 'wcuf_added_multiple_files' );
	
	//show bulk delete button 
	wcuf_display_just_selected_files_delete_button(true, id);
}
//the id is not relative to the file but to the upload field unique id
function wcuf_append_new_file_ui(id, file, file_index, options)
{
	var manage_pdf						 = options.detect_pdf && wcuf_is_pdf_file(file);
	var is_quantity_per_file_box_visible = !wcuf_enable_select_quantity_per_file || (manage_pdf) ? 'style="display:none"' : '';
	var mandatory_crop_class			 = options.mandatory_crop ? ' wcuf_mandatory_crop ' : '';
	var selector_template 				 = ""
	
	var template = '<div class="wcuf_single_file_in_multiple_list '+mandatory_crop_class+'" id="wcuf_single_file_in_multiple_list_'+file.unique_id+'">';
		template +=  '<div class="wcuf_single_file_name_container" >';
		template +=    '<span class="wcuf_single_file_name_in_multiple_list"><span class="wcuf_single_file_enumerator_'+id+'"></span> '+file.name+'</span>';
		template +=    '<i data-id="'+id+'" data-file-unique-id="'+file.unique_id+'" id="wcuf_delete_single_file_in_multiple_list_'+file.unique_id+'" class="wcuf_delete_single_file_in_multiple_list wcuf_delete_file_icon"></i>';
		template +=   '</div>';
		template +=   '<div class="wcuf_quantity_per_file_container" >';
		template +=     '<div class="wcuf_media_preview_container"><img width="100" class="wcuf_single_image_preview" id="wcuf_single_image_preview_'+file.unique_id+'"></img></div>';
		if(!options.disable_quantity_selector)
		{
			selector_template	+= '<span class="wcuf_quantity_per_file_label" '+is_quantity_per_file_box_visible+' >'+wcuf_quantity_per_file_label+'</span>';
			selector_template	+= '<input type="number" min="1" data-id="'+id+'" class="wcuf_quantity_per_file_input" value="1" '+is_quantity_per_file_box_visible+' ></input>';
		}
		else
			selector_template += '<input type="hidden" data-id="'+id+'" value="1"></input>';
		
		template += wcuf_globalHooks.applyFilters( 'wcuf_file_quantity_selector_rendering', selector_template, id, file_index, options.disable_quantity_selector, is_quantity_per_file_box_visible, wcuf_quantity_per_file_label );
		
		/* Filter */
		let custom_html = wcuf_globalHooks.applyFilters( 'wcuf_files_list_after_single_file_rendering', false, id, file_index );
		
		if(custom_html)
			template += custom_html;
		
		if(options.enable_crop && wcuf_is_image(file))
			template +=     '<button id="wcuf_single_crop_button_'+file.unique_id+'" class="button wcuf_single_crop_button" data-id="'+id+'" data-file-unique-id="'+file.unique_id+'">'+wcuf_single_crop_button_label+'</button>';
		template +=   '</div>';
	template += '</div>';
	
	var elem = jQuery('#wcuf_file_name_'+id).append(template);
	
	jQuery('#wcuf_file_name_'+id).fadeIn();
	if(options.disable_image_preview == false)
		wcuf_readURL(file, jQuery('.wcuf_media_preview_container').last());
	
	wcuf_update_file_single_file_enumerators(id)
}
function wcuf_update_file_single_file_enumerators(id)
{
	jQuery('.wcuf_single_file_enumerator_'+id).each(function(index, element)
	{
		jQuery(element).html((index+1)+". ")
	});
}
function wcuf_manage_mirror_button(event)
{
	event.preventDefault();
	var id = jQuery(event.currentTarget).data('id');
	jQuery("#wcuf_upload_multiple_files_button_"+id).trigger('click');
	return false;
}
function wcuf_display_just_selected_files_delete_button(show, id)
{
	if(show && !wcuf_auto_upload_for_multiple_files_upload_field)
		jQuery("#wcuf_multiple_files_actions_button_container_"+id).fadeIn();
	else 
		jQuery("#wcuf_multiple_files_actions_button_container_"+id).hide();
}
function wcuf_bulk_delete_just_selected_files(event)
{
	event.preventDefault();
	const id = jQuery(event.currentTarget).data('id');
	wcuf_display_just_selected_files_delete_button(false, id);
	//simulates the "x" click. In this way internal data structure is updated
	jQuery( "#wcuf_file_name_"+id+" .wcuf_delete_single_file_in_multiple_list").each(function(index, element)
	{
		jQuery(element).trigger('click');
	});
	
	return false;
}
function wcuf_is_pdf_file(file) 
{
	var allowed_fileTypes = ['pdf']; 
	var extension = file.name.split('.').pop().toLowerCase();
	return allowed_fileTypes.indexOf(extension) > -1;
}
function wcuf_is_image(file)
{
	var allowed_fileTypes = ['jpg', 'jpeg', 'png'/* , 'bmp' */];  
	 var extension = file.name.split('.').pop().toLowerCase(), 
         isSuccess = allowed_fileTypes.indexOf(extension) > -1 /* || file.type.match('audio.*') */;
	
	return isSuccess;
}
function wcuf_readURL(file, container) 
{
	var extension = file.name.split('.').pop().toLowerCase();
	var reader = new FileReader();
	var isSuccess = wcuf_is_image(file);
	
	if(!isSuccess)
	{
		container.html(wcuf_get_placehonder_according_file_type(extension));
		return;
	}
    wcuf_setImage(file,container);
	
}
function wcuf_setImage(file, container) 
{
    var URL = window.URL || window.webkitURL;
    if (URL.createObjectURL && (file.type == "image/jpeg" || file.type == "image/png" || file.type == "image/gif"  )) 
	{
		wcuf_get_orientated_file(file, function(base64img, value)
		{
			var rotated = jQuery('#wcuf_single_image_preview_'+file.unique_id).attr('src',   base64img );
			if(value) 
			  rotated.css('transform', wcuf_rotation[value]);
		});	
			
		
    } 
	else 
	{
       jQuery('#wcuf_single_image_preview_'+file.unique_id).remove();
    }
}
function wcuf_downscaleImageAndSetPreview(previewContainer, file_data, newWidth, imageType, imageArguments) 
{
    
	wcuf_images_to_preview.push({'file_data': file_data, 'image': "", 'meta': "", 'imageType': imageType, 'imageArguments': imageArguments, 'previewContainer':previewContainer, 'newWidth': newWidth});
}
//started after all files have been processed (see the init method)
function wcuf_process_next_element_to_preview()
{
	if(wcuf_images_to_preview.length == 0)
		return;
	
	var elem = wcuf_images_to_preview.shift();
	
	
	  loadImage(
			elem.file_data,
			function(img, meta)
			{
				elem.image = img;
				elem.meta = meta;
				wcuf_process_elements_to_preview(elem);				
			},
			{
				meta:true,
				orientation: true
			}
		);  
}
function wcuf_process_elements_to_preview(elem)
{
	var image = elem.image;
	var imageType = elem.imageType || "image/jpeg";
    var imageArguments = elem.imageArguments || 0.7;
	 
	var oldWidth, oldHeight, newHeight, ctx, newDataUrl;
	oldWidth = image.width;
	oldHeight = image.height;
	newHeight = Math.floor(oldHeight / oldWidth *  elem.newWidth);
	if(image.height > image.width)
	{
		newHeight = elem.newWidth; 
		elem.newWidth = Math.floor(oldHeight / oldWidth *  elem.newWidth);
	}
	
	wcuf_canvas = document.createElement("canvas");
	wcuf_canvas_contex = wcuf_canvas.getContext("2d"); 
	
	// Create a temporary canvas to draw the downscaled image on.
    wcuf_canvas.width = elem.newWidth;
	wcuf_canvas.height = newHeight;

	// Draw the downscaled image on the canvas and return the new data URL.
	
	wcuf_canvas_contex.clearRect(0, 0, elem.newWidth, newHeight);
	wcuf_canvas_contex.drawImage(image, 0, 0, elem.newWidth, newHeight);
	newDataUrl = wcuf_canvas.toDataURL(imageType, imageArguments);
	
	elem.previewContainer.attr('src',  newDataUrl) ;
	setTimeout(wcuf_process_next_element_to_preview, 500);
	
	
}
function wcuf_get_field_index(elem)
{
	return elem.parent().parent().index(); 
}
function wcuf_delete_single_file_in_multiple_list(evt)
{
	//Files have not an unique id. To remove the html list index is found and then is used to splice the array
	var id =  jQuery(evt.currentTarget).data('id'); 
	var file_unique_id =  jQuery(evt.currentTarget).data('file-unique-id'); 
	var index =  wcuf_get_field_index(jQuery(evt.currentTarget)); 
	jQuery('#wcuf_single_file_in_multiple_list_'+file_unique_id).remove();
	jQuery("#btnCancelCrop_"+id).trigger('click'); //To close the eventual cropper editor opened;
	
	let file_index = -1;
	for(let i = 0; i < wcuf_multiple_files_queues[id].length; i++)
		if( wcuf_multiple_files_queues[id][i].unique_id == file_unique_id)
			file_index = i;
	
	if(file_index > -1)
	{
		wcuf_multiple_files_queues[id].splice(file_index, 1);
		wcuf_multiple_files_mandatory_crop[id].splice(file_index, 1);
		jQuery( document.body ).trigger( 'wcuf_deleted_file_in_multiple_selection' );
	}
	
	wcuf_update_file_single_file_enumerators(id);
	if(wcuf_multiple_files_queues[id].length < 1)
	{
		jQuery("#wcuf_upload_field_"+id).val(""); //On Chrome if the input field is not cleared, it doesn't allow the file selection 
		jQuery('button.button#wcuf_upload_multiple_files_button_'+id).fadeOut();
		wcuf_display_just_selected_files_delete_button(false, id);
		jQuery('#wcuf_file_name_'+id).fadeOut(400);
	}
}
function wcuf_set_quantity_per_file(evt)
{
	var index =  wcuf_get_field_index(jQuery(evt.currentTarget)); 
	var value = jQuery(evt.currentTarget).val();
	var id = jQuery(evt.currentTarget).data('id'); 
	
	value = value < 1 ? 1 : value;
	jQuery(evt.currentTarget).val(value);
	wcuf_multiple_files_queues[id][index].quantity = value;
}
function wcuf_get_placehonder_according_file_type(extension)
{
	var preview_name = "generic.png";
	switch(extension)
	{
		case "avi":
		case "mpeg":
		case "mpg":
		case "divx":
		case "xvid":
		case "mp4":
		case "mov":
		case "webm":
		case "mka": preview_name = "video.png"; break;
		case "flac":
		case "mp3":
		case "wav":
		case "m4a": preview_name = "audio.png"; break;
		case "bmp":
		case "tiff":
		case "exif":
		case "jpeg":
		case "gif": preview_name = "image.png"; break;
		case "doc":
		case "docx": preview_name = "doc.png"; break;
		case "xls":
		case "sxls": preview_name = "excel.png"; break;
		case "zip":
		case "rar":
		case "tar":
		case "gz":
		case "zip": preview_name = "zip.png"; break;
		case "pdf": preview_name = "pdf.png"; break;
		
	}
	return '<img class="wcuf_single_image_preview" src="'+wcuf_options.icon_path+preview_name+'" />';
}
function wcuf_get_orientated_file(file, callback) 
{
  var fileReader = new FileReader();
  fileReader.onloadend = function() {
    var base64img = "data:"+file.type+";base64," + wcuf_arrayBufferToBase64(fileReader.result);
    var scanner = new DataView(fileReader.result);
    var idx = 0;
    var value = 1; // Non-rotated is the default
    if(fileReader.result.length < 2 || scanner.getUint16(idx) != 0xFFD8) {
      // Not a JPEG
      if(callback) {
        callback(base64img, value);
      }
      return;
    }
    idx += 2;
    var maxBytes = scanner.byteLength;
    while(idx < maxBytes - 2) {
      var uint16 = scanner.getUint16(idx);
      idx += 2;
      switch(uint16) {
        case 0xFFE1: // Start of EXIF
          var exifLength = scanner.getUint16(idx);
          maxBytes = exifLength - idx;
          idx += 2;
          break;
        case 0x0112: // Orientation tag
          // Read the value, its 6 bytes further out
          // See page 102 at the following URL
          // http://www.kodak.com/global/plugins/acrobat/en/service/digCam/exifStandard2.pdf
          value = scanner.getUint16(idx + 6, false);
          maxBytes = 0; // Stop scanning
          break;
      }
    }
    if(callback) {
      callback(base64img, value);
    }
  }
  fileReader.readAsArrayBuffer(file);
};
function wcuf_arrayBufferToBase64( buffer ) {
  var binary = ''
  var bytes = new Uint8Array( buffer )
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode( bytes[ i ] )
  }
  return window.btoa( binary );
}
