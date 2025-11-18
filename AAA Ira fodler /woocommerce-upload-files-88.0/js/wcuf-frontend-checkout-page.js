"use strict";
var wcuf_current_payment_method = 'none';
var wcuf_current_shipping_method = 'none';

jQuery(document).ready(function()
{

	if(wcuf_options.exists_at_least_one_upload_field_bounded_to_gateway == 'true')
	{
		jQuery('li.wc_payment_method input.input-radio').on('click', wcuf_on_user_selection);
		jQuery("li.wc_payment_method input.input-radio").each(function(index, elem)
		{
			if(jQuery(elem).prop('checked'))
				jQuery(elem).trigger('click');
		});  
		//to workaround the non "live" jquery method that seems to not working
		jQuery( document.body ).on( 'updated_checkout', function()
		{
			wcuf_ui_show_upload_field_area();
			jQuery('li.wc_payment_method input.input-radio').on('click', wcuf_on_user_selection);
		} );
	}
	if(wcuf_options.exists_at_least_one_upload_field_bounded_to_shipping_method == 'true')
	{
		jQuery('ul#shipping_method li input.shipping_method').on('click', wcuf_on_user_selection);
		jQuery("ul#shipping_method li input.shipping_method").each(function(index, elem)
		{
			if(jQuery(elem).prop('checked'))
				jQuery(elem).trigger('click');
		});  
		//to workaround the non "live" jquery method that seems to not working
		jQuery( document.body ).on( 'updated_checkout', function()
		{
			wcuf_ui_show_upload_field_area();
			jQuery('ul#shipping_method li input.shipping_method').on('click', wcuf_on_user_selection);
		} );
	}
	
	//this is used for upload fields showed inside the div containing the product table. That div is dynamically updated and it could happen that the upload area 
	//is reloaded remaining with 0 opacity
	jQuery( document.body ).on( 'updated_checkout', function()
	{
		wcuf_ui_show_upload_field_area();
	} );
	
	jQuery('.woocommerce-shipping-fields__field-wrapper').css('display', 'block');
	jQuery('.woocommerce-shipping-fields__field-wrapper').animate({opacity: 1}, 0);
	
	//Cart table preview sort 
	jQuery( document.body ).on( 'updated_checkout', wcuf_sort_wcuf_preview_list);
	
});
function wcuf_on_user_selection(event)
{
	
	var random = Math.floor((Math.random() * 1000000) + 999);
	wcuf_current_payment_method = "none";
	wcuf_current_shipping_method = "none";
	jQuery("ul#shipping_method li input.shipping_method").each(function(index, elem)
		{
			wcuf_current_shipping_method = jQuery(elem).prop('checked') ? jQuery(elem).val() : wcuf_current_shipping_method;
		});
	jQuery("li.wc_payment_method input.input-radio").each(function(index, elem)
		{
			wcuf_current_payment_method = jQuery(elem).prop('checked') ? jQuery(elem).val() : wcuf_current_payment_method;
		});  	
	
	//UI
	jQuery('.wcuf_'+wcuf_current_page+'_ajax_container_loading_container').html("<h4>"+wcuf_ajax_reloading_fields_text+"</h4>");
		
	jQuery(".wcuf_file_input").each(function( index, elem ) 
	{
		var id = jQuery(elem).data('id');
		var ajax_container_unique_id = jQuery(elem).data('container-unique-id');
		var cart_item_id = jQuery(elem).data('cart-item-id');
		var ajax_loader_container = ajax_container_unique_id == "none" ? '.wcuf_'+wcuf_current_page+'_ajax_container_loading_container' : '#wcuf_'+wcuf_current_page+'_ajax_container_loading_container_'+ajax_container_unique_id;
		var ajax_container = ajax_container_unique_id == "none" ? '.wcuf_'+wcuf_current_page+'_ajax_container' : '#wcuf_'+wcuf_current_page+'_ajax_container_'+ajax_container_unique_id;
	
		//Old method used before displaying fields in the cart item table
		var formData = new FormData();
		
		formData.append('action', 'reload_upload_fields_on_checkout');
		formData.append('payment_method', wcuf_current_payment_method);
		formData.append('shipping_method', wcuf_current_shipping_method);
		formData.append('wcuf_wpml_language', wcuf_wpml_language);
		formData.append('cart_item_id', cart_item_id);
		formData.append('container_unique_id', ajax_container_unique_id);
		
		//UI
		jQuery(ajax_container).animate({ opacity: 0 }, 50, function()
		{
			jQuery.ajax({
				url: wcuf_ajaxurl+"?nocache="+random,
				type: 'POST',
				data: formData,
				async: false,
				dataType : "html",
				contentType: "application/json; charset=utf-8",
				success: function (data) 
				{
					//UI
					jQuery(ajax_loader_container).html("");  
					jQuery(ajax_container).html(data);
					jQuery(ajax_container).animate({ opacity: 1 }, 500);	
										
				},
				error: function (data) 
				{
				},
				cache: false,
				contentType: false,
				processData: false
			});
		});
	});		
}
function wcuf_sort_wcuf_preview_list(event)
{
	//Sort preview displayed in the car table
	jQuery('td.product-name').each(function(index, elem)
	{
		var first_elem;
		var last_elem;
		var wcuf_data = new Array();
		var perform_sort = false;
		var quantity_elem = jQuery(elem).find("strong.product-quantity");
		jQuery(elem).find("dl.variation").each(function(index, elem2)
		{
			first_elem = index == 0 ? elem2 : first_elem;
			last_elem = elem2;
			
			if(jQuery(elem2).hasClass('wcuf-details'))
				wcuf_data.push(elem2);
			if(!jQuery(elem2).hasClass('wcuf-details'))
				perform_sort = true;
		});
		
		wcuf_data.reverse();
		
		//If no variation are associated to the product, the previews are displayed after the quantity
		if(!perform_sort)
		{
			perform_sort = true;
			last_elem = quantity_elem;
		}
		
		if(perform_sort)
			for(var i = 0; i<wcuf_data.length; i++)
			{
				jQuery(wcuf_data[i]).insertAfter(last_elem);
			}
			
		
	});
}
