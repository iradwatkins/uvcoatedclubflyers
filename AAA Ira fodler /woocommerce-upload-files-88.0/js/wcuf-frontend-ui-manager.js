"use strict";
function wcuf_ui_on_delete_file(id, options)
{
	var result 						= wcuf_ui_get_deleted_file_metadata(id);
	var ajax_container_unique_id 	= result.container_unique_id;
	var already_invoked 			= false;
	var do_file_smooth_scroll 		= wp.hooks.applyFilters('wcuf_ui_delete_file_smooth_scroll', true);
	
	wcuf_ui_hide_control_buttons();
	
	//Smooth scroll
	if(do_file_smooth_scroll)
	{
		try{
			jQuery('html, body').animate({
				  scrollTop: jQuery("#wcuf_"+wcuf_current_page+"_ajax_container_"+ajax_container_unique_id).offset().top - 200
				}, {
					duration: 500,
					complete: function()
					{
						if(already_invoked)
							return;
						
						wcuf_ui_on_delete_file_animation(ajax_container_unique_id, options); 
						already_invoked = true;
					}});
		}catch(error){console.log(error);} 
	}
	else
	{
		wcuf_ui_on_delete_file_animation(ajax_container_unique_id, options);	
	}		
	
}
function wcuf_ui_update_time_out_text(upload_field_id, current_attempt, number_of_retries)
{
	var msg = wcuf_upload_attempt.replace("%s", current_attempt);
	msg =  msg.replace("%s", number_of_retries);
	jQuery('#wcuf_status_'+upload_field_id).html(unescape(msg));
}
function wcuf_ui_on_delete_file_animation(ajax_container_unique_id, options)
{
	var ajax_container_ids = wcuf_ui_get_ajax_container_ids(ajax_container_unique_id);
	jQuery(ajax_container_ids.ajax_loader_container).html("<h4>"+unescape(wcuf_deleting_msg)+"</h4>");
	wcuf_ui_on_delete_file
	
	if(options.is_temp == "yes")
		return;
	
	var event = new Event('wcuf_ui_on_delete_complete');
	event.options = options;
	document.dispatchEvent(event);
}
function wcuf_ui_manage_timeout_message(show, id)
{
	if(show)
		jQuery('#wcuf_reload_due_to_errors_area_'+id).fadeIn();
	else 
		jQuery('#wcuf_reload_due_to_errors_area_'+id).fadeOut();
		
}
function wcuf_ui_show_popup_alert(text)
{
	jQuery('#wcuf_alert_popup').css({'display':'block'});
	jQuery('#wcuf_alert_popup_content').html(text);
	jQuery('#wcuf_show_popup_button').trigger('click');
}
function wcuf_ui_get_ajax_container_ids(ajax_container_unique_id)
{
	var ajax_loader_container = ajax_container_unique_id == "none" ? '.wcuf_'+wcuf_current_page+'_ajax_container_loading_container' : '#wcuf_'+wcuf_current_page+'_ajax_container_loading_container_'+ajax_container_unique_id;
	var ajax_container = ajax_container_unique_id == "none" ? '.wcuf_'+wcuf_current_page+'_ajax_container' : '#wcuf_'+wcuf_current_page+'_ajax_container_'+ajax_container_unique_id;
	
	return {'ajax_loader_container': ajax_loader_container, 'ajax_container' : ajax_container};
}
function wcuf_ui_get_deleted_file_metadata(id)
{
	var current_elem = jQuery('#wcuf_delete_metadata_'+id);
	return {'container_unique_id': current_elem.data('container-unique-id'), "cart_item_id": current_elem.data('cart-item-id')}; 
}

function wcuf_ui_after_delete(id) //No longer used by product/cart/checkout page. ONLY USED BY ODER DETAILS PAGE
{  
	var event = new Event('onSingleFileDeleComplete');
	document.dispatchEvent(event);
	wcuf_is_deleting = false;
	
	if(/* wcuf_current_page != "cart" && */ wcuf_current_page != "order_details" && wcuf_current_page != "thank_you")
	{
		//setTimeout(function(){wcuf_ajax_reload_upload_fields_container(result) }, 1500); 
		wcuf_ajax_reload_upload_fields_container(result);
		
	}
	 else
		wcuf_ui_reload_page_with_anchor();
}
function wcuf_ui_reload_page(time)
{
	wcuf_is_force_reloading = true;
	setTimeout(function(){ window.location.reload(true);   ;  }, time); 
}
function wcuf_ui_reload_page_with_anchor()
{
	var url = window.location.href;
	if(!wcuf_ui_reload_param_exists())
		url += url.indexOf('?') > -1 ? '&wcuf_pagereload=1' : '?wcuf_pagereload=1';
	window.location.href = url;
}
function wcuf_ui_jump_to_upload_area_by_url_param() //Triggered after reloading the order details page
{
	var params = wcuf_ui_getUrlVars();
	if(params["wcuf_id"] !== undefined)
	{		
		const id = params["wcuf_id"].replace('/','');
		jQuery('html, body').animate({
			scrollTop: jQuery('#wcuf_upload_field_container_'+id).offset().top - 100
		}, 1000);
	}
}
function wcuf_ui_smooth_scroll_to_upload_area()
{
	if(wcuf_ui_reload_param_exists())
	{
		jQuery('html, body').animate({
			  scrollTop: jQuery('.wcuf_file_uploads_container').offset().top - 100
			}, 1000); 
	}
	else 
		wcuf_ui_jump_to_upload_area_by_url_param();
}
function wcuf_ui_getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function wcuf_ui_reload_param_exists()
{
	var url_string = window.location.href;
	var url = new URL(url_string);
	var param = url.searchParams.get("wcuf_pagereload");
	
	return param != null;
}
function wcuf_ui_hide_add_to_cart_button_in_case_of_required_upload(fadeInTime, fadeOutTime)
{
	
	if(wcuf_current_page != 'product' )
		return;
	
	if(!wcuf_exist_a_field_before_add_to_cart || (wcuf_all_required_uploads_have_been_performed(true) && wcuf_check_multiple_upload_status(null)))
	{
		wcuf_ui_show_hide_add_to_cart_area(true, true, fadeInTime, fadeOutTime)
	}
	else
	{
		wcuf_ui_show_hide_add_to_cart_area(false, true, fadeInTime, fadeOutTime)
	}
	
}
function wcuf_ui_show_hide_add_to_cart_area(show, manageRequiredMessage, fadeInTime, fadeOutTime)
{
	if(show)
	{
		//hide
		if(wcuf_options.hide_add_to_cart_button == 'yes')
		{
			jQuery('.single_add_to_cart_button, div.paypal-button, form.cart .add_to_cart_button, .wc_quick_buy_button, .quantity, button.add-to-cart ').css('display', 'inline-block');
			jQuery('.single_add_to_cart_button, div.paypal-button, form.cart .add_to_cart_button, .wc_quick_buy_button, .quantity, button.add-to-cart').animate({opacity: 1}, 100); 
		}
		else 
		{
			//New method: the controllers are disabled:
			jQuery('.single_add_to_cart_button, div.paypal-button, form.cart .add_to_cart_button, .wc_quick_buy_button, .qty, button.add-to-cart ').removeAttr("disabled");
			jQuery('.single_add_to_cart_button, div.paypal-button, form.cart .add_to_cart_button, .wc_quick_buy_button, .qty, button.add-to-cart').fadeIn();
		}
		if(manageRequiredMessage)
			jQuery('.wcuf_required_upload_add_to_cart_warning_message').fadeOut(fadeOutTime); //400
		
		//hide qty selector (in case the product quantity has been setted to be equal to number of uploaded files)
		if(wcuf_options.cart_quantity_as_number_of_uploaded_files == 'true' && jQuery('.wcuf_upload_fields_row_element').length > 0)
			jQuery('div.quantity, .quantity input.qty, #qty').hide();
	}
	else 
	{
		if(wcuf_options.hide_add_to_cart_button == 'yes')
		{
			//hide
			jQuery('.single_add_to_cart_button, div.paypal-button, form.cart .add_to_cart_button, .wc_quick_buy_button, .quantity, button.add-to-cart').animate({opacity: 0}, 200,
			function()
			{
				jQuery('.single_add_to_cart_button, div.paypal-button, form.cart .add_to_cart_button, .wc_quick_buy_button, .quantity, button.add-to-cart').css('display', 'none');
			}); 
		}
		else 
			jQuery('.single_add_to_cart_button, div.paypal-button, form.cart .add_to_cart_button, .wc_quick_buy_button, .qty, button.add-to-cart').attr("disabled", true);
		
		if(manageRequiredMessage)
			jQuery('.wcuf_required_upload_add_to_cart_warning_message').fadeIn(fadeInTime); //600
	}
}
function wcuf_ui_show_upload_field_area()
{
	jQuery('.wcuf_'+wcuf_current_page+'_ajax_container').css('display', 'block');
	jQuery('.wcuf_'+wcuf_current_page+'_ajax_container').animate({opacity: 1}, 200);
}
function wcuf_ui_set_bar_background()
{
	jQuery('.wcuf_bar').css('background-color',wcuf_progressbar_color);
}
function wcuf_ui_reset_loading_ui(id)
{
	wcuf_ui_set_bar_background();
	//jQuery('#wcuf_file_name_'+id).html("");											 //Is the box containint the preview
	//jQuery('.wcuf_file_name, wcuf_multiple_file_progress_container_'+id).fadeOut(0); //Is the box containint the preview 
	jQuery('#wcuf_bar_'+id+", #wcuf_multiple_file_bar_"+id).css('width', "0%");
	
	wcuf_ui_hide_control_buttons();
	
	jQuery('#wcuf_upload_status_box_'+id).show(400,function()
	{
		//Smooth scroll
		try{
			/* jQuery('html, body').animate({
				  scrollTop: jQuery('#wcuf_upload_status_box_'+id).offset().top - 200 //#wcmca_address_form_container ?
				}, 500); */
		}catch(error){}
	});
	jQuery('#wcuf_delete_button_box_'+id).empty();
	jQuery('#wcuf_status_'+id).html(unescape(wcuf_loading_msg));
}
function wcuf_ui_show_control_buttons()
{
	jQuery('.wcuf_to_hide_when_performing_data_transimssion').removeClass('wcuf_opacityblur');
}
function wcuf_ui_hide_control_buttons()
{
	jQuery('.wcuf_to_hide_when_performing_data_transimssion').addClass('wcuf_opacityblur');
	
}
function wcuf_ui_order_page_upload_completed(id)
{
	jQuery('#wcuf_file_name_'+id).delay(320).fadeIn(300,function() //Is the box containint the preview
	{
		//Smooth scroll
		/*try{
			 jQuery('html, body').animate({
				  scrollTop: jQuery('#wcuf_file_name_'+id).offset().top - 200 //#wcmca_address_form_container ?
				}, 500); 
		}catch(error){}*/
	}); 
	jQuery('#wcuf_upload_status_box_'+id).delay(300).hide(500);
}
function wcuf_ui_order_before_uploading()
{
	jQuery('#wcuf_upload_button').fadeOut(200);	
	jQuery('.wcuf_file_uploads_container').fadeOut(200);
	jQuery('#wcuf_progress').delay(250).fadeIn();
	try{
			/* jQuery('html, body').animate({
				  scrollTop: jQuery('.wcuf_file_uploads_container').offset().top - 200 
				}, 500); */
		}catch(error){}
}
function wcuf_ui_order_page_reset_loading_ui(id)
{
	wcuf_ui_set_bar_background();
	/* jQuery('#wcuf_file_name_'+id).html("");											//Is the box containint the preview
	jQuery('.wcuf_file_name, wcuf_multiple_file_progress_container_'+id).fadeOut(0);	 */
	jQuery('#wcuf_bar_'+id+"#wcuf_multiple_file_bar_"+id).css('width', "0%");
	
	wcuf_ui_order_page_hide_control_buttons();	
	jQuery("#wcuf_crop_container_"+id).addClass("wcuf_already_uploaded");
	jQuery("#wcuf_upload_field_button_"+id).addClass("wcuf_already_uploaded");
	jQuery("#wcuf_upload_multiple_files_button_"+id).addClass("wcuf_already_uploaded");
	jQuery("#wcuf_file_name"+id).addClass("wcuf_already_uploaded");
	jQuery("#wcuf_disclaimer_label_"+id).addClass("wcuf_already_uploaded");
	
	jQuery("#wcuf_max_size_notice_"+id).addClass("wcuf_already_uploaded");
	jQuery('#wcuf_upload_status_box_'+id).show(400,function()
	{
		jQuery('#wcuf_abort_upload_'+id).show(); //If aborted, the button was hidden
		//Smooth scroll
		try{
			/* jQuery('html, body').animate({
				  scrollTop: jQuery('#wcuf_upload_status_box_'+id).offset().top - 200 //#wcmca_address_form_container ?
				}, 500); */
		}catch(error){}
	});
	jQuery('#wcuf_delete_button_box_'+id).empty();
	jQuery('#wcuf_status_'+id).html(unescape(wcuf_loading_msg));
	
}
function wcuf_ui_order_page_hide_control_buttons()
{
	jQuery('.wcuf_to_hide_when_performing_data_transimssion').addClass('wcuf_opacityblur');
	
	//jQuery('#wcuf_upload_button').fadeOut(0)
	//jQuery('.wcuf_crop_container, .wcuf_multiple_files_actions_button_container, .wcuf_disclaimer_label, .wcuf_upload_field_button, .wcuf_upload_multiple_files_button, .wcuf_max_size_notice, .delete_button, .wcuf_feedback_textarea, .wcuf_delete_single_file_stored_on_server').fadeOut(300);
}
function wcuf_ui_order_page_show_control_buttons(id)
{
	jQuery('.wcuf_to_hide_when_performing_data_transimssion').removeClass('wcuf_opacityblur');
	
	/* var current_elem = jQuery('#wcuf_upload_field_'+id);
	var is_multiple = jQuery(current_elem).data('is-multiple-files');
	
	if(is_multiple)
		jQuery('.wcuf_multiple_files_actions_button_container').fadeIn(200);
	
	jQuery('#wcuf_upload_button').fadeIn(200);
	jQuery('.wcuf_multiple_files_actions_button_container, .wcuf_crop_container:not(".wcuf_already_uploaded"):not(".wcuf_not_to_be_showed"), .wcuf_disclaimer_label:not(".wcuf_already_uploaded"), .wcuf_upload_field_button:not(".wcuf_already_uploaded"), .wcuf_max_size_notice:not(".wcuf_already_uploaded"), .wcuf_feedback_textarea:not(".wcuf_already_uploaded"), .delete_button, .wcuf_delete_single_file_stored_on_server').fadeIn(500);
	jQuery('.wcuf_file_name:not(".wcuf_already_uploaded")').each(function(index, obj)
	{
		if(jQuery(obj).children().length > 0)
			jQuery(obj).fadeIn(500);
	});
	check_which_multiple_files_upload_button_show(); */
}