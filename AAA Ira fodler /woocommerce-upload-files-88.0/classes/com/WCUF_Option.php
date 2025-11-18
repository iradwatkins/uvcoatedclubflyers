<?php  
class WCUF_Option
{
	var $general_options;
	var $individual_producs_options;
	var $order_status_change_options;
	var $css_options;
	var $crop_options;
	public function __construct()
	{
	}
	public function get_asset_time()
	{
		$asset_time =  get_option( 'wcuf_asset_time' );
		if(!isset($asset_time) || $asset_time == false)
		{
			$asset_time = time();
			$this->update_option( 'wcuf_asset_time', $asset_time);
		}
		return  $asset_time;
	}
	public function set_asset_time($time)
	{
		$this->update_option( 'wcuf_asset_time', $time);
	}
	public function update_dropbox_token_data($token, $expire_in)
	{
		$date = date('Y-m-d H:i:s', (time() + $expire_in));
		
		$this->update_option( 'wcuf_dropbox_token_data', array('token'=> $token, 'expiring_datetime'=> $date));
	}
	public function get_dropbox_token_data()
	{
		return $this->get_option('wcuf_dropbox_token_data');
	}
	public function update_gdrive_token_data($access_token, $refresh_token, $auth_code)
	{
		//$date = date('Y-m-d H:i:s', (time() + $expire_in));
		$this->update_option( 'wcuf_gdrive_token_data', array('access_token'=> $access_token, 'refresh_token' => $refresh_token, 'auth_code' => $auth_code));
	}
	public function get_gdrive_token_data()
	{
		$data = $this->get_option('wcuf_gdrive_token_data');
		return $data && $data['access_token'] ? $data : false;
	}
	public function get_asset_version()
	{
		$version =  get_option( 'wcuf_asset_version' );
		if(!isset($version) || $version == false)
		{
			$version = 0;
			$this->update_option( 'wcuf_asset_time', 0);
		}
		return  $version;
	}
	public function set_asset_version($version)
	{
		$this->update_option( 'wcuf_asset_version', $version);
	}
	public function get_fields_meta_data($key_sort = true)
	{
		global $wcuf_wpml_helper;
		$fields =  get_option( 'wcuf_files_fields_meta' );
		$php_settings =  $this->get_php_settings();
		
		if (isset($fields)&& $fields != false)
		{
			global $sitepress,$wcuf_wpml_helper;
			foreach($fields as $key => $extra_field)
			{
				//WPML 
				$translations = $wcuf_wpml_helper->translate_single_string($extra_field['id'], $fields[$key]);
				if($translations != false)
				{
					$fields[$key]['title'] =     $translations['title'];
					$fields[$key]['description'] = 	$translations['description'];
					$fields[$key]['message_already_uploaded'] =  $translations['message_already_uploaded'];
					$fields[$key]['text_field_label'] =  $translations['text_field_label'];
					$fields[$key]['text_field_description'] =  $translations['text_field_description'];
					$fields[$key]['disclaimer_text'] =  $translations['disclaimer_text'];
					$fields[$key]['extra_cost_fee_description'] =  $translations['extra_cost_fee_description'];
					$fields[$key]['extra_cost_media_fee_description'] =  $translations['extra_cost_media_fee_description'];
				}
				
				//SECURITY
				//To avoid uploading number of values denied by php.ini: NO LONGER NEED, files are no more uploaded in bulk
				$fields[$key]['multiple_uploads_max_files'] =  $extra_field['multiple_uploads_max_files'];
			}
		}
		
		if($key_sort && is_array($fields))
		{
			$result = array();
			foreach($fields as $data)
				$result[$data["id"]] = $data;
				
			$fields = $result;
		}
		
		return  $fields;
	}
	public function get_php_settings($setting_name = null)
	{
		$result = array();
		$result['post_max_size'] = ini_get('post_max_size');
		$result['upload_max_filesize'] = ini_get('upload_max_filesize');
		$result['max_file_uploads'] = ini_get('max_file_uploads');
		
		$result['size_that_can_be_posted'] = $result['post_max_size'] < $result['upload_max_filesize'] ? $result['post_max_size'] : $result['upload_max_filesize'];
		
		return isset($setting_name) && isset($result[$setting_name]) ? $result[$setting_name] : $result;
	}
	public function get_option($option_name)
	{
		return get_option($option_name);
	}
	public function save_bulk_options($wcup_file_meta)
	{
		$file_metas = array();
		$last_id = $current_last_id = 0;
		$file_fields_meta = null;
		
		if(isset($wcup_file_meta))
		{
			$counter = 0; 
			$current_last_id = 0; 
			$last_id = $this->get_option('wcuf_last_file_id');
			$last_id = !isset($last_id) ? 0 :$last_id;
			$ids_deleted = array(); //used for WPML
			for($i = 0; $i <= $last_id; $i++)
				$ids_deleted[$i] = true;
			
			$old_file_meta = $this->get_fields_meta_data();
			$fields_to_delete = array();
			if($old_file_meta)
				foreach($old_file_meta as $old_meta)
					$fields_to_delete[$old_meta['id']] = true;
				
		
			foreach($wcup_file_meta as $file_meta)
			{
				if(isset($file_meta['id']))
				{
					if($old_file_meta)
						$fields_to_delete[$file_meta['id']] = false;
					
					
					$category_ids = array();
					$products_ids = array();
					$attributes_ids = array();
					$enable_for = isset($file_meta['enable_for']) ? $file_meta['enable_for'] : 'always';
					if($enable_for != 'always' && isset($file_meta['categories'] ))
					{
						
						if(isset($file_meta['categories'] ))
							$category_ids =  $file_meta['categories'];
					}
					if($enable_for != 'always' && isset($file_meta['products']))
						$products_ids =  $file_meta['products'];
					if($enable_for != 'always' && isset($file_meta['attributes']))
						$attributes_ids =  $file_meta['attributes'];
					
					$file_meta['hide_upload_after_upload'] = !isset($file_meta['hide_upload_after_upload']) ?  false:true;
					$file_meta['can_delete_order_status'] = !isset($file_meta['can_delete_order_status']) ?  false:$file_meta['can_delete_order_status']; 
					$file_meta['user_can_delete'] = !isset($file_meta['user_can_delete']) ?  false:$file_meta['user_can_delete'];
					$file_meta['user_can_download_his_files'] = !isset($file_meta['user_can_download_his_files']) ?  false:$file_meta['user_can_download_his_files'];
					$file_meta['hide_extra_info'] = !isset($file_meta['hide_extra_info']) ?  false:$file_meta['hide_extra_info'];
					$file_meta['disable_product_cart_quantity_option'] = !isset($file_meta['disable_product_cart_quantity_option']) ?  false:$file_meta['disable_product_cart_quantity_option'];
					$file_meta['toggle_autoupload'] = !isset($file_meta['toggle_autoupload']) ?  false:$file_meta['toggle_autoupload'];
					$file_meta['upload_fields_editable_for_completed_orders'] = !isset($file_meta['upload_fields_editable_for_completed_orders']) ?  false:true;
					$file_meta['sort_order'] = !isset($file_meta['sort_order']) ?  0:$file_meta['sort_order'];
					$file_meta['full_name_display'] = !isset($file_meta['full_name_display']) ?  false:$file_meta['full_name_display'];
					$file_meta['display_simple_product_name_with_attributes'] = !isset($file_meta['display_simple_product_name_with_attributes']) ?  false:$file_meta['display_simple_product_name_with_attributes'];
					//emails
					$file_meta['notify_admin'] = !isset($file_meta['notify_admin']) ?  false:$file_meta['notify_admin'];
					$file_meta['notify_attach_to_admin_email'] = !isset($file_meta['notify_attach_to_admin_email']) ?  false:$file_meta['notify_attach_to_admin_email'];
					$file_meta['email_attach_files_to_new_order'] = !isset($file_meta['email_attach_files_to_new_order']) ?  false:$file_meta['email_attach_files_to_new_order'];
					$file_meta['email_embed_files_to_new_order'] = !isset($file_meta['email_embed_files_to_new_order']) ?  "no":$file_meta['email_embed_files_to_new_order'];
					//display
					$file_meta['display_on_checkout'] = !isset($file_meta['display_on_checkout']) ?  false:$file_meta['display_on_checkout'];
					$file_meta['display_on_cart'] = !isset($file_meta['display_on_cart']) ?  false:$file_meta['display_on_cart'];
					$file_meta['display_on_product'] = !isset($file_meta['display_on_product']) ?  false:$file_meta['display_on_product'];
					$file_meta['display_on_product_before_adding_to_cart'] = !isset($file_meta['display_on_product_before_adding_to_cart']) ?  false:$file_meta['display_on_product_before_adding_to_cart'];
					$file_meta['display_on_thank_you'] = !isset($file_meta['display_on_thank_you']) ?  false:$file_meta['display_on_thank_you'];
					$file_meta['display_on_order_detail'] = !isset($file_meta['display_on_order_detail']) ?  false:$file_meta['display_on_order_detail'];
					$file_meta['hide_on_shortcode_form'] = !isset($file_meta['hide_on_shortcode_form']) ?  false:$file_meta['hide_on_shortcode_form'];
					$file_meta['required_on_checkout'] = !isset($file_meta['required_on_checkout']) ?  false:$file_meta['required_on_checkout'];
					$file_meta['disable_stacking'] = !isset($file_meta['disable_stacking']) ?  false:$file_meta['disable_stacking'];
					$file_meta['enable_multiple_uploads_per_field'] = !isset($file_meta['enable_multiple_uploads_per_field']) ?  false:$file_meta['enable_multiple_uploads_per_field'];
					$file_meta['multiple_uploads_max_files'] = !isset($file_meta['multiple_uploads_max_files']) ?  2 :$file_meta['multiple_uploads_max_files'];
					$file_meta['multiple_uploads_minimum_required_files'] = !isset($file_meta['multiple_uploads_minimum_required_files']) ?  2:$file_meta['multiple_uploads_minimum_required_files'];
					$file_meta['multiple_uploads_max_files_depends_on_quantity'] = !isset($file_meta['multiple_uploads_max_files_depends_on_quantity']) ?  false:$file_meta['multiple_uploads_max_files_depends_on_quantity'];
					$file_meta['multiple_uploads_min_files_depends_on_quantity'] = !isset($file_meta['multiple_uploads_min_files_depends_on_quantity']) ?  false:$file_meta['multiple_uploads_min_files_depends_on_quantity'];
					$file_meta['disable_stacking_for_variation'] = !isset($file_meta['disable_stacking_for_variation']) ?  false:$file_meta['disable_stacking_for_variation'];
					$file_meta['multiple_files_min_size_sum'] = !isset($file_meta['multiple_files_min_size_sum']) ?  0:$file_meta['multiple_files_min_size_sum'];
					$file_meta['multiple_files_max_size_sum'] = !isset($file_meta['multiple_files_max_size_sum']) ?  0:$file_meta['multiple_files_max_size_sum'];
					$file_meta['notifications_recipients'] = !isset($file_meta['notifications_recipients']) ?  "":$file_meta['notifications_recipients'];
					$file_meta['field_css_id'] = !isset($file_meta['field_css_id']) ?  "":$file_meta['field_css_id'];
					//text field
					$file_meta['preview_images_before_upload_disabled'] = !isset($file_meta['preview_images_before_upload_disabled']) ?  false :$file_meta['preview_images_before_upload_disabled'];
					$file_meta['disable_quantity_selector'] = !isset($file_meta['disable_quantity_selector']) ?  false :$file_meta['disable_quantity_selector'];
					$file_meta['text_field_label'] = !isset($file_meta['text_field_label']) ?  "":$file_meta['text_field_label'];
					$file_meta['text_field_description'] = !isset($file_meta['text_field_description']) ?  "":$file_meta['text_field_description'];
					$file_meta['text_field_on_order_details_page'] = !isset($file_meta['text_field_on_order_details_page']) ?  false:$file_meta['text_field_on_order_details_page'];
					$file_meta['text_field_max_input_chars'] = !isset($file_meta['text_field_max_input_chars']) ?  0:$file_meta['text_field_max_input_chars'];
					$file_meta['disclaimer_checkbox'] = !isset($file_meta['disclaimer_checkbox']) ?  false:$file_meta['disclaimer_checkbox'];
					$file_meta['disclaimer_text'] = !isset($file_meta['disclaimer_text']) ?  "":$file_meta['disclaimer_text'];
					$file_meta['is_text_field_on_order_details_page_required'] = !isset($file_meta['is_text_field_on_order_details_page_required']) ?  false:$file_meta['is_text_field_on_order_details_page_required'];
					$file_meta['disable_stacking'] = $file_meta['display_on_product'] ? true : $file_meta['disable_stacking'];
					//Crop
					$file_meta['enable_crop_editor'] = isset($file_meta['enable_crop_editor']) ? true : false;
					$file_meta['crop_mandatory_for_multiple_files_upload'] = isset($file_meta['crop_mandatory_for_multiple_files_upload']) ? true : false;
					$file_meta['crop_auto_adjust'] = isset($file_meta['crop_auto_adjust']) ? true : false;
					$file_meta['crop_use_ratio'] = isset($file_meta['crop_use_ratio']) ? true : false;
					$file_meta['crop_area_type'] = isset($file_meta['crop_area_type']) ? $file_meta['crop_area_type'] : 'square';
					$file_meta['cropped_image_width'] = isset($file_meta['cropped_image_width']) ? $file_meta['cropped_image_width'] : 200;
					$file_meta['cropped_image_height'] = isset($file_meta['cropped_image_height']) ? $file_meta['cropped_image_height'] : 200;
					$file_meta['crop_image_fit_canvas'] = isset($file_meta['crop_image_fit_canvas']) ? true : false;
					$file_meta['crop_enable_compression'] = isset($file_meta['crop_enable_compression']) ? true : false;
					$file_meta['crop_crompression_quality'] = wcuf_get_value_if_set($file_meta, 'crop_crompression_quality',1);
					$file_meta['crop_allow_resize'] = isset($file_meta['crop_allow_resize']);
					//
					$file_meta['min_dpi_limit'] = isset($file_meta['min_dpi_limit']) ? $file_meta['min_dpi_limit'] : 0;
					$file_meta['max_dpi_limit'] = isset($file_meta['max_dpi_limit']) ? $file_meta['max_dpi_limit'] : 0;
					$file_meta['ratio_x'] = isset($file_meta['ratio_x']) ? $file_meta['ratio_x'] : 0;
					$file_meta['ratio_y'] = isset($file_meta['ratio_y']) ? $file_meta['ratio_y'] : 0;
					$file_meta['min_seconds_length'] = isset($file_meta['min_seconds_length']) ? $file_meta['min_seconds_length'] : 0;
					$file_meta['max_seconds_length'] = isset($file_meta['max_seconds_length']) ? $file_meta['max_seconds_length'] : 0;
					$file_meta['consider_sum_of_media_seconds'] = isset($file_meta['consider_sum_of_media_seconds']) ? $file_meta['consider_sum_of_media_seconds'] : false;
					//checkout order total 
					$file_meta['checkout_percentage_enabled'] = !isset($file_meta['checkout_percentage_enabled']) ?  false:$file_meta['checkout_percentage_enabled'];
					$file_meta['checkout_percentage_value'] = !isset($file_meta['checkout_percentage_value']) ?  1:$file_meta['checkout_percentage_value'];
					$file_meta['checkout_percentage_only_once'] = !isset($file_meta['checkout_percentage_only_once']) ?  false:$file_meta['checkout_percentage_only_once'];
					$file_meta['checkout_percentage_description'] = !isset($file_meta['checkout_percentage_description']) ?  false:$file_meta['checkout_percentage_description'];
					//extra costs
					$file_meta['extra_cost_enabled'] = !isset($file_meta['extra_cost_enabled']) ?  false:$file_meta['extra_cost_enabled'];
					$file_meta['extra_cost_as_item_price'] = !isset($file_meta['extra_cost_as_item_price']) ?  false:$file_meta['extra_cost_as_item_price'];
					$file_meta['extra_cost_add_to_item_price'] = !isset($file_meta['extra_cost_add_to_item_price']) ?  false:$file_meta['extra_cost_add_to_item_price'];
					$file_meta['extra_overcharge_type'] = !isset($file_meta['extra_overcharge_type']) ?  false:$file_meta['extra_overcharge_type'];
					$file_meta['extra_cost_value'] = !isset($file_meta['extra_cost_value']) ?  1:$file_meta['extra_cost_value'];
					$file_meta['extra_cost_overcharge_limit'] = !isset($file_meta['extra_cost_overcharge_limit']) || $file_meta['extra_cost_overcharge_limit'] == "" ?  0:$file_meta['extra_cost_overcharge_limit'];
					$file_meta['extra_cost_free_items_number'] = !isset($file_meta['extra_cost_free_items_number']) || $file_meta['extra_cost_free_items_number'] == "" ?  0 :$file_meta['extra_cost_free_items_number'];
					$file_meta['extra_cost_is_taxable'] = !isset($file_meta['extra_cost_is_taxable']) ?  false:$file_meta['extra_cost_is_taxable'];
					$file_meta['extra_cost_detect_pdf'] = !isset($file_meta['extra_cost_detect_pdf']) ?  false:$file_meta['extra_cost_detect_pdf'];
					$file_meta['extra_cost_fee_description'] = !isset($file_meta['extra_cost_fee_description']) ?  false:$file_meta['extra_cost_fee_description'];
					//file approval
					$file_meta['enable_file_approval'] = !isset($file_meta['enable_file_approval']) ?  false:$file_meta['enable_file_approval'];
					$file_meta['disable_file_approval_per_single_file'] = !isset($file_meta['disable_file_approval_per_single_file']) ?  false:$file_meta['disable_file_approval_per_single_file'];
					$file_meta['disable_file_approval_notification'] = !isset($file_meta['disable_file_approval_notification']) ?  false:$file_meta['disable_file_approval_notification'];
					//
					$file_meta['extra_cost_media_enabled'] = !isset($file_meta['extra_cost_media_enabled']) ?  false:$file_meta['extra_cost_media_enabled'];
					$file_meta['extra_cost_media_fee_description'] = !isset($file_meta['extra_cost_media_fee_description']) ?  false:$file_meta['extra_cost_media_fee_description'];
					$file_meta['extra_cost_per_second_value'] = !isset($file_meta['extra_cost_per_second_value']) ?  1:$file_meta['extra_cost_per_second_value'];
					$file_meta['extra_cost_free_seconds'] = !isset($file_meta['extra_cost_free_seconds']) ?  0:$file_meta['extra_cost_free_seconds'];
					$file_meta['extra_costs_consider_sum_of_all_file_seconds'] = !isset($file_meta['extra_costs_consider_sum_of_all_file_seconds']) ?  0:$file_meta['extra_costs_consider_sum_of_all_file_seconds'];
					$file_meta['extra_cost_overcharge_seconds_limit'] = !isset($file_meta['extra_cost_overcharge_seconds_limit']) || $file_meta['extra_cost_overcharge_seconds_limit'] == "" ?  0:$file_meta['extra_cost_overcharge_seconds_limit'];
					$file_meta['extra_cost_media_is_taxable'] = !isset($file_meta['extra_cost_media_is_taxable']) ?  false:$file_meta['extra_cost_media_is_taxable'];
					$file_meta['show_cost_per_second'] = !isset($file_meta['show_cost_per_second']) ?  false:$file_meta['show_cost_per_second'];
					$file_meta['extra_cost_multiply_per_product_cart_quantity'] = !isset($file_meta['extra_cost_multiply_per_product_cart_quantity']) ?  false:$file_meta['extra_cost_multiply_per_product_cart_quantity'];
					//order status 
					$file_meta['order_status'] = !isset($file_meta['order_status']) ?  array():$file_meta['order_status'];
					//date
					$file_meta['time_visibility'] = !isset($file_meta['time_visibility']) ?  array():$file_meta['time_visibility'];
					//roles
					$file_meta['roles'] = !isset($file_meta['roles']) ?  array():$file_meta['roles'];
					$file_meta['roles_policy'] = !isset($file_meta['roles_policy']) ?  "allow":$file_meta['roles_policy'];
					//gateways
					$file_meta['visibility_gateways'] = !isset($file_meta['visibility_gateways']) ?  array():$file_meta['visibility_gateways'];
					$file_meta['shipping_method'] = !isset($file_meta['shipping_method']) ?  array():$file_meta['shipping_method'];
					$file_meta['visibility_payment_gateway_policy'] = !isset($file_meta['visibility_payment_gateway_policy']) ?  "allow":$file_meta['visibility_payment_gateway_policy'];
					//custom
					$file_meta['upload_field_description'] = wcuf_get_value_if_set($file_meta, 'upload_field_description', "");
					
					
					///???????? REFACTOR!!!!!
					array_push($file_metas, array( "id"=> $file_meta['id'], //$counter++,
												  "sort_order"=> $file_meta['sort_order'], 
												  "title"=> strip_tags (stripslashes ($file_meta['title'])), 
												  "description"=>isset($file_meta['description']) ? stripslashes ($file_meta['description']):"",
												  "hide_upload_after_upload"=> $file_meta['hide_upload_after_upload'],
												  "message_already_uploaded"=>isset($file_meta['message_already_uploaded']) ? stripslashes ($file_meta['message_already_uploaded']):"",
												  "allow"=> 'allow',//$file_meta['allow'],
												  "types"=>isset($file_meta['types']) ? $file_meta['types']:null,
												  "size"=>$file_meta['size'],
												  "min_size"=>$file_meta['min_size'],
												  "width_limit"=>$file_meta['width_limit'],
												  "height_limit"=>$file_meta['height_limit'],
												  "min_width_limit"=>$file_meta['min_width_limit'],
												  "min_height_limit"=>$file_meta['min_height_limit'],
												  "dimensions_logical_operator"=>$file_meta['dimensions_logical_operator'],
												  "min_dpi_limit"=>$file_meta['min_dpi_limit'],
												  "max_dpi_limit"=>$file_meta['max_dpi_limit'],
												  "ratio_x"=>$file_meta['ratio_x'],
												  "ratio_y"=>$file_meta['ratio_y'],
												  "min_seconds_length"=>$file_meta['min_seconds_length'],
												  "max_seconds_length"=>$file_meta['max_seconds_length'],
												  "consider_sum_of_media_seconds"=>$file_meta['consider_sum_of_media_seconds'],
												  "enable_crop_editor"=>$file_meta['enable_crop_editor'],
												  "crop_mandatory_for_multiple_files_upload"=>$file_meta['crop_mandatory_for_multiple_files_upload'],
												  "crop_auto_adjust"=>$file_meta['crop_auto_adjust'],
												  "crop_use_ratio"=>$file_meta['crop_use_ratio'],
												  "crop_area_type"=>$file_meta['crop_area_type'],
												  "cropped_image_width"=>$file_meta['cropped_image_width'],
												  "cropped_image_height"=>$file_meta['cropped_image_height'],
												  "crop_image_fit_canvas"=>$file_meta['crop_image_fit_canvas'],
												  "crop_enable_compression"=>$file_meta['crop_enable_compression'],
												  "crop_crompression_quality"=>$file_meta['crop_crompression_quality'],
												  "crop_allow_resize"=>$file_meta['crop_allow_resize'],
												  "user_can_delete" => $file_meta['user_can_delete'],
												  "can_delete_order_status" => $file_meta['can_delete_order_status'],
												  "user_can_download_his_files" => $file_meta['user_can_download_his_files'],
												  "hide_extra_info" => $file_meta['hide_extra_info'],
												  "disable_product_cart_quantity_option" => $file_meta['disable_product_cart_quantity_option'],
												  "toggle_autoupload" => $file_meta['toggle_autoupload'],
												  "upload_fields_editable_for_completed_orders" => $file_meta['upload_fields_editable_for_completed_orders'],
												  "full_name_display" => $file_meta['full_name_display'],
												  "display_simple_product_name_with_attributes" => $file_meta['display_simple_product_name_with_attributes'],
												  "notify_admin" => $file_meta['notify_admin'],
												  "notify_attach_to_admin_email" => $file_meta['notify_attach_to_admin_email'],
												  "email_attach_files_to_new_order" => $file_meta['email_attach_files_to_new_order'],
												  "email_embed_files_to_new_order" => $file_meta['email_embed_files_to_new_order'],
												  "disable_stacking" => $file_meta['disable_stacking'],
												  "enable_multiple_uploads_per_field" => $file_meta['enable_multiple_uploads_per_field'],
												  "multiple_uploads_max_files" => $file_meta['multiple_uploads_max_files'],
												  "multiple_uploads_minimum_required_files" => $file_meta['multiple_uploads_minimum_required_files'],
												  "multiple_uploads_max_files_depends_on_quantity" => $file_meta['multiple_uploads_max_files_depends_on_quantity'],
												  "multiple_uploads_min_files_depends_on_quantity" => $file_meta['multiple_uploads_min_files_depends_on_quantity'],
												  "disable_stacking_for_variation" => $file_meta['disable_stacking_for_variation'],
												  "multiple_files_min_size_sum" => $file_meta['multiple_files_min_size_sum'],
												  "multiple_files_max_size_sum" => $file_meta['multiple_files_max_size_sum'],
												  "display_on_checkout" => $file_meta['display_on_checkout'],
												  "display_on_cart" => $file_meta['display_on_cart'],
												  "display_on_product" => $file_meta['display_on_product'],
												  "display_on_product_before_adding_to_cart" => $file_meta['display_on_product_before_adding_to_cart'],
												  "display_on_thank_you" => $file_meta['display_on_thank_you'],
												  "display_on_order_detail" => $file_meta['display_on_order_detail'],
												  "hide_on_shortcode_form" => $file_meta['hide_on_shortcode_form'],
												  "required_on_checkout" => $file_meta['required_on_checkout'],
												  "notifications_recipients" => $file_meta['notifications_recipients'],
												  "field_css_id" => $file_meta['field_css_id'],
												  "preview_images_before_upload_disabled" => $file_meta['preview_images_before_upload_disabled'],
												  "disable_quantity_selector" => $file_meta['disable_quantity_selector'],
												  "text_field_on_order_details_page" => $file_meta['text_field_on_order_details_page'],
												  "text_field_max_input_chars" => $file_meta['text_field_max_input_chars'],
												  "text_field_label" => $file_meta['text_field_label'],
												  "text_field_description" => stripslashes($file_meta['text_field_description']),
												  "disclaimer_checkbox" => $file_meta['disclaimer_checkbox'],
												  "disclaimer_text" => stripslashes($file_meta['disclaimer_text']),
												  "is_text_field_on_order_details_page_required" => $file_meta['is_text_field_on_order_details_page_required'],
												  "enable_for" => $enable_for,
												  "category_ids" => $category_ids,
												  "products_ids" => $products_ids,
												  "attributes_ids" => $attributes_ids,
												  //checkout order total 
												  "checkout_percentage_enabled" => $file_meta['checkout_percentage_enabled'],
												  "checkout_percentage_value" => $file_meta['checkout_percentage_value'],
												  "checkout_percentage_only_once" => $file_meta['checkout_percentage_only_once'],
												  "checkout_percentage_description" => $file_meta['checkout_percentage_description'],
												  //extra costs
												  "extra_cost_enabled" => $file_meta['extra_cost_enabled'],
												  "extra_cost_as_item_price" => $file_meta['extra_cost_as_item_price'],
												  "extra_cost_add_to_item_price" => $file_meta['extra_cost_add_to_item_price'],
												  "extra_overcharge_type" => $file_meta['extra_overcharge_type'],
												  "extra_cost_value" => $file_meta['extra_cost_value'],
												  "extra_cost_overcharge_limit" => $file_meta['extra_cost_overcharge_limit'],
												  "extra_cost_free_items_number" => $file_meta['extra_cost_free_items_number'],
												  "extra_cost_is_taxable" => $file_meta['extra_cost_is_taxable'],
												  "extra_cost_detect_pdf" => $file_meta['extra_cost_detect_pdf'],
												  "extra_cost_fee_description" => $file_meta['extra_cost_fee_description'],
												  //file approval
												  "enable_file_approval" => $file_meta['enable_file_approval'],
												  "disable_file_approval_per_single_file" => $file_meta['disable_file_approval_per_single_file'],
												  "disable_file_approval_notification" => $file_meta['disable_file_approval_notification'],
												  //
												  "extra_cost_media_enabled" => $file_meta['extra_cost_media_enabled'],
												  "extra_cost_media_fee_description" => $file_meta['extra_cost_media_fee_description'],
												  "extra_cost_per_second_value" => $file_meta['extra_cost_per_second_value'],
												  "extra_cost_overcharge_seconds_limit" => $file_meta['extra_cost_overcharge_seconds_limit'],
												  "extra_cost_free_seconds" => $file_meta['extra_cost_free_seconds'],
												  "extra_costs_consider_sum_of_all_file_seconds" => $file_meta['extra_costs_consider_sum_of_all_file_seconds'],
												  "extra_cost_media_is_taxable" => $file_meta['extra_cost_media_is_taxable'],
												  "show_cost_per_second" => $file_meta['show_cost_per_second'],
												  "extra_cost_multiply_per_product_cart_quantity" => $file_meta['extra_cost_multiply_per_product_cart_quantity'],
												  //time 
												  'time_visibility' => $file_meta['time_visibility'],
												  //order stautus												  
												  "order_status" => $file_meta['order_status'],
												  //roles
												  "roles" => $file_meta['roles'],
												  "roles_policy" => $file_meta['roles_policy'],
												  //gateways
												  "visibility_gateways" => $file_meta['visibility_gateways'],
												  "visibility_payment_gateway_policy" => $file_meta['visibility_payment_gateway_policy'],
												  //shipping method
												  "shipping_method" => $file_meta['shipping_method'],
												  //custom 
												   "upload_field_description" => $file_meta['upload_field_description'],												  
												  ));
					$current_last_id = isset($file_meta['id']) && $file_meta['id'] > $current_last_id ? $file_meta['id'] : $current_last_id;
				}
			}
			
			$this->update_option( 'wcuf_files_fields_meta', $file_metas, $fields_to_delete );
			$file_fields_meta = $file_metas;
		}
		else
		{
			$this->delete_option( 'wcuf_files_fields_meta');
			$this->update_option( 'wcuf_last_file_id', 1 );
		}
		if($current_last_id > $last_id)
		  $this->update_option( 'wcuf_last_file_id', $current_last_id );
	  
	  return $file_fields_meta;
	}
	public function update_option($field_name, $field_data, $id_to_delete = null )
	{
		//WPML managment
		global $wcuf_wpml_helper;
		if($field_name == 'wcuf_files_fields_meta')
		{
			$wcuf_wpml_helper->register_strings($field_data);
			if(isset($id_to_delete))
			{		
				$wcuf_wpml_helper->deregister_strings($id_to_delete, true);
			}
		}
		
		return update_option( $field_name, $field_data );
	}
	public function delete_option($field_name)
	{
		global $wcuf_wpml_helper;
		if($field_name == 'wcuf_files_fields_meta')
		{
			$fields =  get_option( 'wcuf_files_fields_meta' );
			$wcuf_wpml_helper->deregister_strings($fields);
		}
		
		return delete_option( $field_name);
	}
	
	function cl_acf_set_language() 
	{
	  return acf_get_setting('default_language');
	}
	public function configurator_page_force_load_js_scripts()
	{
		$result = get_field('wcuf_configurator_page_load_3rd_party_js', 'option'); 
		$result = $result != null && !empty($result) ? $result : false; 
		
		return $result;
	}
	public function get_all_options($option_name = null, $default = false)
	{
		$all_data = array();
		if(!isset($this->general_options))
		{
			add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
			
			$all_data['bar_color'] = get_field('wcuf_bar_color', 'option'); 
			$all_data['bar_color'] = $all_data['bar_color'] != null ? $all_data['bar_color'] : "#808080"; 
			
			$all_data['drag_and_drop_disable'] = get_field('wcuf_drag_and_drop_disable', 'option'); 
			$all_data['drag_and_drop_disable'] = $all_data['drag_and_drop_disable'] != null ? $all_data['drag_and_drop_disable'] : false; 
			
			$all_data['disable_unique_identifier'] = get_field('wcuf_disable_unique_identifier', 'option'); 
			$all_data['disable_unique_identifier'] = $all_data['disable_unique_identifier'] != null ? $all_data['disable_unique_identifier'] : false; 
			
			$all_data['disable_view_button'] = get_field('wcuf_disable_view_button', 'option'); 
			$all_data['disable_view_button'] = $all_data['disable_view_button'] && ($all_data['disable_view_button'] == 1 || $all_data['disable_view_button']) ? 1 : 0; 
			
			$all_data['additional_button_class'] = get_field('wcuf_additional_button_class', 'option'); 
			$all_data['additional_button_class'] = $all_data['additional_button_class'] != null ? $all_data['additional_button_class'] : ''; 
			
			$all_data['browse_button_position'] = get_field('wcuf_browse_button_position', 'option'); 
			$all_data['browse_button_position'] = $all_data['browse_button_position'] != null ? $all_data['browse_button_position'] : 'woocommerce_before_add_to_cart_form'; 
			
			$all_data['cart_page_positioning'] = get_field('wcuf_cart_page_positioning', 'option') ; 
			$all_data['cart_page_positioning'] = $all_data['cart_page_positioning'] != null ? $all_data['cart_page_positioning'] : 'woocommerce_before_cart_table'; 
			
			$all_data['cart_display_upload_fields_outside_product_table'] = get_field('wcuf_cart_display_upload_fields_outside_product_table', 'option') ; 
			$all_data['cart_display_upload_fields_outside_product_table'] = $all_data['cart_display_upload_fields_outside_product_table'] != null ? $all_data['cart_display_upload_fields_outside_product_table'] : false; 
			
			$all_data['checkout_page_positioning'] = get_field('wcuf_checkout_page_positioning', 'option') ; 
			$all_data['checkout_page_positioning'] = $all_data['checkout_page_positioning'] != null ? $all_data['checkout_page_positioning'] : 'woocommerce_after_checkout_billing_form'; 
			
			$all_data['checkout_display_upload_fields_outside_product_table'] = get_field('wcuf_checkout_display_upload_fields_outside_product_table', 'option') ; 
			$all_data['checkout_display_upload_fields_outside_product_table'] = $all_data['checkout_display_upload_fields_outside_product_table'] != null ? $all_data['checkout_display_upload_fields_outside_product_table'] : false; 
			
			$all_data['order_details_page_positioning'] = get_field('wcuf_order_details_page_positioning', 'option') ; 
			$all_data['order_details_page_positioning'] = $all_data['order_details_page_positioning'] != null ? $all_data['order_details_page_positioning'] : 'woocommerce_order_details_after_order_table'; 
			
			$all_data['my_account_page_positioning'] = get_field('wcuf_my_account_page_positioning', 'option') ; 
			$all_data['my_account_page_positioning'] = $all_data['my_account_page_positioning']  != null ? $all_data['my_account_page_positioning']  : 'woocommerce_before_my_account'; 
			
			$all_data['show_warning_alert_on_configurator'] =  get_field('wcuf_show_warning_alert_on_configurator', 'option'); 
			$all_data['show_warning_alert_on_configurator'] = $all_data['show_warning_alert_on_configurator'] != null ? $all_data['show_warning_alert_on_configurator'] : 'yes'; 
			
			$all_data['image_preview_width'] = get_field('wcuf_image_preview_width', 'option'); 
			$all_data['image_preview_width'] = $all_data['image_preview_width'] != null ? $all_data['image_preview_width'] : 50; 
			
			$all_data['image_preview_height'] = get_field('wcuf_image_preview_height', 'option') ; 
			$all_data['image_preview_height'] = $all_data['image_preview_height']  != null ? $all_data['image_preview_height']  : 50; 
			
			$all_data['pages_in_which_standard_upload_fields_managment_is_disabled'] = get_field('wcuf_pages_in_which_standard_upload_fields_managment_is_disabled', 'option'); 
			$all_data['pages_in_which_standard_upload_fields_managment_is_disabled'] = $all_data['pages_in_which_standard_upload_fields_managment_is_disabled'] != null ? $all_data['pages_in_which_standard_upload_fields_managment_is_disabled'] : array(); 
			
			
			$all_data['upload_field_title_style'] = get_field('wcuf_upload_field_title_style', 'option'); 
			$all_data['upload_field_title_style'] = $all_data['upload_field_title_style'] != null ? $all_data['upload_field_title_style'] : "h4"; 
			
			$all_data['product_title_style'] = get_field('wcuf_product_title_style', 'option'); 
			$all_data['product_title_style'] = $all_data['product_title_style'] != null ? $all_data['product_title_style'] : "h5"; 
			
			
			$all_data['css_notice_text_margin_top'] = get_field('wcuf_css_notice_text_margin_top', 'option'); 
			$all_data['css_notice_text_margin_top'] = $all_data['css_notice_text_margin_top'] != null ? $all_data['css_notice_text_margin_top'] : "5"; 
			
			$all_data['css_notice_text_margin_bottom'] = get_field('wcuf_css_notice_text_margin_bottom', 'option') ; 
			$all_data['css_notice_text_margin_bottom'] = $all_data['css_notice_text_margin_bottom'] != null ? $all_data['css_notice_text_margin_bottom'] : "0"; 
			
			$all_data['css_feedback_text_area_height'] = get_field('wcuf_css_feedback_text_area_height', 'option'); 
			$all_data['css_feedback_text_area_height'] = $all_data['css_feedback_text_area_height'] != null ? $all_data['css_feedback_text_area_height'] : 0; 
			
			$all_data['css_feedback_text_area_width'] = get_field('wcuf_feedback_text_area_width', 'option');
			$all_data['css_feedback_text_area_width'] = $all_data['css_feedback_text_area_width'] != null ? $all_data['css_feedback_text_area_width'] : 0;
			
			$all_data['css_feedback_text_area_margin_top'] = get_field('wcuf_css_feedback_text_area_margin_top', 'option'); 
			$all_data['css_feedback_text_area_margin_top'] = $all_data['css_feedback_text_area_margin_top'] != null ? $all_data['css_feedback_text_area_margin_top'] : "0"; 
			
			$all_data['css_feedback_text_area_margin_bottom'] = get_field('wcuf_css_feedback_text_area_margin_bottom', 'option'); 
			$all_data['css_feedback_text_area_margin_bottom'] = $all_data['css_feedback_text_area_margin_bottom'] != null ? $all_data['css_feedback_text_area_margin_bottom'] : "5"; 
			
			$all_data['css_upload_field_title_color'] = get_field('wcuf_css_upload_field_title_color', 'option') ; 
			$all_data['css_upload_field_title_color'] = $all_data['css_upload_field_title_color'] != null ? $all_data['css_upload_field_title_color'] : "inherit"; 
			
			$all_data['css_upload_field_title_font_size'] = get_field('wcuf_css_upload_field_title_font_size', 'option') ; 
			$all_data['css_upload_field_title_font_size'] =  $all_data['css_upload_field_title_font_size'] != null ? $all_data['css_upload_field_title_font_size'] : "inherit"; 
			
			$all_data['css_distance_between_upload_buttons'] = get_field('wcuf_css_distance_between_upload_buttons', 'option') ;
			$all_data['css_distance_between_upload_buttons'] = $all_data['css_distance_between_upload_buttons'] != null ? $all_data['css_distance_between_upload_buttons'] : '2';
			
			
			$all_data['crop_area_width'] = get_field('wcuf_crop_area_width', 'option'); 		
			$all_data['crop_area_width'] = $all_data['crop_area_width'] != null ? $all_data['crop_area_width'] : 280; 		
			
			$all_data['crop_area_height'] = get_field('wcuf_crop_area_height', 'option');
			$all_data['crop_area_height'] = $all_data['crop_area_height'] != null ? $all_data['crop_area_height'] : 280;
			
			$all_data['crop_disable_zoom_controller'] = get_field('wcuf_crop_disable_zoom_controller', 'option');
			$all_data['crop_disable_zoom_controller'] = isset($all_data['crop_disable_zoom_controller']) && $all_data['crop_disable_zoom_controller'] ? true : false;
			
			$all_data['crop_disable_rotation_controller'] = get_field('wcuf_crop_disable_rotation_controller', 'option');
			$all_data['crop_disable_rotation_controller'] = isset($all_data['crop_disable_rotation_controller']) && $all_data['crop_disable_rotation_controller'] ? true : false;
			
			$all_data['crop_rotation_method'] = get_field('wcuf_crop_rotation_method', 'option');
			$all_data['crop_rotation_method'] = isset($all_data['crop_rotation_method']) ? $all_data['crop_rotation_method'] : 'server_side';
			
			$all_data['crop_method'] = get_field('wcuf_crop_method', 'option');
			$all_data['crop_method'] = isset($all_data['crop_method']) ? $all_data['crop_method'] : 'javascript';
			
			
			$all_data['preview_pdf_flipbook'] = get_field('wcuf_preview_pdf_flipbook', 'option');
			$all_data['preview_pdf_flipbook'] = isset($all_data['preview_pdf_flipbook']) ? $all_data['preview_pdf_flipbook'] : false;
			
			/* Format: display_summary_box_strategy
			array(3) {
				  [0]=>
				  string(4) "cart"
				  [1]=>
				  string(8) "checkout"
				  [2]=>
				  string(13) "order_details"
				}
			*/
			$all_data['display_summary_box_strategy'] = get_field('wcuf_display_summary_box_strategy', 'option'); 
			$all_data['display_summary_box_strategy'] = $all_data['display_summary_box_strategy'] != null && !empty($all_data['display_summary_box_strategy']) ? $all_data['display_summary_box_strategy'] : "no"; 
			
			$all_data['display_last_order_upload_fields_in_my_account_page'] = get_field('wcuf_display_last_order_upload_fields_in_my_account_page', 'option') ; 
			$all_data['display_last_order_upload_fields_in_my_account_page'] = $all_data['display_last_order_upload_fields_in_my_account_page'] != null && !empty($all_data['display_last_order_upload_fields_in_my_account_page']) ? $all_data['display_last_order_upload_fields_in_my_account_page'] : "no"; 
			
			$all_data['my_account_disable_autoupload'] = get_field('wcuf_my_account_disable_autoupload', 'option') ; 
			$all_data['my_account_disable_autoupload'] = $all_data['my_account_disable_autoupload'] ? $all_data['my_account_disable_autoupload'] : false; 
			
			//file_name_and_preview_image - file_name - preview_image
			$all_data['summary_box_info_to_display'] = get_field('wcuf_summary_box_info_to_display', 'option'); 
			$all_data['summary_box_info_to_display'] = $all_data['summary_box_info_to_display'] != null && is_array($all_data['summary_box_info_to_display']) ? $all_data['summary_box_info_to_display'] : array('file_name', 'preview_image'); 
			
			$all_data['remove_random_number_prefix'] = get_field('wcuf_remove_random_number_prefix', 'option') ; 
			$all_data['remove_random_number_prefix'] = $all_data['remove_random_number_prefix'] != null && !empty($all_data['remove_random_number_prefix']) ? $all_data['remove_random_number_prefix'] : "no"; 
			
			//Totals
			$all_data['display_totals_in_product_page'] = get_field('wcuf_display_totals_in_product_page', 'option') ; 
			$all_data['display_totals_in_product_page'] = $all_data['display_totals_in_product_page'] != null ? $all_data['display_totals_in_product_page'] : false; 
			
			$all_data['display_totals_in_summary_boxes'] = get_field('wcuf_display_totals_in_summary_boxes', 'option') ; 
			$all_data['display_totals_in_summary_boxes'] = $all_data['display_totals_in_summary_boxes'] != null ? $all_data['display_totals_in_summary_boxes'] : false; 
			
			$all_data['totals_info_to_display'] = get_field('wcuf_totals_info_to_display', 'option') ; 
			$all_data['totals_info_to_display'] = $all_data['totals_info_to_display'] != null && !empty($all_data['remove_random_number_prefix']) ? $all_data['totals_info_to_display'] : array(); // num_files, costs 
			
			
			$all_data['force_require_check_befor_adding_item_to_car'] = get_field('wcuf_force_require_check_befor_adding_item_to_car', 'option') ; 
			$all_data['force_require_check_befor_adding_item_to_car'] = $all_data['force_require_check_befor_adding_item_to_car'] ? $all_data['force_require_check_befor_adding_item_to_car'] : "no"; 
			
			$all_data['allow_user_to_leave_page_in_case_of_required_field'] = get_field('wcuf_allow_user_to_leave_page_in_case_of_required_field', 'option'); 
			$all_data['allow_user_to_leave_page_in_case_of_required_field'] = $all_data['allow_user_to_leave_page_in_case_of_required_field'] ? $all_data['allow_user_to_leave_page_in_case_of_required_field'] : "no"; //no, yes, never 
			
			$all_data['enable_quantity_selection'] = get_field('wcuf_enable_quantity_selection', 'option'); 
			$all_data['enable_quantity_selection'] = $all_data['enable_quantity_selection'] && $all_data['enable_quantity_selection'] == 'yes' ? true : false; 
			
			$all_data['auto_upload_for_multiple_files_upload_field'] = get_field('wcuf_auto_upload_for_multiple_files_upload_field', 'option'); 
			$all_data['auto_upload_for_multiple_files_upload_field'] = $all_data['auto_upload_for_multiple_files_upload_field'] && $all_data['auto_upload_for_multiple_files_upload_field'] == 'yes' ? true : false; 
			$all_data['auto_upload_for_multiple_files_upload_field'] = $all_data['enable_quantity_selection'] ? false : $all_data['auto_upload_for_multiple_files_upload_field'];
			
			$all_data['max_uploaded_files_number_considered_as_sum_of_quantities'] = get_field('wcuf_max_uploaded_files_number_considered_as_sum_of_quantities', 'option'); 
			$all_data['max_uploaded_files_number_considered_as_sum_of_quantities'] = $all_data['max_uploaded_files_number_considered_as_sum_of_quantities'] == null || $all_data['max_uploaded_files_number_considered_as_sum_of_quantities'] == 'yes' ? true : false; 
			
			$all_data['cart_quantity_as_number_of_uploaded_files'] = get_field('wcuf_cart_quantity_as_number_of_uploaded_files', 'option'); 
			$all_data['cart_quantity_as_number_of_uploaded_files'] = $all_data['cart_quantity_as_number_of_uploaded_files'] != null && $all_data['cart_quantity_as_number_of_uploaded_files'] == 'yes' ? true : false;
			
			$all_data['cart_quantity_show_uploads_quantity'] = get_field('wcuf_cart_quantity_show_uploads_quantity', 'option'); 
			$all_data['cart_quantity_show_uploads_quantity'] = $all_data['cart_quantity_show_uploads_quantity'] != null && ($all_data['cart_quantity_show_uploads_quantity'] == 'yes' || $all_data['cart_quantity_show_uploads_quantity'] ==  true) ? true : false;
			
			$all_data['product_prices_multiplied_by_number_of_uploaded_files'] = get_field('wcuf_product_prices_multiplied_by_number_of_uploaded_files', 'option'); 
			$all_data['product_prices_multiplied_by_number_of_uploaded_files'] = wcuf_get_value_if_set($all_data, 'product_prices_multiplied_by_number_of_uploaded_files', false);
			
			//mandatory
			$all_data['show_required_upload_add_to_cart_warning_message'] = get_field('wcuf_show_required_upload_add_to_cart_warning_message', 'option'); 
			$all_data['show_required_upload_add_to_cart_warning_message'] = !$all_data['show_required_upload_add_to_cart_warning_message'] || $all_data['show_required_upload_add_to_cart_warning_message'] == 'yes' ? true : false; 
			
			$all_data['mandatory_hide_add_to_cart_button'] = get_field('wcuf_mandatory_hide_add_to_cart_button', 'option'); 
			$all_data['mandatory_hide_add_to_cart_button'] = !$all_data['mandatory_hide_add_to_cart_button'] ? false : true; 
			
			
			$all_data['temp_files_clear_interval'] = get_field('wcuf_temp_files_clear_interval', 'option'); 
			$all_data['temp_files_clear_interval'] = !$all_data['temp_files_clear_interval'] ? 1200 : $all_data['temp_files_clear_interval']*60; //1200: 20 min
			
			$all_data['upload_timeout'] = get_field('wcuf_upload_timeout', 'option'); 
			$all_data['upload_timeout'] = !$all_data['upload_timeout'] ? 6000000 : $all_data['upload_timeout']*60*1000; //1200: 20 min
			
			$all_data['secure_links'] = get_field('wcuf_secure_links', 'option'); 
			$all_data['secure_links'] = !isset($all_data['secure_links']) ? false : $all_data['secure_links'];
			
			$all_data['disable_force_download_on_admin_order_page'] = get_field('wcuf_disable_force_download_on_admin_order_page', 'option'); 
			$all_data['disable_force_download_on_admin_order_page'] = !isset($all_data['disable_force_download_on_admin_order_page']) ? false : $all_data['disable_force_download_on_admin_order_page'];
			
			$all_data['session_id_alternative_method'] = get_field('wcuf_session_id_alternative_method', 'option'); 
			$all_data['session_id_alternative_method'] = !isset($all_data['session_id_alternative_method']) ? false : $all_data['session_id_alternative_method'];
			
			$all_data['image_preview_method'] = get_field('wcuf_image_preview_method', 'option'); 
			$all_data['image_preview_method'] = !$all_data['image_preview_method'] ? 'new' : $all_data['image_preview_method'];
			
			$all_data['generate_static_preview'] = get_field('wcuf_generate_static_preview', 'option'); 
			$all_data['generate_static_preview'] = !$all_data['generate_static_preview'] /* || get_field('wcuf_cloud_storage_service', 'option') != "locally" */ ? false : $all_data['generate_static_preview'];
			
			$all_data['order_again_copy_uploaded_files'] = get_field('wcuf_order_again_copy_uploaded_files', 'option'); 
			$all_data['order_again_copy_uploaded_files'] = !isset($all_data['order_again_copy_uploaded_files']) ?  true : $all_data['order_again_copy_uploaded_files']; 
			
			$all_data['display_user_feedback_on_order_details_sheet'] = get_field('wcuf_display_user_feedback_on_order_details_sheet', 'option'); 
			$all_data['display_user_feedback_on_order_details_sheet'] = $all_data['display_user_feedback_on_order_details_sheet'] ? $all_data['display_user_feedback_on_order_details_sheet'] : false; 
			
			$all_data['checkout_file_association_method'] = get_field('wcuf_checkout_file_association_method', 'option'); 
			$all_data['checkout_file_association_method'] = isset($all_data['checkout_file_association_method']) ? $all_data['checkout_file_association_method'] : 'thank_you'; 
			
			//order details page 
			$all_data['order_details_page_change_order_status'] = get_field('wcuf_order_details_page_change_order_status', 'option'); 
			$all_data['order_details_page_change_order_status'] = isset($all_data['order_details_page_change_order_status']) ? $all_data['order_details_page_change_order_status'] : false; 
			
			$all_data['current_status_to_consider'] = get_field('wcuf_current_status_to_consider', 'option'); 
			$all_data['current_status_to_consider'] = isset($all_data['current_status_to_consider']) && is_array($all_data['current_status_to_consider']) ? array_filter($all_data['current_status_to_consider']) : array(); 
			foreach((array)$all_data['current_status_to_consider'] as $index => $status)
				$all_data['current_status_to_consider'][$index]  = str_replace( "wc-", "" , $status);
			
			$all_data['status_to_assign'] = get_field('status_to_assign', 'option'); 
			$all_data['status_to_assign'] = isset($all_data['status_to_assign']) && isset($all_data['status_to_assign'][0]) ? str_replace( "wc-", "" , $all_data['status_to_assign'][0])  : false; 
			
			remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
			$this->general_options = $all_data;
		}
		
		if(isset($option_name))
			return wcuf_get_value_if_set($this->general_options, $option_name, $default);
		
		return $this->general_options;
	}
	public function get_order_status_change_options()
	{
		$all_data = array();
		if(isset($this->order_status_change_options))
			return $this->order_status_change_options;
		
		add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
		
		//order details page 
		$all_data['order_details_page_change_order_status'] = get_field('wcuf_order_details_page_change_order_status', 'option'); 
		$all_data['order_details_page_change_order_status'] = isset($all_data['order_details_page_change_order_status']) ? $all_data['order_details_page_change_order_status'] : false; 
		
		$all_data['current_status_to_consider'] = get_field('wcuf_current_status_to_consider', 'option'); 
		$all_data['current_status_to_consider'] = isset($all_data['current_status_to_consider']) ? array_filter($all_data['current_status_to_consider']) : array(); 
		foreach((array)$all_data['current_status_to_consider'] as $index => $status)
			$all_data['current_status_to_consider'][$index] = str_replace( "wc-", "" , $status);
		
		$all_data['status_to_assign'] = get_field('wcuf_status_to_assign', 'option'); 
		$all_data['status_to_assign'] = isset($all_data['status_to_assign']) && isset($all_data['status_to_assign'][0])? str_replace( "wc-", "" , $all_data['status_to_assign'][0]) : false; 
		
		remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
		$this->order_status_change_options =  $all_data;
		
		return  $all_data;
	}
	public function disable_admin_order_page_items_table_image_preview()
	{
		add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
		
		$disable = get_field('wcuf_admin_order_items_image_preview', 'option');  
		$disable = isset($disable) && $disable == 'yes' ? true : false;
		remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
		
		return  $disable;
	}
	public function disable_admin_order_page_uploaded_files_metabox_image_preview() 
	{
		add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
		
		$disable = get_field('wcuf_admin_uploaded_files_metabox_image_preview', 'option');  
		$disable = isset($disable) && $disable == 'yes' ? true : false;
		remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
		
		return  $disable;
	}
	public function show_preview_images_on_cart_and_checkout_item_table()
	{
		
		add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
		
		$show = get_field('wcuf_cart_and_checkout_item_table_image_preview', 'option');  
		$show = !isset($show) || $show == 'yes' ? true : false;
		remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
		
		return  $show;
	}
	public function show_previews_on_emails_item_table()
	{
		
		add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
		
		$show = get_field('wcuf_email_item_table_files_preview', 'option');  
		$show = isset($show) && $show == 'yes' ? true : false;
		remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
		
		return  $show;
	}
	public function replace_product_thumb_on_cart_item_table_strategy()
	{
		
		add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
		
		$strategy = get_field('wcuf_replace_product_image_preview_on_product_table', 'option');  
		$strategy = !isset($strategy) ? 'no' : $strategy;
		remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
		
		return  $strategy;
	}
	public function get_individual_products_options()
	{
		$all_data = array();
		if(isset($this->individual_producs_options))
			return $this->individual_producs_options;
		
		add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
			
			$all_data['sell_all_products_as_individual'] = get_field('wcuf_sell_all_products_as_individual', 'option'); 
			$all_data['sell_all_products_as_individual'] = $all_data['sell_all_products_as_individual'] ? $all_data['sell_all_products_as_individual'] : false; 
			
			$all_data['split_products_on_cart'] = get_field('wcuf_split_products_on_cart', 'option'); 
			$all_data['split_products_on_cart'] = $all_data['split_products_on_cart'] ? $all_data['split_products_on_cart'] : false; 
			
			$all_data['individual_products'] = get_field('wcuf_individual_products', 'option'); 
			$all_data['individual_products'] = $all_data['individual_products'] ? $all_data['individual_products'] : array(); 
			
			$all_data['individual_product_categories'] = get_field('wcuf_individual_product_categories', 'option'); 
			$all_data['individual_product_categories'] = $all_data['individual_product_categories'] ? $all_data['individual_product_categories'] : array();
			
			$all_data['individual_products_selection_strategy'] = get_field('wcuf_individual_products_selection_strategy', 'option'); 
			$all_data['individual_products_selection_strategy'] = $all_data['individual_products_selection_strategy'] ? $all_data['individual_products_selection_strategy'] : 'all'; // all || except 
			
			$all_data['individual_products_children_categories'] = get_field('wcuf_individual_products_children_categories', 'option'); 
			$all_data['individual_products_children_categories'] = $all_data['individual_products_children_categories'] ? $all_data['individual_products_children_categories'] : 'selected_only'; // selected_only || all_children
			
		remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
		$this->individual_producs_options = $all_data;
		
		return $all_data;
	}
	public function remove_file_name_prefix()
	{
		return get_field('wcuf_remove_random_number_prefix', 'option') != null && !empty(get_field('wcuf_remove_random_number_prefix', 'option')) ? get_field('wcuf_remove_random_number_prefix', 'option') : "no";
	}
	public function get_style_options()
	{
		$all_data = array();
		if(isset($this->css_options))
			return $this->css_options;
		
		add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
		
		$all_data['image_preview_width'] = get_field('wcuf_image_preview_width', 'option'); 
		$all_data['image_preview_width'] = $all_data['image_preview_width'] != null ? $all_data['image_preview_width'] : 50; 
		
		$all_data['image_preview_height'] = get_field('wcuf_image_preview_height', 'option') ; 
		$all_data['image_preview_height'] = $all_data['image_preview_height']  != null ? $all_data['image_preview_height']  : 50; 
			
		$all_data['upload_field_title_style'] = get_field('wcuf_upload_field_title_style', 'option'); 
		$all_data['upload_field_title_style'] = $all_data['upload_field_title_style'] != null ? $all_data['upload_field_title_style'] : "h4"; 
		
		$all_data['product_title_style'] = get_field('wcuf_product_title_style', 'option'); 
		$all_data['product_title_style'] = $all_data['product_title_style'] != null ? $all_data['product_title_style'] : "h5"; 
		
		$all_data['css_notice_text_margin_top'] = get_field('wcuf_css_notice_text_margin_top', 'option'); 
		$all_data['css_notice_text_margin_top'] = $all_data['css_notice_text_margin_top'] != null ? $all_data['css_notice_text_margin_top'] : "5"; 
		
		$all_data['css_notice_text_margin_bottom'] = get_field('wcuf_css_notice_text_margin_bottom', 'option') ; 
		$all_data['css_notice_text_margin_bottom'] = $all_data['css_notice_text_margin_bottom'] != null ? $all_data['css_notice_text_margin_bottom'] : "0"; 
		
		$all_data['css_feedback_text_area_height'] = get_field('wcuf_css_feedback_text_area_height', 'option'); 
		$all_data['css_feedback_text_area_height'] = $all_data['css_feedback_text_area_height'] != null ? $all_data['css_feedback_text_area_height'] : 0; 
		
		$all_data['css_feedback_text_area_width'] = get_field('wcuf_feedback_text_area_width', 'option');
		$all_data['css_feedback_text_area_width'] = $all_data['css_feedback_text_area_width'] != null ? $all_data['css_feedback_text_area_width'] : 0;
			
		$all_data['css_feedback_text_area_margin_top'] = get_field('wcuf_css_feedback_text_area_margin_top', 'option'); 
		$all_data['css_feedback_text_area_margin_top'] = $all_data['css_feedback_text_area_margin_top'] != null ? $all_data['css_feedback_text_area_margin_top'] : "0"; 
		
		$all_data['css_feedback_text_area_margin_bottom'] = get_field('wcuf_css_feedback_text_area_margin_bottom', 'option'); 
		$all_data['css_feedback_text_area_margin_bottom'] = $all_data['css_feedback_text_area_margin_bottom'] != null ? $all_data['css_feedback_text_area_margin_bottom'] : "5"; 
		
		$all_data['css_upload_field_title_color'] = get_field('wcuf_css_upload_field_title_color', 'option') ; 
		$all_data['css_upload_field_title_color'] = $all_data['css_upload_field_title_color'] != null ? $all_data['css_upload_field_title_color'] : "inherit"; 
		
		$all_data['css_upload_field_title_font_size'] = get_field('wcuf_css_upload_field_title_font_size', 'option') ; 
		$all_data['css_upload_field_title_font_size'] =  $all_data['css_upload_field_title_font_size'] != null ? $all_data['css_upload_field_title_font_size'] : "inherit"; 
		
		$all_data['css_distance_between_upload_buttons'] = get_field('wcuf_css_distance_between_upload_buttons', 'option') ;
		$all_data['css_distance_between_upload_buttons'] = $all_data['css_distance_between_upload_buttons'] != null ? $all_data['css_distance_between_upload_buttons'] : '2';
		
		
		//Specific pages settings
		$all_data['css_checkout_page_multiple_upload_fields_per_row'] = get_field('checkout_page_multiple_upload_fields_per_row', 'option') ;
		$all_data['css_checkout_page_multiple_upload_fields_per_row'] = $all_data['css_checkout_page_multiple_upload_fields_per_row'] != null ? $all_data['css_checkout_page_multiple_upload_fields_per_row'] : 'no';
		$all_data['css_checkout_page_upload_field_width'] = get_field('wcuf_checkout_page_upload_field_width', 'option') ;
		$all_data['css_checkout_page_upload_field_width'] = $all_data['css_checkout_page_upload_field_width'] != null ? $all_data['css_checkout_page_upload_field_width'] : 320;
		$all_data['css_checkout_page_upload_field_width_type'] = get_field('wcuf_checkout_page_upload_field_width_type', 'option') ;
		$all_data['css_checkout_page_upload_field_width_type'] = $all_data['css_checkout_page_upload_field_width_type'] != null && $all_data['css_checkout_page_upload_field_width_type'] == 'percentage' ? '%' : 'px';
		
		$all_data['css_cart_page_multiple_upload_fields_per_row'] = get_field('cart_page_multiple_upload_fields_per_row', 'option') ;
		$all_data['css_cart_page_multiple_upload_fields_per_row'] = $all_data['css_cart_page_multiple_upload_fields_per_row'] != null ? $all_data['css_cart_page_multiple_upload_fields_per_row'] : 'no';
		$all_data['css_cart_page_upload_field_width'] = get_field('wcuf_cart_page_upload_field_width', 'option') ;
		$all_data['css_cart_page_upload_field_width'] = $all_data['css_cart_page_upload_field_width'] != null ? $all_data['css_cart_page_upload_field_width'] : 320;
		$all_data['css_cart_page_upload_field_width_type'] = get_field('wcuf_cart_page_upload_field_width_type', 'option') ;
		$all_data['css_cart_page_upload_field_width_type'] = $all_data['css_cart_page_upload_field_width_type'] != null && $all_data['css_cart_page_upload_field_width_type'] == 'percentage' ? '%' : 'px';
		
		
		$all_data['css_order_page_multiple_upload_fields_per_row'] = get_field('order_page_multiple_upload_fields_per_row', 'option') ;
		$all_data['css_order_page_multiple_upload_fields_per_row'] = $all_data['css_order_page_multiple_upload_fields_per_row'] != null ? $all_data['css_order_page_multiple_upload_fields_per_row'] : 'no';
		$all_data['css_order_page_upload_field_width'] = get_field('wcuf_order_page_upload_field_width', 'option') ;
		$all_data['css_order_page_upload_field_width'] = $all_data['css_order_page_upload_field_width'] != null ? $all_data['css_order_page_upload_field_width'] : 320;
		$all_data['css_order_page_upload_field_width_type'] = get_field('wcuf_order_page_upload_field_width_type', 'option') ;
		$all_data['css_order_page_upload_field_width_type'] = $all_data['css_order_page_upload_field_width_type'] != null && $all_data['css_order_page_upload_field_width_type'] == 'percentage' ? '%' : 'px';
		
		$all_data['css_shortcode_page_multiple_upload_fields_per_row'] = get_field('shortcode_page_multiple_upload_fields_per_row', 'option') ;
		$all_data['css_shortcode_page_multiple_upload_fields_per_row'] = $all_data['css_shortcode_page_multiple_upload_fields_per_row'] != null ? $all_data['css_shortcode_page_multiple_upload_fields_per_row'] : 'no';
		$all_data['css_shortcode_page_upload_field_width'] = get_field('wcuf_shortcode_page_upload_field_width', 'option') ;
		$all_data['css_shortcode_page_upload_field_width'] = $all_data['css_shortcode_page_upload_field_width'] != null ? $all_data['css_shortcode_page_upload_field_width'] : 320;
		$all_data['css_shortcode_page_upload_field_width_type'] = get_field('wcuf_shortcode_page_upload_field_width_type', 'option') ;
		$all_data['css_shortcode_page_upload_field_width_type'] = $all_data['css_shortcode_page_upload_field_width_type'] != null && $all_data['css_shortcode_page_upload_field_width_type'] == 'percentage' ? '%' : 'px';
		
		
		//Crop
		$all_data['crop_area_width'] = get_field('wcuf_crop_area_width', 'option'); 		
		$all_data['crop_area_width'] = $all_data['crop_area_width'] != null ? $all_data['crop_area_width'] : 280; 		
		
		$all_data['crop_area_height'] = get_field('wcuf_crop_area_height', 'option');
		$all_data['crop_area_height'] = $all_data['crop_area_height'] != null ? $all_data['crop_area_height'] : 280;
		
		$all_data['crop_disable_zoom_controller'] = get_field('wcuf_crop_disable_zoom_controller', 'option');
		$all_data['crop_disable_zoom_controller'] = $all_data['crop_disable_zoom_controller'] != null ? $all_data['crop_disable_zoom_controller'] : false;
		
		$all_data['crop_disable_rotation_controller'] = get_field('wcuf_crop_disable_rotation_controller', 'option');
		$all_data['crop_disable_rotation_controller'] = isset($all_data['crop_disable_rotation_controller']) && $all_data['crop_disable_rotation_controller'] ? true : false;
			
		remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
		
		$this->css_options = $all_data;
		return $all_data;
	}
	public function get_crop_area_options()
	{
		if(isset($this->crop_options))
			return $this->crop_options;
		$all_data = array();
		
		add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
		$all_data['crop_area_width'] = get_field('wcuf_crop_area_width', 'option'); 		
		$all_data['crop_area_width'] = $all_data['crop_area_width'] != null ? $all_data['crop_area_width'] : 280; 		
		
		$all_data['crop_area_height'] = get_field('wcuf_crop_area_height', 'option');
		$all_data['crop_area_height'] = $all_data['crop_area_height'] != null ? $all_data['crop_area_height'] : 280;
		
		$all_data['crop_disable_zoom_controller'] = get_field('wcuf_crop_disable_zoom_controller', 'option');
		$all_data['crop_disable_zoom_controller'] = $all_data['crop_disable_zoom_controller'] != null ? $all_data['crop_disable_zoom_controller'] : false;
		
		$all_data['crop_disable_rotation_controller'] = get_field('wcuf_crop_disable_rotation_controller', 'option');
		$all_data['crop_disable_rotation_controller'] = $all_data['crop_disable_rotation_controller'] != null ? $all_data['crop_disable_rotation_controller'] : false;
		
		$all_data['crop_rotation_method'] = get_field('wcuf_crop_rotation_method', 'option');
		$all_data['crop_rotation_method'] = isset($all_data['crop_rotation_method']) ? $all_data['crop_rotation_method'] : 'server_side';
		
		remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
		
		$this->crop_options = $all_data;
		return $all_data;
	}
	public function set_cloud_settings($refresh_token)
	{
		add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
		update_field( 'wcuf_dropbox_auth_key', $refresh_token, 'option' );
		remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
	}
	public function get_cloud_settings()
	{
		$all_data = array();
		add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
		$all_data['cloud_storage_service'] = get_field('wcuf_cloud_storage_service', 'option'); 		
		$all_data['cloud_storage_service'] = $all_data['cloud_storage_service'] != null ? $all_data['cloud_storage_service'] : 'locally'; //locally || dropbox || s3
		//Dropbox
		$all_data['dropbox_auth_key'] = get_field('wcuf_dropbox_auth_key', 'option');
		$all_data['dropbox_auth_key'] = $all_data['dropbox_auth_key'] != null ? $all_data['dropbox_auth_key'] : "";
		
		//Amazon S3
		$all_data['s3_access_key_id'] = get_field('wcuf_s3_access_key_id', 'option');
		$all_data['s3_access_key_id'] = $all_data['s3_access_key_id'] != null ? $all_data['s3_access_key_id'] : "";
		
		$all_data['s3_secret_access_key'] = get_field('wcuf_s3_secret_access_key', 'option');
		$all_data['s3_secret_access_key'] = $all_data['s3_secret_access_key'] != null ? $all_data['s3_secret_access_key'] : "";
		
		$all_data['s3_region'] = get_field('wcuf_s3_region', 'option');
		$all_data['s3_region'] = $all_data['s3_region'] != null ? $all_data['s3_region'] : "";
		
		$all_data['s3_bucket_name'] = get_field('wcuf_s3_bucket_name', 'option');
		$all_data['s3_bucket_name'] = $all_data['s3_bucket_name'] != null ? $all_data['s3_bucket_name'] : "";
		//Google Drive
		$all_data['gdrive_json_auth'] = get_field('wcuf_gdrive_json_auth', 'option');
		$all_data['gdrive_json_auth'] = $all_data['gdrive_json_auth'] != null ? $all_data['gdrive_json_auth'] : "";
		
		$all_data['gdrive_auth_code'] = get_field('wcuf_gdrive_auth_code', 'option');
		$all_data['gdrive_auth_code'] = $all_data['gdrive_auth_code'] != null ? $all_data['gdrive_auth_code'] : "";
		
		$all_data['gdrive_json_auth_file'] = get_field('wcuf_gdrive_json_auth_file', 'option');
		$all_data['gdrive_json_auth_file'] = $all_data['gdrive_json_auth_file'] != null ? $all_data['gdrive_json_auth_file'] : false;

		$all_data['gdrive_root_folder_name'] = get_field('wcuf_gdrive_root_folder_name', 'option');
		$all_data['gdrive_root_folder_name'] = $all_data['gdrive_root_folder_name'] != null ? $all_data['gdrive_root_folder_name'] : "";
		
		remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
		
		return $all_data;
	}
}
?>