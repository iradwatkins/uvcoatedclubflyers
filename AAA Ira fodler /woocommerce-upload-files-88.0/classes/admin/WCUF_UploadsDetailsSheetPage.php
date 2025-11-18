<?php 
class WCUF_UploadsDetailsSheetPage
{
	function __construct()
	{
		add_action('admin_init', array(&$this, 'render_details_sheet'));
	}
	function render_details_sheet()
	{
		global $wcuf_upload_field_model, $wcuf_file_model, $wcuf_product_model, $wcuf_order_model, $wcuf_media_model,  $wcuf_option_model;
		
		if(!isset($_GET['wcuf_page']) || $_GET['wcuf_page'] != 'uploads_details_sheet')
			return;
		if(!isset($_GET['wcuf_order_id']) || !is_numeric($_GET['wcuf_order_id']))
			return;
		
		$order_specific_uploads = array();
		$product_specific_uploads = array();
		$order_id = $_GET['wcuf_order_id'];
		$wc_order = wc_get_order($order_id );
		$currency_symbol = get_woocommerce_currency_symbol(); 
		$uploaded_files_metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);
		$display_feedback = $wcuf_option_model->get_all_options('display_user_feedback_on_order_details_sheet', false);
		
		//Doesn't work wp_enqueue_style('wcuf-upload-details-sheet-page', wcuf_PLUGIN_PATH.'/css/wcuf-admin-upload-details-sheet-page.css');
		if(file_exists ( get_theme_file_path()."/wcuf/uploads_details_sheet_page.php" ))
				include get_theme_file_path()."/wcuf/uploads_details_sheet_page.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/uploads_details_sheet_page.php';	
		
		die();
	}
	
}
?>