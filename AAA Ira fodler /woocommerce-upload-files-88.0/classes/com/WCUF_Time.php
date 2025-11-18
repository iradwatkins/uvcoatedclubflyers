<?php 
class WCUF_Time 
{
	function __construct()
	{
		
	}
	public function can_be_displayed($field_data, $order = null)
	{
		$visibility_type = wcuf_get_value_if_set($field_data, array('time_visibility','type'), 'disabled');
		
		if($visibility_type == 'disabled' )
		 return true;
	 
	   if($visibility_type == 'amount_of_time' && !isset($order))
		   return false;
	   
	   
	   
	   if($visibility_type == 'specific_date')
	   {
		   $minute = wcuf_get_value_if_set($field_data, array( 'time_visibility','specific_date', 'minute'), '1');
		   $hour = wcuf_get_value_if_set($field_data, array( 'time_visibility','specific_date', 'hour'), '1');
		   $day = wcuf_get_value_if_set($field_data, array( 'time_visibility','specific_date', 'day'), '1');
		   $month = wcuf_get_value_if_set($field_data, array( 'time_visibility','specific_date', 'month'), '1');
		   $year = current_time( 'Y' );
		   $expiring_date = new DateTime($year."-".$month."-".$day." ".$hour.":". $minute.":00");
		   $current_date = new DateTime(current_time( 'Y-m-d H:i:s' ));
			return $current_date > $expiring_date ? false : true; 
		   
	   }
	   else if($visibility_type == 'amount_of_time')
	   {
		   $quantity = wcuf_get_value_if_set($field_data, array( 'time_visibility','amount_of_time', 'quantity'), '1');
		   $type = wcuf_get_value_if_set($field_data, array( 'time_visibility','amount_of_time', 'type'), '1');
		   $order_date = $order->get_date_created();
		   $order_date =  new DateTime($order_date->date("Y-m-d H:i:s"));
		   $current_date = new DateTime(current_time( 'Y-m-d H:i:s' ));
		   $order_date->modify('+'.$quantity." ".$type);
		  
		   return $current_date > $order_date ? false : true; 
	   }
	   
	   return true;
	}
}
?>