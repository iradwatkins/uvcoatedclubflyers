<?php 
class WCUF_EmailNotifier
{
	public function __construct() 
	{
		add_filter( 'woocommerce_email_attachments', array( &$this, 'add_attachments' ), 10, 3);
		add_action('woocommerce_email_before_order_table', array(&$this, 'embed_files_before_order_table'), 10, 4); 
		add_action('woocommerce_email_after_order_table', array(&$this, 'embed_files_after_order_table'), 10, 4); 
	}
	public function add_attachments( $attachments , $status, $order ) 
	{
		global $wcuf_option_model, $wcuf_upload_field_model;
		
		$reflect = is_object($order) ? new ReflectionClass($order) : "none";
		$ref_class_name = $reflect == "none" ? "none" : $reflect->getShortName();
		$accepted_class_names = array('Automattic\WooCommerce\Admin\Overrides\Order', 'WC_Order', 'WC_Admin_Order');
	
		if(!isset($order) || !isset($status) || !isset($attachments) || !is_object($order) || (!in_array(get_class($order), $accepted_class_names) && $ref_class_name != "Order") || $status != 'new_order')
			return $attachments;
		
		$file_fields_groups =  $wcuf_option_model->get_fields_meta_data();
		$file_order_metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order->get_id());
		
		foreach($file_order_metadata as $fieldname_id => $file_data)
		 {
			$original_option_id = $file_data["id"];
			$result = explode("-", $original_option_id);
			$original_option_id = $result[0];
			
			foreach($file_fields_groups as $option)
			{
				if($option['id'] == $original_option_id && wcuf_get_value_if_set($option, 'email_attach_files_to_new_order', false)  )
				{
					if(isset($file_order_metadata[$file_data["id"]]['absolute_path'])) //absolute_path
						foreach($file_order_metadata[$file_data["id"]]['absolute_path'] as $element_id => $url)
							if($file_order_metadata[$file_data["id"]]['source'][$element_id] == 'local' )
								$attachments[] = $url;					
				}
			}
		}
		
		return $attachments;
	}
	public function embed_files_before_order_table($order, $sent_to_admin, $plain_text, $email = null)
	{
		if(!$sent_to_admin || !isset($email) || !is_object($email) || get_class($email) != 'WC_Email_New_Order')
			return; 
		
		$this->embed_files_to_new_order_email('before', $order, $sent_to_admin, $email);
	}
	public function embed_files_after_order_table($order, $sent_to_admin, $plain_text, $email = null)
	{
		if(!$sent_to_admin || !isset($email) || !is_object($email) || get_class($email) != 'WC_Email_New_Order')
			return; 
		
		$this->embed_files_to_new_order_email('after', $order, $sent_to_admin, $email);
	}
	private function embed_files_to_new_order_email($position, $order, $sent_to_admin, $email)
	{
		if(!$sent_to_admin || !isset($email) || get_class($email) != 'WC_Email_New_Order')
			return; 
		
		global $wcuf_option_model, $wcuf_upload_field_model;
		$order_id = $order->get_id();
		$file_fields_groups =  $wcuf_option_model->get_fields_meta_data();
		$file_order_metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);
		$quantity_selection_enabled = $wcuf_option_model->get_all_options('enable_quantity_selection', false);
		$data_to_embed = array();
		$content = "";
		
		//Processing
		foreach($file_order_metadata as $fieldname_id => $file_data)
		{
			$original_option_id 	= $file_data["id"]; //Format: 0-14390-0-idsai1
			$result 				= explode("-", $original_option_id);
			$original_option_id 	= $result[0];
			$product_id 			= wcuf_get_value_if_set($result, 1, "");
			$variation_id 			= wcuf_get_value_if_set($result, 2, "");
			$unique_id 				= wcuf_get_value_if_set( $result, 3, false);
			
			foreach($file_fields_groups as $option)
			{
				if($option['id'] == $original_option_id && wcuf_get_value_if_set($option, 'email_embed_files_to_new_order', false) == "woocommerce_email_{$position}_order_table"  )
					{
						$file_urls = $wcuf_upload_field_model->get_secure_urls($order_id, $file_data["id"], $file_order_metadata);
						$data_to_embed[$file_data["id"]] = array('file_info' => array('title' => $file_data['title'], 
																					 'file_name' => $file_data['original_filename'], 
																					 'url'=> $file_urls, 
																					 'source' => $file_data['source'], 
																					 'feedback' => $file_data['user_feedback'], 
																					 'quantity' => $file_data['quantity'],
																					 'product_id' => $product_id,
																					 'variation_id' => $variation_id,
																					 'unique_id' => $unique_id,
																					 'disable_quantity_selector' => !$quantity_selection_enabled || $option['disable_quantity_selector']
																					),
																  'order_meta'=> $file_data
																);				
					}
			}
		}
		
		//Embedding
		if(file_exists ( get_theme_file_path()."/wcuf/email_admin_new_order_file_embedding.php" ))
			include get_theme_file_path()."/wcuf/email_admin_new_order_file_embedding.php";
		else
			include WCUF_PLUGIN_ABS_PATH.'/template/email_admin_new_order_file_embedding.php';
	}
}
?>