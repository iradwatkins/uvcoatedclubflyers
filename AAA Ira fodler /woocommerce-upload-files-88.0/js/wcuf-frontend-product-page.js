"use strict";
jQuery(document).ready(function()
{
	if(wcuf_options.exists_at_least_one_upload_field_bounded_to_variations == 'true')
		jQuery(document).on('show_variation', wcuf_variation_has_been_selected); //only on product page, when a variation has been selected
	
	//hide qty selector
	if(wcuf_options.cart_quantity_as_number_of_uploaded_files == 'true' && jQuery('.wcuf_upload_fields_row_element').length > 0)
		jQuery('div.quantity, .quantity input.qty, #qty').hide();
});
function wcuf_variation_has_been_selected(event)
{
	if(!wcuf_exist_a_field_before_add_to_cart)
		return;
	var variation_id = jQuery('input[name=variation_id]').val();
	var random = Math.floor((Math.random() * 1000000) + 999);
	var formData = new FormData();
	formData.append('action', 'reload_upload_fields');
	formData.append('product_id', jQuery('input[name=add-to-cart]').val());
	formData.append('variation_id', variation_id);
	formData.append('wcuf_wpml_language', wcuf_wpml_language);
	formData.append('current_item_cart_id', wcuf_options.current_item_cart_id);
	
	//UI
	wcuf_ui_show_hide_add_to_cart_area(false, false, 600, 400); //Force hiding the add to cart button
	jQuery('.wcuf_'+wcuf_current_page+'_ajax_container').animate({ opacity: 0 }, 500, function()
	{	
		//UI
		jQuery('.wcuf_'+wcuf_current_page+'_ajax_container_loading_container').html("<h4>"+wcuf_ajax_reloading_fields_text+"</h4>");
		
		jQuery.ajax({
			url: wcuf_ajaxurl+"?nocache="+random,
			type: 'POST',
			data: formData,
			async: true,
			dataType : "html",
			contentType: "application/json; charset=utf-8",
			success: function (data) 
			{
				//UI
				jQuery('.wcuf_'+wcuf_current_page+'_ajax_container_loading_container').html("");  
				jQuery('.wcuf_'+wcuf_current_page+'_ajax_container').html(data);
				jQuery('.wcuf_'+wcuf_current_page+'_ajax_container').animate({ opacity: 1 }, 500);	
							
				//Hide add to cart in case of required field 
				wcuf_ui_hide_add_to_cart_button_in_case_of_required_upload(600, 400);
				
			},
			error: function (data) {
				
			},
			cache: false,
			contentType: false,
			processData: false
		});
	});
	
}