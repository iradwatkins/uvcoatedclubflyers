jQuery(document).ready(function()
{
	"use strict";
	jQuery(".price-cart, .type-product").each(function(index, elem)
	{
		var elem_counter = 0;
		jQuery( this ).find( '.summary a.button.add_to_cart_button' ).each(function(index, elem)
		{
			if(elem_counter++ > 0)
				jQuery(this).remove();
		});
		
		elem_counter = 0;
		jQuery( this ).find( '.summary a.button.product_type_grouped' ).each(function(index, elem)
		{
			if(elem_counter++ > 0)
				jQuery(this).remove();
		});
		
		elem_counter = 0;
		jQuery( this ).find( '.summary a.button.product_type_simple' ).each(function(index, elem)
		{
			if(elem_counter++ > 0)
				jQuery(this).remove();
		});
	});
});