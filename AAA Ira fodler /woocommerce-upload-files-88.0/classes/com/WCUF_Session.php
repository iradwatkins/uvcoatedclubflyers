<?php 
class WCUF_Session
{
	var $current_session_id;
	var $timeout_duration = 3600; //1200: 60 min
	var $use_alternative_method_for_session_management = false;
	var $session_array_keys = array('quantity', //shared
									'tmp_name', 'name',  'file_temp_name', 'crop_metadata', 'crop_remote_url', 'crop_remote_file' //Session
									 ); 
	var $order_array_keys = array('quantity', 'absolute_path', 'url', 'original_filename', 'source', 'ID3_info', 'crop_metadata', 'crop_remote_url', 'crop_remote_file');
	public function __construct()
	{
		//add_filter( 'wc_session_expiring', array( &$this, 'session_expiring' ), 10 ,1);
		add_action( 'wp_loaded', array( &$this, 'manage_session' )); //it was 'init' action. changed to 'wp_loaded' due to the product cart removal feature
		add_action('wp_logout', array( &$this, 'clear_session_data' ));
	}
	public function manage_session() 
	{
		global $wcuf_file_model, $wcuf_option_model;
		$time = $_SERVER['REQUEST_TIME'];
		$this->timeout_duration = isset($wcuf_option_model) ? $wcuf_option_model->get_all_options('temp_files_clear_interval') : 1200; //20 min
		$this->use_alternative_method_for_session_management = isset($wcuf_option_model) ? $wcuf_option_model->get_all_options('session_id_alternative_method') : false;
		
		
		
		//Current session method
		$this->set_customer_unique_id();
		
		/* Old method, it uses the PHP session
			$this->current_session_id = session_id();
			if(empty($this->current_session_id))
			{
				$this->create_session();
			}
			//Session: read
			$last_activity = $this->get_last_activity();
			if (isset($last_activity) && ($time - $last_activity) > $this->timeout_duration) 
			{
				//not used anymore: $this->clear_session_data();
				$this->create_session();
			}
		
		
			//(is now included in the more efficient delete_expired_sessions() metod)
			//$wcuf_file_model->delete_expired_sessions_files($this->timeout_duration, $last_activity);
		*/
	
		$this->delete_expired_sessions();
		
		//Session: updates the current session DB row (if not exists, it will be created)		
		$this->update_session($time);
	}
	private function set_customer_unique_id()
	{
		if($this->use_alternative_method_for_session_management)
		{
			$wc_session = WC()->session;
			if(is_null($wc_session) || !$wc_session->has_session( ))
			{
				$this->current_session_id = wp_get_session_token(); //used for the wp-admin area
				return;
			}
			else
			{
				$this->current_session_id = $wc_session->get_customer_unique_id();
			} 
			if(empty($this->current_session_id) || !$this->current_session_id)
				$this->create_session(); //old method that relies on PHP session
		
		}
		else 
			$this->create_session();
		return;
	}
	private function delete_expired_sessions()
	{
		global $wcuf_db_model, $wcuf_option_model, $wcuf_file_model, $wcuf_cart_model;
		$results = $wcuf_db_model->delete_expired_sessions($this->timeout_duration);
		if(!empty($results))
		{
			foreach($results as $result)
			{
				$data = unserialize($result->item);
				
				if(is_array($data))
					foreach($data as $upload_data)
						if(isset($upload_data) && is_array($upload_data))
							foreach($upload_data as $upload_data_details)
							{
								$id = $upload_data_details["upload_field_id"];
								$proruct_data = $wcuf_file_model->get_product_ids_and_field_id_by_file_id($id);
								
								//Remove associated product from cart only if some files were uploaded
								if(!empty($upload_data_details["tmp_name"]))
									$wcuf_cart_model->remove_item_from_cart($proruct_data["unique_product_id"], $proruct_data["product_id"], $proruct_data["variant_id"]);
								
								foreach($upload_data_details["tmp_name"] as $file_to_delete_path)
									 $wcuf_file_model->delete_local_file($file_to_delete_path);
							}
					
				
			}
			//To avoid that some "chuck" of file remains. This might happen when upload are interrupted
			$wcuf_file_model->delete_expired_sessions_files($this->timeout_duration,  $this->get_last_activity());
		}
	}
	//old session method used to generate an unique id
	private function create_session($wc_session = null)
	{
		global $wcuf_db_model;
		
		$this->current_session_id = session_id(); //old method: get_current_user_id();
		if (!$this->current_session_id) //Guest users
		{
			$this->current_session_id = session_id();
			if (!$this->current_session_id) 
				try 
				{
					//@session_unset();     
					@session_start();
				}catch (Exception $e) {}
			
			$this->current_session_id = session_id(); 	//alternative: wp_get_session_token	
			@session_write_close();  
		}
		
		$wcuf_db_model->create_session_row($this->current_session_id);
	}
	private function get_last_activity()
	{
		global $wcuf_db_model;
		return $wcuf_db_model->read_session_row('last_activity', $this->current_session_id);
	}
	private function update_session($time = null)
	{
		global $wcuf_db_model;
		$time = !isset($time) ? time() : $time;
		
		//Session: updates the session (creating it if not existing)
		$wcuf_db_model->write_session_row('last_activity', $time , $this->current_session_id);
	}
	private function get_data_from_session($session_type)
	{
		global $wcuf_db_model;
		$result = $wcuf_db_model->read_session_row('item', $this->current_session_id);
		$result = !isset($result) ? array() : unserialize($result);
	
		return isset($result[$session_type]) ? $result[$session_type] : array();
	}
	private function save_data_into_session($data, $session_type)
	{
		global $wcuf_db_model;
		$wcuf_db_model->write_session_row('item', $data, $this->current_session_id, $session_type);
		$wcuf_db_model->write_session_row('session_type', $session_type,$this->current_session_id); //session_type no more usefull
	}
	private function delete_items_from_session($session_type = null)
	{
		global $wcuf_db_model;
		$wcuf_db_model->delete_session_row($this->current_session_id, $session_type);
	}
	//not used anymore
	public function clear_session_data( )
	{
		global $wcuf_db_model;
	
		$this->remove_item_data();
		$this->remove_item_data(null, false);
		
		//new
		$this->delete_items_from_session();
		$this->create_session();
	}
	
	
	/*Format:
		array(2) {
	  ["wcufuploadedfile_3-59-60"]=>
	  array(5) {
		["name"]=>
		string(9) "test2.pdf"
		["type"]=>
		string(22) "application/x-download"
		["tmp_name"]=>
		string(113) "/var/.../wp-content/uploads/wcuf/tmp/34225430759"
		["error"]=>
		int(0)
		["size"]=>
		int(85996)
	  }
  */
	function assign_uploads_to_unique_item($product_id, $variation_id,$unique_cart_item_key)
	{
		global $wcuf_option_model;
		
		$file_fields_groups = $wcuf_option_model->get_fields_meta_data();
		foreach($file_fields_groups as $file_fields)
		{
			$key = $variation_id != 0 ? "wcufuploadedfile_".$file_fields['id']."-".$product_id."-".$variation_id : "wcufuploadedfile_".$file_fields['id']."-".$product_id;
			$all_data = $this->get_data_from_session('_wcuf_temp_uploads');
			if(isset($all_data[$key]))
			{
				$new_key = "wcufuploadedfile_".$file_fields['id']."-".$product_id."-".$variation_id."-".$unique_cart_item_key;
				$all_data[$new_key] =  $all_data[$key];
				unset($all_data[$key]);
				$this->save_data_into_session($all_data, '_wcuf_temp_uploads');
			}
		}
	}
	function update_feedback($key, $feedback, $is_order_details = false)
	{
		$session_key = !$is_order_details ? '_wcuf_temp_uploads' : '_wcuf_temp_uploads_on_order_details_page'; //No need: for order details page feedback must be updated directly modifing the order meta
		$data = $this->get_data_from_session($session_key);
		
		$data[$key]['user_feedback'] =  wp_strip_all_tags($feedback);
		$this->save_data_into_session($data,$session_key);
	}
	//TM WooCommerce TM Extra Product Options: checks if the item has been edited
	function tm_on_add_to_cart()
	{
		$tmp_session_data =  $this->get_item_data();
		if(!$tmp_session_data)
			return;
		foreach($tmp_session_data as $key => $tmp_data)
		{
			$to_remove = wcuf_get_value_if_set($tmp_data, 'tm_replaced_id_to_remove', false);
			if($tmp_data)
			{
				$tmp_session_data[$key]['tm_is_temp_upload'] = false;
				unset($tmp_session_data[$to_remove]);
			}
			
		}
		$this->save_data_into_session($tmp_session_data, '_wcuf_temp_uploads');
	}
	//TM WooCommerce TM Extra Product Options: before saving upload metadata on order metadata, the plugin checks if there are temporarly data (created during and edit process that was not properly ended) and remove it
	function tm_before_saving_meta_on_order()
	{
		$tmp_session_data =  $this->get_item_data();
		if(!$tmp_session_data)
			return;
		foreach($tmp_session_data as $key => $tmp_data)
		{
			$tm_is_temp_upload = wcuf_get_value_if_set($tmp_data, 'tm_is_temp_upload', false);
			if($tm_is_temp_upload)
			{
				unset($tmp_session_data[$key]);
			}
			
		}
		$this->save_data_into_session($tmp_session_data, '_wcuf_temp_uploads');
	}
	function set_item_data(  $key, $value, $file_already_moved = false, $is_order_details = false, $num_uploaded_files = 1, $ID3_info = null, $merge = true) 
	{
		global $wcuf_file_model;
		$session_key = !$is_order_details ? '_wcuf_temp_uploads' : '_wcuf_temp_uploads_on_order_details_page';
		
		if(!$value)
			return;
		
		$this->update_session();
		//Session: read
		
		$data = $this->get_data_from_session($session_key );
		
		$is_multiple_file_upload = isset($value['tmp_name']) && is_array($value['tmp_name']) && count($value['tmp_name']) > 1;
		if ( empty( $data[$key] ) ) 
		{
			$data[$key] = array();
		}
		else
		{
			
			
		}
		if(!$file_already_moved)
		{
			$results = $wcuf_file_model->move_temp_file($value['tmp_name']);
			
			$value['tmp_name'] = array();
			$value['file_temp_name'] = array();
			foreach($results as $index => $result)
			{
				$value['tmp_name'][$index] = $result['absolute_path'];
				$value['file_temp_name'][$index] = $result['file_temp_name'];
			}
		}
		 
		$value['title'] = !$merge ? wcuf_get_value_if_set($value, 'title', "") : wcuf_get_value_if_set($_POST, 'title', "") ;
		$value['is_multiple_file_upload'] = $is_multiple_file_upload;
		$value['num_uploaded_files'] = $num_uploaded_files;
		$value['user_feedback'] = isset($_POST['user_feedback']) && $_POST['user_feedback'] != 'undefined' ? stripcslashes($_POST['user_feedback']):"";
		$value['user_feedback'] = wp_strip_all_tags($value['user_feedback']);
		$value['ID3_info'] = isset($ID3_info) && !empty($ID3_info) ? $ID3_info: "none";
		
		$data[$key] = $merge ? $this->merge_item_data_arrays($data[$key], $value) : $value;
	
		$this->save_data_into_session($data,$session_key);
	}
	public function set_item_data_from_meta($data)
	{
		$this->save_data_into_session($data,'_wcuf_temp_uploads');
	}
	public function merge_item_data_arrays($item_1, $item_2, $is_order = false)
	{
		if(empty($item_1))
			return $item_2;
		
		$array_key_to_merge = $is_order ? $this->order_array_keys : $this->session_array_keys ; //array('tmp_name', 'name', 'quantity', 'file_temp_name');
		$array_key_to_merge = apply_filters('wcuf_key_to_merge', $array_key_to_merge, $is_order);
		
		//Base index computation
		$base_index =  0;
		if(isset($item_1['quantity']))
		{
			foreach((array)$item_1['quantity'] as $tmp_index => $tmp_quantity)
				$base_index = $tmp_index > $base_index ? $tmp_index : $base_index;
			$base_index++;
		}
		foreach($array_key_to_merge as $key)
			if(isset($item_2[$key]) && $key != 'ID3_info')
				foreach((array)$item_2[$key] as $elem_index => $elem)
				{
					//wcuf_write_log("Merging: ".$key.", base index: ".$base_index.", elem index: ".$elem_index);
					if(!isset($item_1[$key]))
						$item_1[$key] = array();
					$item_1[$key][$base_index + $elem_index] = $elem;
				}
			
		
		$item_1['num_uploaded_files'] = isset($item_1['num_uploaded_files']) ? $item_1['num_uploaded_files'] + $item_2['num_uploaded_files'] : $item_2['num_uploaded_files'];
		$item_1['user_feedback'] = isset($item_2['user_feedback']) ? $item_2['user_feedback'] : "";
		$item_1['is_multiple_file_upload'] = is_array($item_2['quantity']) && count($item_2['quantity']) > 0 ? true : false; //$item_2['is_multiple_file_upload'];
		$item_1['ID3_info'] = isset($item_1['ID3_info']) ? $item_1['ID3_info'] : "none";
		$item_1['upload_field_id'] = isset($item_1['upload_field_id']) ? $item_1['upload_field_id'] : -1;
		$item_1['upload_field_id'] = isset($item_2['upload_field_id']) ? $item_2['upload_field_id'] : $item_1['upload_field_id'];
		$item_1['is_pdf'][] = is_array($item_2['is_pdf']) ? $item_2['is_pdf'][0] : $item_2['is_pdf'];
		$item_1['disable_cart_quantity_as_num_of_files'] = $item_2['disable_cart_quantity_as_num_of_files'];
		
		/* No need to pass approval data via ajax, they will be computed according to current settings
		$item_1['enable_approval'] = $item_2['enable_approval'];
		$item_1['disable_approval_per_single_file'] = $item_2['disable_approval_per_single_file']; 
		$item_1['status'] = "waiting-for-approval"; //in this stage, if saved on session, it means that admin must still approve/reject it
		*/
		$item_1['number_of_pages'][] = is_array($item_2['number_of_pages']) ? $item_2['number_of_pages'][0] : $item_2['number_of_pages'] ;
		
		//ID3_info: is an array in which $key = id of the uploaded file (num_file). The id is computed by iterating the $item_1 length + $item_2 current item index.
		if($item_2['ID3_info'] != 'none')
		{
			$item_1['ID3_info'] = is_array($item_1['ID3_info']) ? $item_1['ID3_info'] : array();
			foreach($item_2['ID3_info'] as $id3_key => $id3_info)
			{
				$item_1['ID3_info'][$base_index + $id3_key] = $id3_info;
				$item_1['ID3_info'][$base_index + $id3_key]['index'] = $base_index + $id3_key;
			}
		}
		
		return $item_1;
	}
	public function get_item_data( $key = null, $default = null, $is_order_details = false ) 
	{
		$session_key = !$is_order_details ? '_wcuf_temp_uploads' : '_wcuf_temp_uploads_on_order_details_page';
		
		$data = $this->get_data_from_session($session_key );
		$to_return = null;
		//Debug: data loaded from session
		//wcuf_var_dump($data);
		
		//Sanatization: in case bad data has been stored in the session. It will be deleted on session timeout
		if(is_array($data))
			foreach($data as $unique_key => $value)
			{
				if(!isset($value['tmp_name']))
					unset($data[$unique_key]);
			}
		
		if ( $key == null ) 
			$to_return = isset($data) && !empty($data) ? $data : $default;
		else
			$to_return = empty( $data[$key] ) ? $default : $data[$key];
					
		return is_array($to_return) && empty($to_return) ? $default : $to_return;
	}
	function remove_data_by_product_ids($cart_item)
	{
		global $wcuf_file_model, $wcuf_product_model;
		$id = "-".$cart_item['product_id'];
		if($cart_item['variation_id'] !=0)
			$id .= "-".$cart_item['variation_id'];
		
		$all_data = $this->get_item_data();
		if(isset($all_data))
		{
			foreach($all_data as $fieldname_id => $item)
			{
				if($this->endsWith($fieldname_id, $id) || $this->contains($fieldname_id, $id."-"))
					$this->remove_item_data($fieldname_id);
			}
		}
	}
	function remove_all_item_data_by_unique_key($product_id, $variation_id, $unique_key = false, $is_order_details = false )
	{
		global $wcuf_session_model;
		$complete_item_id = $unique_key !== false ? $product_id."-".$variation_id."-idsai".$unique_key : $product_id."-".$variation_id;
		$all_data = $this->get_item_data();
		if(isset($all_data))
			foreach($all_data as $fieldname_id => $item)
			{
				if($this->contains($fieldname_id, $complete_item_id))
				{
					$wcuf_session_model->remove_item_data($fieldname_id);
				}
			}
	}
	function remove_all_item_data($field_id, $product_id = null, $variation_id = null)
	{
		//wcuf_var_dump("remove_all_item_data");
		$this->remove_item_data("wcufuploadedfile_".$field_id);
		if(isset($product_id))
			$this->remove_item_data("wcufuploadedfile_".$field_id."-".$product_id);
		if(isset($variation_id))
			$this->remove_item_data("wcufuploadedfile_".$field_id."-".$product_id."-".$variation_id);
	}
	public function remove_item_data( $key = null, $is_order_details = false, $extra_options = array()) 
	{
		global $wcuf_file_model;
		$session_key = !$is_order_details ? '_wcuf_temp_uploads' : '_wcuf_temp_uploads_on_order_details_page';
		
		//Session: read
		$data = $this->get_data_from_session($session_key );
		// If no item is specified, delete *all* item data. This happens when we clear the cart (eg, completed checkout)
		
		if ( $key == null ) 
		{
			if(isset($data))
				foreach((array)$data as $temp_file_data)
					if(!wcuf_get_value_if_set($extra_options,'skip_delete_file', false))
						$wcuf_file_model->delete_temp_file($temp_file_data['tmp_name']);
			
			//Session: write
			$this->delete_items_from_session($session_key);
			return;
		}
		// If item is specified, but no data exists, just return
		if ( !isset( $data[$key] ) ) 
		{
			return;
		}
		else 
		{
			if(!wcuf_get_value_if_set($extra_options,'skip_delete_file', false))
				$wcuf_file_model->delete_temp_file($data[$key]['tmp_name']);
			unset( $data[$key] );
		}
		
		//Session: write
		$this->save_data_into_session($data,$session_key);
	} 
	public function remove_upload_field_subitem($field_id, $single_file_id, $extra_options = array())
	{
		global $wcuf_file_model;
		$data = $this->get_data_from_session('_wcuf_temp_uploads' );
		if(!isset($data[$field_id]))
			return;
		
		//file delete
		if(!wcuf_get_value_if_set($extra_options,'skip_delete_file', false))
			$wcuf_file_model->delete_temp_file($data[$field_id]['tmp_name'][$single_file_id]);
		unset($data[$field_id]['tmp_name'][$single_file_id]);
		
		if(isset($data[$field_id]['num_uploaded_files']) && $data[$field_id]['num_uploaded_files'] > 0)
			$data[$field_id]['num_uploaded_files'] -= 1;
		
		$result = $this->remove_subitem_from_session_array($data[$field_id], $single_file_id);
		if($result == null)
			unset($data[$field_id]);
		else 
			$data[$field_id] = $result;
			
		$this->save_data_into_session($data,'_wcuf_temp_uploads' );
	}
	public function remove_subitem_from_session_array($array, $index_to_remove)
	{
		if(!isset($array))
			return null;
		
		$key_to_delete 	= array_merge($this->session_array_keys, $this->order_array_keys);
		$key_to_delete	= apply_filters('wcuf_session_key_to_delete', $key_to_delete);
		
		foreach($key_to_delete as $key_name)
		{
			if(is_array($array) && isset($array[$key_name]) && is_array($array[$key_name]) && isset($array[$key_name][$index_to_remove]))
				unset($array[$key_name][$index_to_remove]);
		}
		
		//returs null if the upload field is empty (last element was deleted)
		if(empty($array['quantity']))
			return null;
		
		return $array;
	}
	public function endsWith($haystack, $needle) 
	{
		return $needle === "" || (($temp = strlen($haystack) - strlen($needle)) >= 0 && strpos($haystack, $needle, $temp) !== FALSE);
	}
	public function contains($haystack, $needle) 
	{
		return $needle === "" || (strpos($haystack, $needle) !== false);
	}
}
?>