<?php 
class WCUF_UploadField
{
	function __construct()
	{
	}
	public function get_individual_id_from_string($string)
	{
		return str_replace("idsai", "" ,$string); 
	}
	public function is_individual_id_string($string)
	{
		return strpos($string,"idsai") !== false;
	}
	public function get_subid_from_upload_field_id($id, $position = 0)
	{
		//The $id has the following format: 0-13986-0-idsai1
		//position 0: upload field id
		//position 1: product id
		//position 2: variation id
		//position 3: unique id
		$ids = explode("-", $id);
		return wcuf_get_value_if_set($ids, $position, false);
	}
	private function get_post_meta($order_id, $key, $single = true)
	{
		if(version_compare( WC_VERSION, '2.7', '<' ))
		{
			$data = get_post_meta($order_id, $key, $single);
			return $data;
		}
		$order = wc_get_order($order_id);
		
		if(!isset($order) || $order == false)
			return array();
		
		$data = $order->get_meta( $key, $single);
		
		return $data;
	}
	private function delete_post_meta($order_id, $key)
	{
		if(version_compare( WC_VERSION, '2.7', '<' ))
		{
			delete_post_meta( $order_id, $key);
			return;
		}
		$order = wc_get_order($order_id);
		
		if(!isset($order) || $order == false)
			return;
		
		$order->delete_meta_data($key);
		$order->save();
		return;
	}
	private function update_post_meta($order_id, $key, $value)
	{
		if(version_compare( WC_VERSION, '2.7', '<' ))
		{
			update_post_meta( $order_id, $key, $value);
			return;
		}
		$order = wc_get_order($order_id);
		
		if(!isset($order) || $order == false)
			return;
		
		$order->update_meta_data( $key, $value);
		$order->save();
		return;
	}
	public function get_meta_names()
	{
		return array('_wcst_uploaded_files_meta', '_wcuf_uploaded_files');
	}
	public function update_approva_data($data, $metadata, $order_id)
	{
		$send_notitication = false;
		
		foreach($data as $upload_field_id => $approval_data)
		{
			if(isset($approval_data["status"]))
				foreach($approval_data["status"] as $id => $data)
				{
					$old_data = wcuf_get_value_if_set($metadata, array($upload_field_id, "approval", "status", $id), "waiting-for-approval");
					$metadata[$upload_field_id]["approval"]["status"][$id] = $data;
					if($data != "waiting-for-approval" && $old_data != $data)
					{
						$send_notitication = true;
					}
				}
			
			if(isset($approval_data["feedback"]))			
				foreach($approval_data["feedback"] as $id => $data)
					$metadata[$upload_field_id]["approval"]["feedback"][$id] = $data ? trim($data) : "";
					
				if($approval_data["disable_notification"] == "true")
					$send_notitication = false;
		}
		
		if($send_notitication)
		{
			$notification_email = new WCUF_Email();
			$notification_email->send_approval_status_change_notification($order_id);
		}
		$this->save_uploaded_files_meta_data_to_order($order_id, $metadata);
	}
	public function get_approval_label_from_status($status) 
	{
		$statuses = array(
				'waiting-for-approval' => esc_html__('Waiting for approval', 'woocommerce-files-upload'),
				'approved' => esc_html__('Approved', 'woocommerce-files-upload'),
				'rejected' => esc_html__('Rejected', 'woocommerce-files-upload')
			);
		
		return wcuf_get_value_if_set($statuses, $status, "");	
	}
	public function get_uploaded_files_meta_data_by_order_id($order_id)
	{
		
		$result = $this->get_post_meta($order_id, '_wcst_uploaded_files_meta', true); //old error
		$result2 = $this->get_post_meta($order_id, '_wcuf_uploaded_files', true);
		
		//in case of incomplete upload, they are removed
		if(isset($result2) && is_array($result2))
			foreach($result2 as $key => $data)
				if(!isset($data['url']))
					unset($result2[$key]);
		
		if($result)
		{
			$removed = $this->remove_ghost_uploads($result, $order_id);
			if($removed)
				$this->update_post_meta($order_id, '_wcst_uploaded_files_meta', $result);
		}
		
		if($result2)
		{
			$removed = $this->remove_ghost_uploads($result2, $order_id);
			if($removed)
				$this->update_post_meta($order_id, '_wcuf_uploaded_files', $result2);
		}
		
		if( (!$result || empty($result)) && (!$result2 || empty($result2)))
			return array();
		
		if(!$result || empty($result))		
			return !$result2 ? array() : $result2;
		
		if(!$result2 || empty($result2))		
			return !$result ? array() : $result;
		
		$final_result = array_merge($result, $result2); //impossible, on save the old _wcst_uploaded_files_meta is deleted;
		
		return $final_result;
	}
	private function remove_ghost_uploads(&$uploaded_data, $order_id)
	{
		global $wcuf_order_model, $wcuf_file_model;
		
		$order 					= wc_get_order($order_id);
		$existing_complete_ids	= []; 
		$existing_parent_ids	= []; 
		$to_remove 				= [];
		
		//Retrieve possible existing upload ids
		foreach($order->get_items() as $item)
		{
			$unique_id = $wcuf_order_model->read_order_item_meta($item,"_".WCUF_Cart::$sold_as_individual_item_cart_key_name);
			$product_id = $item->get_product_id();
			$variation_id = $item->get_variation_id();
			
			$field_unique_id 		= $product_id."-".$variation_id;
			$field_unique_id 		= $unique_id ? $field_unique_id."-idsai".$unique_id : $field_unique_id;
			$existing_ids[] 		= $field_unique_id;
			$existing_parent_ids[] 	= $product_id;
		}
		
		//Check if the ids stored on session are associated to existing ids
		foreach($uploaded_data as $index => $data)
		{
			$ids = $wcuf_file_model->get_product_ids_and_field_id_by_file_id("order_".$index);	
			if(!$ids["product_id"]) //order uplod 
				continue;
		
			
			$needle = $ids["product_id"]."-".$ids["variant_id"];
			$needle = $ids["unique_product_id"] ? $needle."-idsai".$ids["unique_product_id"] : $needle;
			
			if($ids["variant_id"])
			{
				if(!in_array($needle, $existing_ids))
					$to_remove[$index] = $needle;
			}
			else 
				if(!in_array( $ids["product_id"], $existing_parent_ids))
					$to_remove[$index] = $needle;
		}
		
		//Removing ghosts
		foreach($to_remove as $index_to_remove => $id)
		{
			$uploaded_data = $wcuf_file_model->delete_file($index_to_remove, $uploaded_data, $order_id);
		}
			
		return !empty($to_remove);
	}
	public function save_uploaded_files_meta_data_to_order($order_id, $file_order_metadata)
	{
		$this->delete_post_meta( $order_id, '_wcst_uploaded_files_meta'); //old and wrong meta is deleted
		$this->update_post_meta( $order_id, '_wcuf_uploaded_files', $file_order_metadata);
	}
	public function delete_uploaded_files_meta_data_by_order_id($order_id)
	{
		$this->delete_post_meta( $order_id, '_wcst_uploaded_files_meta');
		$this->delete_post_meta( $order_id, '_wcuf_uploaded_files');
	}
	public function get_num_uploaded_files($order_id, $upload_field_id = 'none', $max_uploaded_files_number_considered_as_sum_of_quantities = false)
	{
		$result = $this->get_uploaded_files_meta_data_by_order_id($order_id);
		$total = 0;
		//wcuf_var_dump($result);
		foreach((array)$result as $upload_field_id_key => $meta)
				if($upload_field_id == 'none' || $upload_field_id == $upload_field_id_key)
				{
					if($max_uploaded_files_number_considered_as_sum_of_quantities)
						foreach((array)$meta["quantity"] as $quantity)
							$total +=  intval($quantity);
					else
						$total += isset($meta['original_filename']) && is_array($meta['original_filename']) ? count($meta['original_filename']) : 0;
				}
		return $total;
	}
	public function get_num_uploaded_files_in_session($upload_field_id, $max_uploaded_files_number_considered_as_sum_of_quantities)
	{
		global $wcuf_session_model;
		$number = 0;
		$data = $wcuf_session_model->get_item_data($upload_field_id);
		if(!isset($data) || !isset($data["tmp_name"]))
			return $number;
		
		foreach((array)$data["quantity"] as $uploaded_files)
		{
			$number += $max_uploaded_files_number_considered_as_sum_of_quantities ? intval($uploaded_files) : 1;
		}
			
		return $number;
	}
	public function is_upload_field_content_managed_as_zip($file_meta) //old multiple files upload were managed as single zip file
	{
		return isset($meta['original_filename']) && is_array($file_meta['original_filename']) && !isset($file_meta['is_multiple_file_upload']) ? true : false;
	}
	public function is_dropbox_stored($file_meta)
	{
		return wcuf_is_dropbox_file_path($file_meta['absolute_path']);
	}
	public function is_upload_field_content_managed_as_multiple_files($file_meta)
	{
		return isset($file_meta['original_filename']) && isset($file_meta['is_multiple_file_upload']) ? $file_meta['is_multiple_file_upload'] : false;
	}	
	public function get_secure_urls($order_id, $id, $uploaded_metadata)
	{
		global $wcuf_order_model;
		if($id != 'none')
		{
			if(!wcuf_get_value_if_set($uploaded_metadata, array($id, 'url'), false))
				return "#";
		}
		else 
		{
			if(!wcuf_get_value_if_set($uploaded_metadata, 'url', false))
				return "#";
		}
			
		
		global $wcuf_option_model, $wcuf_file_model;
		$order = wc_get_order($order_id);
		$secure_links = $wcuf_option_model->get_all_options('secure_links', false);
		$wcuf_file_model->manage_access_to_order_folder($wcuf_order_model->get_order_number_folder_name($order), $secure_links);
		if($secure_links)
		{
			
			//on the view order template that data structure might not be an array -> it is an order upload field type
			if($id != 'none')
				$metadata = is_array($uploaded_metadata[$id]['url']) ? $uploaded_metadata[$id]['url'] : array($uploaded_metadata[$id]['url']);
			else 
			{
				$metadata = is_array($uploaded_metadata['url']) ? $uploaded_metadata['url'] : array($uploaded_metadata['url']);
				$id = $uploaded_metadata['id'];
			}
			
			$data_to_return = array();
			foreach($metadata as $index => $upload_metadata)
				$data_to_return[$index] = get_site_url()."?wcuf_order_id={$order_id}&wcuf_upload_id={$id}&wcuf_index={$index}";
				
			return $data_to_return;
		}
		
		return $id != 'none' ? $uploaded_metadata[$id]['url'] : $uploaded_metadata['url'];
	}
	public function can_be_zip_file_created_upload_field_content($file_meta)
	{
		$result = array();
		$counter = 0;
		
		if(is_array($file_meta['source']) && class_exists('ZipArchive'))
			foreach($file_meta['source'] as $index => $source)
			{
				if($source == 'local')
					$result[] = array(	'path'		=> $file_meta['absolute_path'][$index], 
										'name'		=> $file_meta['original_filename'][$index],
										'title'		=> $file_meta['title'],
										'all_meta'	=> $file_meta
									);
					
			}
		
		return $result;
	}
}
?>