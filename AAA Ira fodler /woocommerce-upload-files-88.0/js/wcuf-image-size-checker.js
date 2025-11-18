"use strict";
var wcuf_current_multiple_file_checked = 0;
var wcuf_imgldd_error;
function wcuf_check_image_file_width_and_height(files, evt, current_elem, callback, max_image_width, max_image_height,min_image_width, min_image_height, min_image_dpi ,max_image_dpi,dimensions_logical_operator)
{
	var wcuf_imgldd_current_file_loaded = 0;
    wcuf_imgldd_error = false;
	wcuf_current_multiple_file_checked = 0;
	var sizes_obj = {'max_image_width': max_image_width, 
					 'max_image_height':max_image_height, 
					 'min_image_height':min_image_height, 
					 'min_image_width': min_image_width, 
					 'min_dpi': min_image_dpi, 
					 'max_dpi': max_image_dpi,
					 'ratio_x' : current_elem.data("ratio-x"),
					 'ratio_y' : current_elem.data("ratio-y"),
					 'dimensions_logical_operator': dimensions_logical_operator,
					 'images_to_remove': [],
					 'bad_encoded_images' : []
					 };
			
	wcuf_check_next_single_file(0);
	
	function wcuf_check_next_single_file(i)
	{
		if(i < files.length)
			var loadingImage = loadImage(
				files[i],
				function(img, meta)
						{
						wcuf_image_loaded(img, meta, files, wcuf_current_multiple_file_checked, evt, callback, sizes_obj); 
						wcuf_check_next_single_file(++wcuf_current_multiple_file_checked);
						},
				{
					meta:true
				}
			);
	}

	function wcuf_floor_at(number, decimals)
	{
		const number_of_decimals = 10 * decimals;
		return Math.floor(number * number_of_decimals) / number_of_decimals;
	}
	function wcuf_image_loaded(img, metadata, files, file_index, evt, callback, sizes_obj) 
	{
		var file_unique_id = files[file_index].unique_id;
		var file_name = files[file_index].name;
		var already_added = false;
		
		if(img.type === "error") 
		{
			
			wcuf_imgldd_current_file_loaded++;		
			if(sizes_obj.min_image_width != 0 || sizes_obj.min_image_height != 0 || sizes_obj.max_image_height != 0 || sizes_obj.max_image_width != 0 || sizes_obj.min_dpi != 0 || sizes_obj.max_dpi != 0 ||
			   sizes_obj.ratio_x != 0 || sizes_obj.ratio_y
			)
			{
				wcuf_imgldd_error = true;
				sizes_obj.bad_encoded_images.push({unique_id:file_unique_id, name:file_name});
			}
			if(wcuf_imgldd_current_file_loaded == files.length )
			{
				callback(evt,wcuf_imgldd_error,this, sizes_obj);
			}
		} 
		else 
		{
			
			wcuf_imgldd_current_file_loaded++;
			if(!files[file_index].hasOwnProperty('is_cropped'))
			{
				
				//ratio
				if(sizes_obj.ratio_x != 0 && sizes_obj.ratio_y != 0 && (wcuf_floor_at(sizes_obj.ratio_x/sizes_obj.ratio_y,2) != wcuf_floor_at(img.width/img.height,2)))
				{
					wcuf_imgldd_error = true;
				}
				
				//dpi
				if( (sizes_obj.min_dpi != 0 || sizes_obj.max_dpi != 0) && !wcuf_check_image_dpi(metadata, callback, evt, sizes_obj))
				{
					wcuf_imgldd_error = true;
					if(!already_added)
					{
						already_added = true;
						sizes_obj.images_to_remove.push({unique_id:file_unique_id, name:file_name});
					}
					/* callback(evt, wcuf_imgldd_error, this, sizes_obj);
					return false; */
				}
				
				
				if(sizes_obj.dimensions_logical_operator == 'or')
				{	
					if( ((sizes_obj.max_image_width != 0 && img.width > sizes_obj.max_image_width) || (sizes_obj.min_image_width != 0 && img.width < min_image_width)) &&
						   ( (sizes_obj.max_image_height != 0 && img.height > sizes_obj.max_image_height) || (sizes_obj.min_image_height != 0 && img.height < min_image_height)) )
						   {
							   wcuf_imgldd_error = true;
							   if(!already_added)
								{
									already_added = true;
									sizes_obj.images_to_remove.push({unique_id:file_unique_id, name:file_name});
								}
						   }					   
						
				}
				else //original in AND
					if( ((sizes_obj.max_image_width != 0 && img.width > sizes_obj.max_image_width) || (sizes_obj.min_image_width != 0 && img.width < min_image_width)) ||
						   ( (sizes_obj.max_image_height != 0 && img.height > sizes_obj.max_image_height) || (sizes_obj.min_image_height != 0 && img.height < min_image_height)) )
						   {
							   wcuf_imgldd_error = true;
							   if(!already_added)
								{
									already_added = true;
									sizes_obj.images_to_remove.push({unique_id:file_unique_id, name:file_name});
								}
						   }	
			}
			if( wcuf_imgldd_current_file_loaded == files.length)
			{
				callback(evt,wcuf_imgldd_error, this, sizes_obj);
			}
		}
	}
	function wcuf_check_image_dpi(metadata, callback, evt, sizes_obj) 
	{
		if (!metadata.exif) 
		{ 
			return false;
		}
		
		var resX = metadata.exif.get('XResolution');
		var resY = metadata.exif.get('YResolution');
		var resUnit = metadata.exif.get('ResolutionUnit'); //2: inch
		
		if(
		    (resX != resY || resUnit != 2 || (resX < sizes_obj.min_dpi && sizes_obj.min_dpi > 0) || (resX > sizes_obj.max_dpi && sizes_obj.max_dpi > 0))
		   )
		{
			return false;
		}
		return true;
	}
}