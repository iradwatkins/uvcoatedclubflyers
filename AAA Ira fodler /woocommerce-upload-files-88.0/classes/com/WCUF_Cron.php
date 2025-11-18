<?php 
class WCUF_Cron
{
	public function __construct()
	{
		add_action( 'wp_loaded', array(&$this,'schedule_events') );	//wp event fiered only when accessin frontend
		add_action( 'wcuf_delete_order_empty_directories', array(&$this, 'delete_order_empty_directories' ));
		add_action( 'cron_schedules', array(&$this, 'cron_schedules' ));
	}
	function cron_schedules($schedules)
	{
		
		if(!isset($schedules["wcuf_60_minutes"]))
		{
			$schedules["wcuf_60_minutes"] = array(
			'interval' => 60*60, 
			'display' => esc_html__('Once every 60 Minutes'));
		}
		return $schedules;
	}
	function schedule_events() 
	{
		
		if ( !wp_next_scheduled( 'wcuf_delete_order_empty_directories' ) ) 
		{
			wp_schedule_event( time(), "wcuf_60_minutes", 'wcuf_delete_order_empty_directories' ); //seconds
		}
		
		
	}
	function delete_order_empty_directories()
	{
		global $wcuf_file_model;
		
		$wcuf_file_model->start_delete_empty_order_directories();
	}
}
?>