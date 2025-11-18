<?php 
class WCUF_MyAccountPage
{
	public function __construct()
	{
		add_action( 'init', array( &$this, 'init' ));
		
	}
	function init()
	{
		global $wcuf_option_model;
		$display_last_order_upload_fields_in_my_account_page = 'no';
		try
		{
			$all_options = $wcuf_option_model->get_all_options();
			$display_last_order_upload_fields_in_my_account_page = $all_options['display_last_order_upload_fields_in_my_account_page'];
		}catch(Exception $e){};
		
		if($display_last_order_upload_fields_in_my_account_page == 'yes')
		
		add_action( 'woocommerce_before_my_account', array( &$this, 'my_account_page_positioning' ) );
	}
	public function my_account_page_positioning($order = null)
	{
		
		echo do_shortcode('[wcuf_upload_form_last_order]');
	}
}
?>