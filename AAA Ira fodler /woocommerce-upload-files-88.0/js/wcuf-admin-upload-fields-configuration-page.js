"use strict";
var wcuf_free_field_id = 0;
jQuery(document).ready(function()
{ 
	
	jQuery(document).on('click', '.wcuf_collapse_options', wcuf_onCollassableButtonClick);
	jQuery(document).on('click','.wcuf_display_on_product_checkbox', wcuf_onDisplayOnProductCheckboxClick);
	jQuery(document).on('change','.wcuf_time_visibility_selection', wcuf_on_time_visibility_selection);
	jQuery(document).on('click','.duplicate_field', wcuf_duplicate_field);
	jQuery(document).on('click','.master_option', wcuf_manage_master_option);
	jQuery(document).on('click','.wcuf_fee_item_price_checkbox', wcuf_on_fee_item_price_checkbox);
	jQuery(document).on('click','.wcuf-restore-checkout-template-button', wcuf_restore_checkout_template);
	jQuery(document).on('click','.wcuf-restore-cart-template-button', wcuf_restore_cart_template);
	
	wcuf_init();
	
	try
	{
		if(jQuery(".wcuf_sortable").length > 0)
			 jQuery(".wcuf_sortable").sortable({
				containment: "parent",
				handle: ".wcuf_sort_button",
				 cancel: '',
				placeholder: "ui-state-highlight",
				
			});
	}catch(error){jQuery('.wcuf_sort_button').hide();}
	wcuf_checkMultipleUpoloadsCheckbox();	
});
function wcuf_init()
{
	wcuf_manage_master_option(null);
	
	//var max_fields      = 999999; //maximum input boxes allowed
	var wrapper         = jQuery(".input_fields_wrap"); //Fields wrapper
	var add_button      = jQuery(".add_field_button"); //Add button ID
	wcuf_free_field_id = parseInt(wcuf.last_id); //initlal text box count
	var confirm_delete_message = wcuf.confirm_delete_message;
	
	jQuery(document).on('change', ".upload_type", setSelectBoxVisibility);
	jQuery(".upload_type").trigger('change');
	jQuery(".wcuf_time_visibility_selection").trigger('change');
	
	
	function setSelectBoxVisibility(event)
	{
		if(jQuery(event.target).val() != 'always')
		   {
			   jQuery("#upload_categories_box"+jQuery(event.target).data('id')).show();
		   }
		   else
			  jQuery("#upload_categories_box"+jQuery(event.target).data('id')).hide();
	}
	//Should be reorganized
	jQuery(add_button).click(function(e)
	{ 
		//on add input button click
		e.preventDefault();
		e.stopImmediatePropagation();
		
		{
			wcuf_getHtmlTemplate(wcuf_free_field_id);
		}
		jQuery(document).on('change',".upload_type", setSelectBoxVisibility);
		jQuery(document).on('change','.wcuf_collapse_options', wcuf_onCollassableButtonClick);
		
		return false;
	});
	//
   
	jQuery(wrapper).on("click",".remove_field", function(e)
	{ //user click on remove text
		e.preventDefault();
		
		if(!confirm(confirm_delete_message))
			return false;
		
		var id = jQuery(e.currentTarget).data('id');
		
		//smooth scroll
		 jQuery('html, body').animate({
			scrollTop: jQuery("#input_box_"+id).offset().top-100
		}, 500);

		jQuery("#input_box_"+id).delay(500).fadeOut(500, function()
		{
			jQuery(this).remove(); 
		
		}); 
		
	});
}
function wcuf_restore_checkout_template(event)
{
	event.preventDefault();
	wcuf_restore_template("checkout");
	return false;
}
function wcuf_restore_cart_template(event)
{
	event.preventDefault();
	wcuf_restore_template("cart");
	return false;
}
function wcuf_restore_template(type)
{
	//UI 
	jQuery(".wcuf-restore-"+type+"-template-notice").fadeOut();
	jQuery(".wcuf-restore-"+type+"-loading").fadeIn();
	jQuery(".wcuf-restore-"+type+"-loading").html(wcuf.loading_text);
	
	var formData = new FormData();
	formData.append('action', 'wcuf_restore_template');	
	formData.append('type', type); 			
	formData.append('security', wcuf.security); 			
	jQuery.ajax({
			url: ajaxurl,
			type: 'POST',
			data: formData,
			async: true,
			contentType: "application/json; charset=utf-8", 
			dataType: "json", 
			success: function (data) 
			{
				//UI
				jQuery(".wcuf-restore-"+type+"-loading").html(data.message);
			},
			error: function (data) 
			{
				console.log("Error");
				console.log(data);
				//alert("Error: "+data);
			},
			cache: false,
			contentType: false,
			processData: false
		}); 
}
function wcuf_manage_master_option(event)
{
	const transition_time = event == null ? 0 : 300;
	jQuery('.master_option').each(function(index, elem)
	{
		if(jQuery(elem).is(':checkbox'))
		{
			let hide_process_result = elem.checked ? jQuery("#master_related_"+jQuery(elem).data('related-id')).fadeIn(transition_time) : jQuery("#master_related_"+jQuery(elem).data('related-id')).fadeOut(transition_time);
			hide_process_result = elem.checked ? jQuery(".master_related_"+jQuery(elem).data('related-id')).fadeIn(transition_time) : jQuery(".master_related_"+jQuery(elem).data('related-id')).fadeOut(transition_time);
		}
	});
}
function wcuf_on_fee_item_price_checkbox(event)
{
	var id_to_unckeck = jQuery(event.currentTarget).data('id-to-uncheck');
	const ids = id_to_unckeck.split(",");
	for(var i = 0; i<ids.length;i++)
		jQuery("#"+ids[i]).prop("checked", false);
}
function wcuf_on_start_field_sorting( event, ui ) 
{
	
}
function wcuf_uploaded_field_sorted( event, ui ) 
{
	
}
function wcuf_onCollassableButtonClick(event)
{
	event.preventDefault();
	event.stopImmediatePropagation();
	var id = jQuery(event.currentTarget).data('id');
	jQuery('#wcuf_collapsable_box_'+id).toggleClass('wcuf_box_hidden');
	
	return false;
}
function wcuf_checkMultipleUpoloadsCheckbox()
{
	jQuery('.wcuf_display_on_product_checkbox').each(function(index,value)
	{
		var id = jQuery(this).data('id');
		wcuf_setMultipleUploadCheckbox(id, this);
	});
}
function wcuf_onDisplayOnProductCheckboxClick(event)
{
	var id = jQuery(event.target).data('id');
	wcuf_checkMultipleUpoloadsCheckbox();
	
}
function wcuf_on_time_visibility_selection(event)
{
	var id = jQuery(event.target).data('id');
	switch(event.currentTarget.value)
	{
		case "disabled": jQuery('#wcuf_amount_of_time_selector_'+id+','+'#wcuf_specific_date_selector_'+id).fadeOut(0); break;
		case "specific_date": jQuery('#wcuf_amount_of_time_selector_'+id).fadeOut(0); jQuery('#wcuf_specific_date_selector_'+id).fadeIn(); break;
		case "amount_of_time": jQuery('#wcuf_specific_date_selector_'+id).fadeOut(0); jQuery('#wcuf_amount_of_time_selector_'+id).fadeIn();break;
	}
}
function wcuf_setMultipleUploadCheckbox(id, elem)
{
	if(jQuery(elem).prop('checked'))
	{
		//If the Product page visibility is set to on, the upload field must be associated for each product
		jQuery('#wcuf_multiple_uploads_checkbox_'+id).attr('disabled', true);
		jQuery('#wcuf_multiple_uploads_checkbox_'+id).prop('checked',true);
		
		jQuery('#wcuf_display_on_product_before_adding_to_cart_'+id).removeAttr('disabled');
		jQuery('#wcuf_display_on_product_before_adding_to_cart_container_'+id).fadeIn();
	}
	else
	{
		//If the Product page visibility is set to off, there is no need to force its association for each product
		jQuery('#wcuf_multiple_uploads_checkbox_'+id).removeAttr('disabled');
		
		jQuery('#wcuf_display_on_product_before_adding_to_cart_'+id).attr('disabled',true);
		jQuery('#wcuf_display_on_product_before_adding_to_cart_'+id).prop('checked',false);
		jQuery('#wcuf_display_on_product_before_adding_to_cart_container_'+id).fadeOut();
	}
}
function wcuf_beforeLoadingTemplate()
{
	jQuery('.add_field_button').hide(0);
	jQuery('.wcuf_preloader_image').show();
}
function wcuf_afterLoadingTemplate()
{
	jQuery('.wcuf_preloader_image').hide(0);
	jQuery('.add_field_button').show();
}
function wcuf_getHtmlTemplate(index)
{
	
	var random = Math.floor((Math.random() * 1000000) + 999);
	var formData = new FormData();
	formData.append('action', 'wcuf_get_upload_field_configurator_template'); 
	formData.append('start_index', index); 

	//UI
	wcuf_activate_new_category_select_box("#upload_type_id"+wcuf_free_field_id);
	wcuf_activate_new_product_select_box("#product_select_box"+wcuf_free_field_id);
	wcuf_beforeLoadingTemplate();

	wcuf_free_field_id++; 
			
	jQuery.ajax({
		url: ajaxurl+"?nocache="+random,
		type: 'POST',
		data: formData,
		dataType : "html",
		contentType: "application/json; charset=utf-8", 
		async: true,
		success: function (data) 
		{
			//UI	
			wcuf_afterLoadingTemplate();
			jQuery(".input_fields_wrap").append(data);	

			wcuf_activate_new_category_select_box(".js-data-product-categories-ajax");
			wcuf_activate_new_product_select_box(".js-data-products-ajax");
			wcuf_activate_new_attibute_select_box(".js-data-attributes-ajax");
			wcuf_checkMultipleUpoloadsCheckbox();
		},
		error: function (data) 
		{
			
		},
		cache: false,
		contentType: false,
		processData: false
	});	
	
	return false;
}

function wcuf_duplicate_field(event)
{
	event.preventDefault();
	event.stopImmediatePropagation();
		
	var random = Math.floor((Math.random() * 1000000) + 999);
	var formData = new FormData();
	var index_to_duplicate = jQuery(event.currentTarget).data('id');
	formData.append('action', 'wcuf_duplicate_field'); 
	formData.append('start_index', wcuf_free_field_id); 
	formData.append('index_to_duplicate', index_to_duplicate); 
	
	//UI
	wcuf_activate_new_category_select_box("#upload_type_id"+wcuf_free_field_id);
	wcuf_activate_new_product_select_box("#product_select_box"+wcuf_free_field_id);
	wcuf_beforeLoadingTemplate();
	
	wcuf_free_field_id++; 
	
	jQuery.ajax({
		url: ajaxurl+"?nocache="+random,
		type: 'POST',
		data: formData,
		async: true,
		success: function (data) 
		{
			//UI	
			wcuf_afterLoadingTemplate();
			jQuery(".input_fields_wrap").append(data);	

			wcuf_activate_new_category_select_box(".js-data-product-categories-ajax");
			wcuf_activate_new_product_select_box(".js-data-products-ajax");
			wcuf_activate_new_attibute_select_box(".js-data-attributes-ajax");
			//init
			wcuf_checkMultipleUpoloadsCheckbox();
			jQuery(".upload_type").trigger('change');
		},
		error: function (data) 
		{
			
		},
		cache: false,
		contentType: false,
		processData: false
	});	
}