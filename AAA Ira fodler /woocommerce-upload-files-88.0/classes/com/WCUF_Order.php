<?php 
class WCUF_Order
{
	public function __construct()
	{
		add_action('wp_ajax_wcuf_get_order_ids_by_date', array(&$this, 'ajax_get_order_ids_by_date'));
		add_action('wp_ajax_wcuf_delete_order_attachments', array(&$this, 'ajax_delete_order_attachments'));
		//Order again
		add_filter('woocommerce_order_again_cart_item_data', array(&$this, 'order_again_cart_item_data'), 10, 3);
		add_action('woocommerce_ordered_again', array(&$this, 'ordered_again'), 10, 3);
	}
	public function get_order_number_folder_name($order)
	{
		return strpbrk($order->get_order_number(), "\\/?%*:|\"<>") === FALSE ? $order->get_order_number() : $order->get_id();
	}
	public function get_order_id($order)
	{
		return version_compare( WC_VERSION, '2.7', '<' ) ? $order->id : $order->get_id();
	}
	public function get_order_status($order)
	{
		return version_compare( WC_VERSION, '2.7', '<' ) ? $order->status : $order->get_status();
	}
	public function get_billing_email($order)
	{
		return version_compare( WC_VERSION, '2.7', '<' ) ? $order->billing_email : $order->get_billing_email();
	}
	//Re-order actions handlers
	function order_again_cart_item_data( $reordered_item_meta, $oder_item, $order )
	{
		global $wcuf_option_model;
		$copy_files = $wcuf_option_model->get_all_options('order_again_copy_uploaded_files', true);
		if($oder_item->get_meta('_wcuf_sold_as_individual_unique_key') /* && $copy_files */)
		{
			$reordered_item_meta[WCUF_Cart::$sold_as_individual_item_cart_key_name] = $oder_item->get_meta('_wcuf_sold_as_individual_unique_key');
		}
		return $reordered_item_meta;
	}
	public function ordered_again($order_id, $order_items, $cart)
	{
		global $wcuf_upload_field_model, $wcuf_session_model, $wcuf_file_model, $wcuf_option_model ;
		$copy_files = $wcuf_option_model->get_all_options('order_again_copy_uploaded_files', true);
		if(!$copy_files)
			return;
		
		$order_metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);
		if($order_metadata)
		{
			$updated_data = $wcuf_file_model->create_tmp_file_data_from_order($order_metadata);
			$wcuf_session_model->set_item_data_from_meta($updated_data);
		}
		
	}
	//end
	public function ajax_delete_order_attachments()
	{
		global $wcuf_file_model;
		if(isset($_POST['order_ids']))
		{
			$ids = explode(",", $_POST['order_ids']);
			foreach((array)$ids as $order_id)
				$wcuf_file_model->delete_all_order_uploads($order_id);
		}
		wp_die();
	}
	public function ajax_get_order_ids_by_date()
	{
		if(isset($_POST['order_statuses']) && isset($_POST['start_date']))
		{
			$result = $this->get_order_ids_by_date($_POST['start_date'], explode(",",$_POST['order_statuses']));
			echo json_encode($result);
		}
		wp_die();
	}
	public function get_order_ids_by_date($date, $statuses)
	{
		
		$args = array(
			'status' => $statuses,
			'date_created' => '<=' . $date,
			'return' => 'ids',
			'limit' => -1
		);
		$orders = wc_get_orders( $args );
		
		return $orders;
	}
	public function read_order_item_meta($item, $meta_key, $single = true)
	{
		$value = null;
		if(version_compare( WC_VERSION, '2.7', '<' ))
		{
			if(isset($item["item_meta"][$meta_key]))
				$value = $single ? $item["item_meta"][$meta_key][0] : $item["item_meta"][$meta_key];
			
		}
		else 
			$value = $item->get_meta($meta_key, $single);
		
		return $value;
	}
	public function get_sorted_order_items($order)
	{
		$items = $order->get_items();
		if(is_array($items))
		  usort($items, function($a, $b) {
			return $a['product_id'] - $b['product_id'];
		});
		return $items;
	}
	public function get_available_order_statuses($remove_internal_prefix = true)
	{
		$statuses = wc_get_order_statuses();
		$result = array();
		if($remove_internal_prefix)
		{
			foreach((array)$statuses as $code => $name)
			{
				$result[str_replace("wc-", "", $code)] = $name;
			}
		}
		else 
			$result = $statuses;
		
		return  $result;
	}
	public function remove_single_file_form_order_uploaded_data($order_id, $field_id, $single_file_id)
	{
		global $wcuf_upload_field_model, $wcuf_session_model, $wcuf_file_model;
		$file_order_metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);
		if(!isset($file_order_metadata[$field_id]))
			return;
		
		//file delete
		$wcuf_file_model->delete_temp_file($file_order_metadata[$field_id]['absolute_path'][$single_file_id], $file_order_metadata, $field_id, $single_file_id);
		unset($file_order_metadata[$field_id]['absolute_path'][$single_file_id]);
		
		if(wcuf_get_value_if_set($file_order_metadata, array($field_id, 'approval', 'status', $single_file_id), false))
		{
			unset($file_order_metadata[$field_id]['approval']['status'][$single_file_id]);
			unset($file_order_metadata[$field_id]['approval']['feedback'][$single_file_id]);
		}
		
		$result = $wcuf_session_model->remove_subitem_from_session_array($file_order_metadata[$field_id], $single_file_id);
		if($result == null)
			unset($file_order_metadata[$field_id]);
		else 
			$file_order_metadata[$field_id] = $result;
		
		$wcuf_upload_field_model->save_uploaded_files_meta_data_to_order($order_id, $file_order_metadata);
	}
	public function is_selected_payment_method_allowed($order_or_payment_code, $allowed_gateways, $visibility_payment_gateway_policy)
	{
		$selected_payment_method = is_object($order_or_payment_code) ? $order_or_payment_code->get_payment_method() : $order_or_payment_code;
		
		if(($visibility_payment_gateway_policy == 'allow' && !array_key_exists ($selected_payment_method, $allowed_gateways)) || 
		   ($visibility_payment_gateway_policy == 'deny' && array_key_exists ($selected_payment_method, $allowed_gateways)))
		   return false;
		   
		return true;
	}
	public function is_selected_shipping_method_allowed($order_or_current_shipping_method, $visibility_shipping_methods)
	{
		if(is_object($order_or_current_shipping_method))
		{
				$current_shipping_method = $order_or_current_shipping_method->get_shipping_methods();
				foreach($current_shipping_method as $shipping_method)
				{
					if(array_key_exists($shipping_method->get_method_id().":".$shipping_method->get_instance_id(), $visibility_shipping_methods) ||
					   array_key_exists($shipping_method->get_method_id()."-".$shipping_method->get_instance_id(), $visibility_shipping_methods) ||
					   array_key_exists($shipping_method->get_method_id()."_".$shipping_method->get_instance_id(), $visibility_shipping_methods) 
					)
					return true;
				}
		
		}
		elseif (is_array($visibility_shipping_methods))
		{	
			$current_shipping_method = $order_or_current_shipping_method;
			return is_string($current_shipping_method) || is_int($current_shipping_method) ? array_key_exists($current_shipping_method, $visibility_shipping_methods) : false;
		}
		
		return false;
	}
	function get_order_details_page_url($order)
	{
		$order_url = $order->get_customer_id() ? $order->get_view_order_url(): 
												 $order->get_checkout_order_received_url( ); 
												 
		return $order_url;
	}
}
?>