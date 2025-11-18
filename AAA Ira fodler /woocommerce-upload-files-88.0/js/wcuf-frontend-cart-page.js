"use strict";
jQuery(document).ready(function()
{
	
	jQuery(document.body).on('wc_fragment_refresh updated_wc_div', wcuf_manage_upload_area_visibility);
	
	jQuery( document.body ).on( 'wc_update_cart', wcuf_sort_wcuf_preview_list);
	wcuf_sort_wcuf_preview_list(null);
});
function wcuf_manage_upload_area_visibility()
{
	wcuf_ui_show_upload_field_area();
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
		
		if(perform_sort)
			for(var i = 0; i<wcuf_data.length; i++)
			{
				jQuery(wcuf_data[i]).insertAfter(last_elem);
			}
		
	});
}