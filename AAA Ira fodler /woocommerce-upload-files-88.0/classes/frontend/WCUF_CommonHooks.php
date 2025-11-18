<?php 
class WCUF_CommonHooks
{
	var $uploaded_files_metadata;
	function __construct()
	{
		add_action( 'woocommerce_order_item_meta_end', array( &$this, 'display_order_item_meta' ), 20, 3 ); 								 //This is fired both by emails and order details page while rendering item table
		add_filter( 'woocommerce_order_item_get_formatted_meta_data', array( &$this, 'remove_meta_key_from_formatted_meta_data' ), 10, 1 );  //Order details and email. Removes the special key from the item meta formatation
		add_filter('woocommerce_order_items_meta_get_formatted', array( &$this, 'remove_meta_key_from_meta_get_formatted' ), 10, 2 );  //Order details and email. Removes the special key from the item meta formatation
		//add_filter('wpo_wcpdf_order_items_data', array(&$this, 'remove_meta_key_from_wpo_formatted_meta_data'), 10, 3);						//Removes the special key from the item meta formatation from woocommerce-pdf-invoices-packing-slips PDFs
	}
	function remove_meta_key_from_wpo_formatted_meta_data($data_list, $order, $type)
	{
		//wcuf_write_log($data_list);
		return $data_list;
	}
	function remove_meta_key_from_formatted_meta_data($formatted_meta)
	{
		$temp_metas = [];
		$key_to_remove = array(WCUF_Cart::$sold_as_individual_item_cart_key_name, WCUF_Cart::$disable_stacking_cart_key_name);
		foreach($formatted_meta as $key => $meta) 
		{
			
			if ( isset( $meta->key ) && ! in_array($meta->key, $key_to_remove ) ) 
			{
				$temp_metas[ $key ] = $meta;
			}
		}
		return $temp_metas;
	}
	function remove_meta_key_from_meta_get_formatted($formatted_meta, $item)
	{
		$key_to_remove = array(WCUF_Cart::$sold_as_individual_item_cart_key_name, WCUF_Cart::$disable_stacking_cart_key_name);
		foreach($formatted_meta as $key => $data)
		{
			if (  in_array($data['key'] , $key_to_remove ) )
					unset($formatted_meta[$key]);
		}
		return $formatted_meta;
	}
	function display_order_item_meta($item_id, $item, $order )
	{
		global $wcuf_order_model, $wcuf_upload_field_model, $wcuf_file_model, $wcuf_product_model, $wcuf_media_model, $wcuf_option_model, $wcuf_time_model;		
		$order_id = $order->get_id();
		
		if(did_action('woocommerce_email_order_details') == 0 || !$wcuf_option_model->show_previews_on_emails_item_table())
			return;
		
		$uploaded_files = wcuf_get_value_if_set($this->uploaded_files_metadata, $order_id, false) != false ? $this->uploaded_files_metadata[$order_id] : $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id); 
		$file_fields_options =  $wcuf_option_model->get_fields_meta_data();
		$this->uploaded_files_metadata[$order_id] = $uploaded_files;
		
		$product_id = $item->get_product_id();
		$product_variation_id = $item->get_variation_id();
		$product = wc_get_product(isset($product_variation_id ) && $product_variation_id != 0 ? $product_variation_id  : $product_id);
		$quantity_selection_enabled = $wcuf_option_model->get_all_options('enable_quantity_selection', false);
		
		//Product upload preview
		if(isset($product) && $product != false)
		{
			$uploaded_files_metadata = wcuf_get_value_if_set($this->uploaded_files_metadata, $order_id, false) != false ? $this->uploaded_files_metadata[$order_id] : $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);
			$this->uploaded_files_metadata[$order_id] = $uploaded_files_metadata;
			
			//Compute which files are images and which not
			$current_product_uploads = $product_specific_uploads  = array();
			foreach($uploaded_files_metadata as $upload_field_id => $file_meta)
			{
				//Quantity selector option that might be overriden at Upload field configuration level
				$original_option_id = $file_meta["id"]; //Format: 0-14390-0-idsai1
				$result = explode("-", $original_option_id);
				$original_option_id = $result[0];
				$file_meta['disable_quantity_selector'] = !$quantity_selection_enabled;
				foreach($file_fields_options as $option)
					if($option['id'] == $original_option_id)
							$file_meta['disable_quantity_selector'] = !$quantity_selection_enabled || $option['disable_quantity_selector'];
			
				$product_id = $product->is_type('variation') ? $product->get_parent_id() : $product->get_id();
				$variation_id = $product->is_type('variation') ? $product->get_id() : 0;
				$unique_id = $wcuf_order_model->read_order_item_meta($item,'_wcuf_sold_as_individual_unique_key');
				$item_id_data = array('product_id' => $product_id , 'variant_id'=> $variation_id , 'unique_product_id'=> $unique_id  );
				
				$ids = $wcuf_file_model->get_product_ids_and_field_id_by_file_id("order_".$upload_field_id);		
				$is_the_uploaded_assocaited_to_the_product = $wcuf_product_model->is_the_same_product($item_id_data, $ids);
				
				if($is_the_uploaded_assocaited_to_the_product)
				{
					$current_product_uploads[$upload_field_id] = $file_meta;
					$product_specific_uploads[$upload_field_id] = $upload_field_id;
				}
					
			}
		
			if(file_exists ( get_theme_file_path()."/wcuf/email_product_uploads_preview.php" ))
				include get_theme_file_path()."/wcuf/email_product_uploads_preview.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/email_product_uploads_preview.php';
		}
	}
}
?>