"use strict";
var wcuf_missing_required_field_message_rendered = false;
jQuery(document).ready(function()
{
	
	jQuery(document).on('click','.tablinks', wcuf_manage_tab_click);
	jQuery(document).on('click','.scroll-to-top-button', wcuf_scroll_to_top);
});
function wcuf_scroll_to_top(evt)
{
	evt.stopImmediatePropagation();
	evt.preventDefault();
	
	var target = jQuery(evt.currentTarget).data('target');
	
	//smooth scroll
	 jQuery('html, body').animate({
		//scrollTop: jQuery(this).parent().parent('.input_box').offset().top-100
		scrollTop: jQuery(target).offset().top-100
	}, 500);
		
	return false;
}
function wcuf_manage_tab_click(evt) 
{
	evt.stopImmediatePropagation();
	evt.preventDefault();
	var tab_content_container = jQuery(evt.currentTarget).data('target');
	var group_id = jQuery(evt.currentTarget).data('group-id');
  
    var i;
	var tablinks = document.getElementsByClassName("tablinks");
	var tabcontent = document.getElementsByClassName("tabcontent"); 
	
	//required fields check 
	for (i = 0; i < tablinks.length; i++)
	{
		if(jQuery(tablinks[i]).data('group-id') == group_id && tablinks[i].className.indexOf(" active") !== -1)
			if(wcuf_is_any_required_field_is_emtpy(jQuery(tablinks[i]).data('target')))
			{
				//console.log("here");
				wcuf_missing_required_field_message_rendered = false;
				return false;
			}
	}
	
	
    // Get all elements with class="tabcontent" and hide them
	for (i = 0; i < tabcontent.length; i++) 
	{
		if( jQuery(tabcontent[i]).data('group-id') == group_id)
			tabcontent[i].style.display = "none";
	}

    // Get all elements with class="tablinks" and remove the class "active"
    for (i = 0; i < tablinks.length; i++) 
	{
		if( jQuery(tablinks[i]).data('group-id') == group_id)
			tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    
	jQuery(tab_content_container).css('display', "block");
    evt.currentTarget.className += " active";
	
	return false;
}

function wcuf_is_any_required_field_is_emtpy(selector)
{
	var children = jQuery(selector).children();
	var result = false;
	if(children.length == 0)
	{
		if(jQuery(selector).prop('required') && jQuery(selector).is(':visible') && jQuery(selector).val() == "")
		{
			if(!wcuf_missing_required_field_message_rendered)
			{
				
				alert(wcuf_options.missing_required_value);
				wcuf_missing_required_field_message_rendered = true;
			}
			jQuery(selector).css('border', '1px solid red');
		
			return true;
		}
	}
	else
		children.each(function (index, element) 
		{
			if(wcuf_is_any_required_field_is_emtpy(element))
			{
				
				result = true;
				return true;
			}
		});		
	
	return result;
}