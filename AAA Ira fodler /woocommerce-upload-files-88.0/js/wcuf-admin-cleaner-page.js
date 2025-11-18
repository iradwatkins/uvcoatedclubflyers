"use strict";
const wcuf_chunk_size = 20;
var wcuf_total_orders = 0;
var wcuf_next_order_index_to_process = 0;
var wcuf_iteration_num = 1;

jQuery(document).ready(function()
{
	wcuf_init_date_selector();
	jQuery(document).on('click', '#wcuf_start_process',wcuf_start_cleaning_process)
	jQuery(document).on('click', '#wcuf_reload_process',wcuf_reload_page)
});
function wcuf_reload_page(event)
{
	location.reload();
}
function wcuf_init_date_selector()
{
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	var yyyy = today.getFullYear();

jQuery("#wcuf_start_date").pickadate(
		{ 
			format: 'yyyy-mm-dd',
			formatSubmit: 'yyyy-mm-dd',
			selectYears: 10,
			max: new Date(yyyy,mm,dd),
			selectYears: true,
			selectMonths: true
		});
}
function wcuf_start_cleaning_process(event)
{
	
	let order_stauses = new Array();
	jQuery('.wcuf_order_status').each(function(index, elem)
	{
		if(elem.checked)
			order_stauses.push(elem.value);
	});
	
	if(order_stauses.length == 0)
	{
		alert(wcuf.order_statuses_error);
		return;
	}
	else if(jQuery('#wcuf_start_date').val() == "")
	{
		alert(wcuf.date_error);
		return;
	}
	
	//UI
	jQuery('#wcuf_settings').fadeOut(500);
	jQuery('#wcuf_start_process').fadeOut(500);
	jQuery('#wcuf_progess_display').delay(600).fadeIn();
	
	wcuf_get_order_ids(order_stauses, jQuery('#wcuf_start_date').val())
	
}

function wcuf_get_order_ids(order_stauses, date)
{
	wcuf_total_orders = wcuf_next_order_index_to_process = 0;
	wcuf_iteration_num = 1;
	var formData = new FormData();
	formData.append('action', 'wcuf_get_order_ids_by_date');	
	formData.append('order_statuses', order_stauses); 			
	formData.append('start_date', date); 			
	jQuery.ajax({
			url: ajaxurl,
			type: 'POST',
			data: formData,
			dataType : "html",
			contentType: "application/json; charset=utf-8",
			async: true,
			success: function (data) 
			{
				const result = JSON.parse(data);
				//UI 
				wcuf_update_progress_bar(0);	
				wcuf_process_orders(result);
			},
			error: function (data) 
			{
				
			},
			cache: false,
			contentType: false,
			processData: false
		}); 
}
function wcuf_process_orders(order_ids)
{
	wcuf_total_orders = order_ids.length;
	const end = wcuf_chunk_size*wcuf_iteration_num;
	const current_chunk = order_ids.slice(wcuf_next_order_index_to_process, end);
	
	wcuf_next_order_index_to_process += wcuf_chunk_size;
	wcuf_iteration_num++;
	
	//UI 
	jQuery('#notice-box').html(wcuf.order_detected_msg+order_ids.length);
	
	var formData = new FormData();
	formData.append('action', 'wcuf_delete_order_attachments');	
	formData.append('order_ids', current_chunk); 			
				
	jQuery.ajax({
			url: ajaxurl,
			type: 'POST',
			data: formData,
			async: true,
			success: function (data) 
			{
				//UI
				if(end < order_ids.length)
				{
					const current_perc = (wcuf_next_order_index_to_process/order_ids.length)*100;
					wcuf_update_progress_bar(current_perc);
					wcuf_process_orders(order_ids);
				}
				else
				{
					wcuf_update_progress_bar(100);
					//UI 
					jQuery('#wcuf_reload_process').fadeIn();
					jQuery('#notice-box').html(wcuf.done_msg);
				}
			},
			error: function (data) 
			{
				
			},
			cache: false,
			contentType: false,
			processData: false
		}); 
}
function wcuf_update_progress_bar(perc)
{
	const perc_text = Math.round(perc);
	jQuery('#progress-bar').animate({width: perc+"%"});
	jQuery('#percentage-text').html(perc_text+"%");
}