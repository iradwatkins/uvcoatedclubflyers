"use strict";
var wcuf_delete_index = 0;
jQuery(document).ready(function()
{
	jQuery(document).on('click', '.wcuf_delete_single_file_stored_on_server', wcuf_delete_single_file_on_server);
	jQuery(document).on('click', '.wcuf_delete_button', wcuf_on_delete_button_click);
});
function wcuf_delete_single_file_on_server(event)
{
	const id = jQuery(event.currentTarget).data('id');
	const field_id = jQuery(event.currentTarget).data('field-id');
	event.preventDefault();
	event.stopImmediatePropagation();
	
	if(confirm(wcuf.delete_msg))
	{
		wcuf_ui_delete_file();
		jQuery.post( ajaxurl , { action: 'delete_single_file_on_order_detail_page', id: id, order_id:wcuf.order_id, field_id:field_id } ).done( wcuf_ui_after_delete );
	}
	return false;
}
function wcuf_on_delete_button_click(e)
{
   e.preventDefault();
   if(confirm(wcuf.delete_msg))
   {
	   jQuery("#upload-box").append( '<input type="hidden" name="files_to_delete['+wcuf_delete_index+']" value="'+jQuery(e.target).data('fileid')+'"></input>');
	   jQuery(e.target).parent().remove();
	   wcuf_delete_index++;
	}
}
function wcuf_ui_delete_file()
{
	jQuery('#upload-box').css('pointer-events', 'none');
	jQuery(document.body).css({ 'cursor': 'wait' });
	jQuery('#upload-box').animate({opacity: 0.25});
}
function wcuf_ui_after_delete()
{
	location.reload(true);
}