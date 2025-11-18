"use strict";
jQuery(document).ready(function()
{
	
	jQuery(document).on('click', '.wcuf_update_feedback_text_button', wcuf_manage_feedback_update);
});
function wcuf_manage_feedback_update(event)
{
	event.preventDefault();
	const elem = jQuery(event.currentTarget);
	const id = elem.data('id');
	const required = elem.data('required');
	const feedback_text = jQuery('#wcuf_feedback_textarea_'+id).val();
	const unique_key = jQuery('#wcuf_feedback_textarea_'+id).val();
	
	if(required && feedback_text == "")
	{
		wcuf_show_popup_alert(wcuf_user_feedback_required_message);
		return false;
	}
	
	//UI 
	elem.prop("disabled", true);
	jQuery("#wcuf_update_feedback_loader_"+id).show();
	
	var formData = new FormData();
	formData.append('action', 'wcuf_update_feedback_text');			
	formData.append('feedback', feedback_text);			
	formData.append('unique_key', !wcuf_is_order_detail_page ? 'wcufuploadedfile_'+id : id);			
	formData.append('is_order_details_page', wcuf_is_order_detail_page);			
	formData.append('order_id', wcuf_order_id);			
	jQuery.ajax({
			url: wcuf_ajaxurl,
			type: 'POST',
			data: formData,
			async: true,
			success: function (data) 
			{
				//UI
				elem.prop("disabled", false);
				jQuery("#wcuf_update_feedback_loader_"+id).hide();
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