<?php 
class WCUF_Shortcode
{
	var $total_costs = array();
	var $current_buffer;
	public function __construct()
	{
		add_shortcode( 'wcuf_upload_form', array(&$this, 'wcuf_upload_form' ));
		add_shortcode( 'wcuf_product_page_upload_form', array(&$this, 'wcuf_product_page_upload_form' ));
		add_shortcode( 'wcuf_cart_page_upload_form', array(&$this, 'wcuf_cart_page_upload_form' ));
		add_shortcode( 'wcuf_checkout_page_upload_form', array(&$this, 'wcuf_checkout_page_upload_form' ));
		add_shortcode( 'wcuf_upload_form_last_order', array(&$this, 'wcuf_upload_form_last_order' ));
		
		add_action( 'wp_ajax_reload_shortcode_upload_fields', array( &$this, 'ajax_reload_uploads_shortcode_page' ));
		add_action( 'wp_ajax_nopriv_reload_shortcode_upload_fields', array( &$this, 'ajax_reload_uploads_shortcode_page' ));
	}
	
	public function is_admin_editing_page_via_ajax()
	{
		return isset($_GET['_locale']);
	}
	public function ajax_reload_uploads_shortcode_page() 
	{
		if($this->is_admin_editing_page_via_ajax())
			return; 
		$this->wcuf_upload_form(null,true);
	}
	public function wcuf_product_page_upload_form()
	{
		global $wcuf_product_page_addon, $wcuf_option_model;
		if($this->is_admin_editing_page_via_ajax())
			return; 
		
		if(@is_product())
		{
			$all_options = $wcuf_option_model->get_all_options();
			$check_if_standard_managment_is_disabled = $all_options['pages_in_which_standard_upload_fields_managment_is_disabled'];
			
			if(isset($this->current_buffer))
				return $this->current_buffer;
			
			ob_start();
			if($wcuf_product_page_addon->upload_form_is_active || !in_array("product", $check_if_standard_managment_is_disabled))
			{
				echo "<strong>".esc_html__('To use this you have to disable the standard upload field managment for Product page. Go to the Plugin options page and disable it.','woocommerce-files-upload')."</strong>";
			}
			else
			{
				$wcuf_product_page_addon->add_uploads_on_product_page(false, 0, true);
			}
			$this->current_buffer = ob_get_clean();
		
			return $this->current_buffer;
		}
	}
	public function wcuf_cart_page_upload_form()
	{
		global $wcuf_cart_addon;
		if($this->is_admin_editing_page_via_ajax())
			return; 
		
		if(@is_cart())
		{
			ob_start();
			if($wcuf_cart_addon->upload_form_is_active)
			{
				echo "<strong>".esc_html__('To use this you have to disable the standard upload field managment for Cart page. Go to the Plugin options page and disable it.','woocommerce-files-upload')."</strong>";
			}
			else
				$wcuf_cart_addon->add_uploads_cart_page(null, true);
			return ob_get_clean();
		}
	}
	public function wcuf_checkout_page_upload_form()
	{
		global $wcuf_checkout_addon;
		if($this->is_admin_editing_page_via_ajax())
			return; 
		
		if(@is_checkout())
		{
			ob_start();
			if($wcuf_checkout_addon->upload_form_is_active)
			{
				echo "<strong>".esc_html__('To use this you have to disable the standard upload field managment for Checkout page. Go to the Plugin options page and disable it.','woocommerce-files-upload')."</strong>";
			}
			else
				$wcuf_checkout_addon->add_uploads_checkout_page(null, false, true);
			return ob_get_clean();
		}
	}
	public function wcuf_upload_form($atts, $is_ajax_request = false)
	{
		
		if(@is_product() || @is_cart() || @is_checkout() || @is_shop() || @is_archive() || $this->is_admin_editing_page_via_ajax())
			return;
		
		if(!wcuf_is_a_supported_browser())
			return;
		
		global $wcuf_order_model, $wcuf_option_model, $wcuf_wpml_helper, $wcuf_session_model, $wcuf_cart_model, $wcuf_media_model, $post,
			   $wcuf_shortcodes,$wcuf_product_model,$wcuf_text_model, $sitepress, $wcuf_customer_model, $wcuf_upload_field_model, $wcuf_time_model;
			   
		$is_cart_item_table = false;
		$button_texts  = $wcuf_text_model->get_button_texts();
		$item_to_show_upload_fields = $wcuf_cart_model->get_sorted_cart_contents();
		$file_order_metadata = array();
		$file_fields_groups = $wcuf_option_model->get_fields_meta_data();
		$style_options = $wcuf_option_model->get_style_options();
		$all_options = $wcuf_option_model->get_all_options();
		$crop_area_options = $wcuf_option_model->get_crop_area_options();
		$additional_button_class = $all_options['additional_button_class'];
		$display_summary_box = 'no';
		$current_page = 'shortcode';
		$container_unique_id = 'none';
		$cart_item_id = "none";
		$current_locale = $wcuf_wpml_helper->get_current_locale();
		$current_product_id = $post ? $post->ID : false;
		$wc_product = $current_product_id ? wc_get_product($current_product_id) : false;
		$tm_extra_product_edit_page = false;
		$tm_extra_product_edit_page_ajax_request = false;
		$display_outside_product_table = true;
		
		if(file_exists ( get_theme_file_path()."/wcuf/js/wcuf-frontend-cropperV2.js" ))
				$cropper_js_path = get_template_directory_uri()."/wcuf/js/wcuf-frontend-cropperV2.js";
			else
				$cropper_js_path = wcuf_PLUGIN_PATH.'/js/wcuf-frontend-cropperV2.js';
		$cropper_js_path = apply_filters('wcuf_get_js_cropper_path', $cropper_js_path);
		
		if(!$is_ajax_request)
		{
			do_action('wcuf_before_loading_frontend_pages_js_libraries');
			wp_enqueue_script('wcuf-load-image', wcuf_PLUGIN_PATH. '/js/load-image.all.min.js' ,array('jquery')); 
			wp_register_script('wcuf-ajax-upload-file', wcuf_PLUGIN_PATH. '/js/wcuf-frontend-cart-checkout-product-page'.'_'.$current_locale.'.js' ,array('jquery','wp-hooks'));   
			wp_register_script('wcuf-frontend-ui-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-ui-manager.js', array('jquery', 'wp-hooks'));
			wp_enqueue_script('wcuf-compressor', wcuf_PLUGIN_PATH.'/js/vendor/compressor/compressor.min.js', array('jquery'));
			wp_enqueue_script('wcuf-multiple-file-manager', wcuf_PLUGIN_PATH. '/js/wcuf-frontend-multiple-file-manager.js' ,array('jquery')); 
			wp_enqueue_script('wcuf-frontend-multiple-file-uploader', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-multiple-file-uploader.js', array('jquery'));			
			wp_enqueue_script('wcuf-audio-video-file-manager', wcuf_PLUGIN_PATH. '/js/wcuf-audio-video-file-manager.js' ,array('jquery')); 
			wp_enqueue_script('wcuf-image-size-checker', wcuf_PLUGIN_PATH. '/js/wcuf-image-size-checker.js' ,array('jquery')); 
			wp_enqueue_script('wcuf-cropper', wcuf_PLUGIN_PATH.'/js/vendor/cropper/cropper.min.js', array('jquery'));
			wp_register_script('wcuf-frontend-cropper', $cropper_js_path, array('jquery') ); 
			
			wp_enqueue_script( 'wcuf-generic-file-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-generic-file-uploader.js', array('jquery') );
			wp_enqueue_script('wcuf-magnific-popup', wcuf_PLUGIN_PATH.'/js/vendor/jquery.magnific-popup.js', array('jquery'));
			
			//PDF: thumb preview
			wp_enqueue_script('wcuf-pdf-preview-thumb', wcuf_PLUGIN_PATH.'/js/vendor/pdf/pdfThumbnails.js', array('jquery'));
			//PDF: Flipbook 
			wp_enqueue_script('wcuf-pdf', wcuf_PLUGIN_PATH.'/js/vendor/flipbook/dflip.min.js', array('jquery')); 
			$pdf_flipbook_opt = array( 'plugins_path' =>wcuf_PLUGIN_PATH ); //after wp_enqueue_script
			wp_localize_script( 'wcuf-pdf', 'wcuf_flipbook_opt', $pdf_flipbook_opt );
			
			wp_enqueue_style('wcuf-frontend-common', wcuf_PLUGIN_PATH.'/css/wcuf-frontend-common.css');
			wp_enqueue_style('wcuf-magnific-popup', wcuf_PLUGIN_PATH.'/css/vendor/magnific-popup.css');
			wp_enqueue_style('wcuf-checkout', wcuf_PLUGIN_PATH. '/css/wcuf-frontend-shortcode.css'  );
			wp_enqueue_style('wcuf-cropper', wcuf_PLUGIN_PATH.'/css/vendor/cropper/cropper.min.css');			
			//PDF: Flipbook
			wp_enqueue_style('wcuf-pdf', wcuf_PLUGIN_PATH.'/css/vendor/flipbook/min.css');
			wp_enqueue_style('wcuf-pdf-theme', wcuf_PLUGIN_PATH.'/css/vendor/flipbook/themify-icons.min.css');
			
			ob_start();
			if(file_exists ( get_theme_file_path()."/wcuf/alert_popup.php" ))
				include get_theme_file_path()."/wcuf/alert_popup.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/alert_popup.php';
				
			if(file_exists ( get_theme_file_path()."/wcuf/cropper.php" ))
				include get_theme_file_path()."/wcuf/cropper.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/cropper.php';
			
			echo '<div class="wcuf_shortcode_ajax_container_loading_container" id="wcuf_shortcode_ajax_container_loading_container_'.$container_unique_id.'"></div>';
			echo '<div class="wcuf_shortcode_ajax_container" id="wcuf_shortcode_ajax_container_'.$container_unique_id.'" style="opacity:0;">';
		}
		
		include WCUF_PLUGIN_ABS_PATH.'/template/checkout_cart_product_page_template.php';
		if(!$is_ajax_request)
		{			
			echo '</div>';
			
			$js_options = array(
					'cart_quantity_as_number_of_uploaded_files' 				=> $all_options['cart_quantity_as_number_of_uploaded_files'] && 
																					$wcuf_product_model->multipurose_check($wc_product,false,1,false, array('check_if_manual_quantity_selection_can_be_disabled' => true))
																					? 'true' : 'false',
					'icon_path' 												=> wcuf_PLUGIN_PATH."/img/icons/",
					'current_item_cart_id'										=> "",
					'current_product_id'					   					=> 0,
					'current_page'												=> $current_page,
					'exists_a_field_to_show_before_adding_item_to_cart' 		=> $exists_a_field_to_show_before_adding_item_to_cart ? "true" : "false",
					'has_already_added_to_cart' 								=> isset($has_already_added_to_cart) && $has_already_added_to_cart? "true" : "false",
				    'exists_at_least_one_upload_field_bounded_to_variations'	=> $exists_at_least_one_upload_field_bounded_to_variations ? "true" : "false",
				    'exists_at_least_one_upload_field_bounded_to_gateway' 		=> $exists_at_least_one_upload_field_bounded_to_gateway ? "true" : "false",
					'crop_rotation_method' 										=> $all_options['crop_rotation_method'],
					'crop_method' 												=> $all_options['crop_method'],
					'security' 													=> wp_create_nonce('wcuf_security_upload'),
					'disable_zoom_controller' 									=> $all_options['crop_disable_zoom_controller'] ? "true" : "false",
					'tm_extra_product_edit_page' 								=> $tm_extra_product_edit_page ? "true" : "false",
					'used_by_shortcode' 										=> "true"
					
				);
			
			wp_localize_script( 'wcuf-frontend-ui-manager', 'wcuf_options', $js_options );
			wp_localize_script( 'wcuf-ajax-upload-file', 'wcuf_options', $js_options );
			wp_localize_script( 'wcuf-frontend-cropper', 'wcuf_options', $js_options );	
			
			wp_enqueue_script( 'wcuf-ajax-upload-file' );
			wp_enqueue_script( 'wcuf-frontend-ui-manager' );
			wp_enqueue_script( 'wcuf-frontend-cropper' );
			return ob_get_clean();
		}
		else
		{
			wp_die();
		}		
	}
	public function wcuf_upload_form_last_order($atts)
	{
		 
		if(@is_product() || @is_cart() || @is_checkout())
			return;
		
		global $wcuf_order_details_page_addon, $wcuf_customer_model, $wcuf_order_model;
		
		$last_order_id = $wcuf_customer_model->get_current_customer_last_order_id();
		ob_start();
		if($last_order_id > 0)
			$wcuf_order_details_page_addon->front_end_order_page_addon(wc_get_order($last_order_id), true);
		else
			_e('You have no orders or you are not logged','woocommerce-files-upload');
		return ob_get_clean();
	}
	
	//Used only in product, cart, shortcode & checkout template
	public function get_file_names_with_additional_info($shortcode, $already_uploaded_message, $file_fields, $item_in_cart_temp, $product, $show_image_preview = false, $order_id = 0, $show_costs = true, $show_file_name = true, $show_delete_button = true, $additional_options = array())
	{
		global $wcuf_cart_model, $wcuf_file_model, $wcuf_media_model, $wcuf_session_model, $wcuf_option_model;
		$files_name = "";
		$ids = null;
		$global_ordered_list_counter = 1;
		
		$enable_quantity_selection = $wcuf_option_model->get_all_options('enable_quantity_selection');
		
		if(isset($item_in_cart_temp['name']))
			$is_zip = is_array($item_in_cart_temp['name']) && count($item_in_cart_temp['name']) > 1 && !isset($item_in_cart_temp['is_multiple_file_upload']) ? true : false; //No longer always true with new multiple file managment
		else
			$is_zip = is_array($item_in_cart_temp['original_filename']) && count($item_in_cart_temp['original_filename']) && !isset($item_in_cart_temp['is_multiple_file_upload']) > 1 ? true : false; //No longer always true with new multiple file managment
		
		if(!isset($item_in_cart_temp['name']) && isset($item_in_cart_temp['original_filename']))
					$item_in_cart_temp['name'] = $item_in_cart_temp['original_filename'];
		if(isset($item_in_cart_temp['name']))
		{
			$files_name = "";
			if(!is_array($item_in_cart_temp['name']))
				$item_in_cart_temp['name'] = array($item_in_cart_temp['name']);
			 
			{	
				$normal_uploads_counter = 1 ;
				if(isset($product))
					$ids = array('field_id' => $file_fields['id'], 'product_id' => $product['product_id'], 'variation_id' => $product['variation_id'] != "" ? $product['variation_id'] : null);
				
				$files_name .= '<ol class="wcuf_file_preview_list">';
				$already_processed = array();
				$file_fields['extra_cost_free_items_number'] = isset($file_fields['extra_cost_free_items_number']) ? $file_fields['extra_cost_free_items_number'] : 0;
				$file_fields['extra_cost_overcharge_limit'] = isset($file_fields['extra_cost_overcharge_limit']) ? $file_fields['extra_cost_overcharge_limit'] : 0;
				$file_fields['extra_cost_free_seconds'] = isset($file_fields['extra_cost_free_seconds']) ? $file_fields['extra_cost_free_seconds'] : 0;
				$file_fields['extra_costs_consider_sum_of_all_file_seconds'] = isset($file_fields['extra_costs_consider_sum_of_all_file_seconds']) ? $file_fields['extra_costs_consider_sum_of_all_file_seconds'] : false;
				$feedback_label = isset($file_fields['text_field_label']) ? $file_fields['text_field_label'] : "";
				
				//free item count
				$all_quantities = 0;
				foreach((array)$item_in_cart_temp['name'] as $counter => $temp_file_name)	
				{
					$all_quantities += is_array($item_in_cart_temp['quantity'][$counter]) ? array_sum($item_in_cart_temp['quantity'][$counter]) : $item_in_cart_temp['quantity'][$counter];
					
				}
				$extra_cost_free_items_number = $file_fields['extra_cost_free_items_number'];
				if($file_fields['extra_cost_overcharge_limit'] != 0 && isset($item_in_cart_temp['name']) && $file_fields['extra_cost_overcharge_limit'] < $all_quantities - $file_fields['extra_cost_free_items_number'] )
					$extra_cost_free_items_number = $file_fields['extra_cost_free_items_number'] +=  $all_quantities - $file_fields['extra_cost_overcharge_limit'] - $file_fields['extra_cost_free_items_number'];
				$extra_cost_free_items_number = $extra_cost_free_items_number < 0 ? 0 : $extra_cost_free_items_number;
				
				//Media file costs managment
				if(is_array($item_in_cart_temp['ID3_info']))
					foreach((array)$item_in_cart_temp['ID3_info'] as $temp_file_name)
					{
						if(isset($temp_file_name['quantity']))
							$temp_file_name['quantity'] = is_array($temp_file_name['quantity']) ? array_sum($temp_file_name['quantity']) : $temp_file_name['quantity'];
						$quantity = isset($temp_file_name['quantity']) ? $temp_file_name['quantity'] : 1;
						$price_and_max_overcharge_seconds = array('price' =>"");
						//Additional costs per secods
						if($show_costs && isset($file_fields['extra_cost_media_enabled']) && $file_fields['extra_cost_media_enabled'])
						{
							//free seconds managment
							$temp_file_name['playtime_seconds'] = $temp_file_name['playtime_seconds'] - $file_fields['extra_cost_free_seconds'] < 0 ? 0 : $temp_file_name['playtime_seconds'] - $file_fields['extra_cost_free_seconds'];
							$file_fields['extra_cost_overcharge_seconds_limit'] = $file_fields['extra_cost_overcharge_seconds_limit'] != 0 ? $file_fields['extra_cost_overcharge_seconds_limit'] + $file_fields['extra_cost_free_seconds'] : 0;
							
							$price_and_max_overcharge_seconds = $wcuf_cart_model->get_additional_costs($temp_file_name['playtime_seconds']*$quantity, 0, $file_fields['extra_cost_overcharge_seconds_limit'], $file_fields['extra_cost_per_second_value'], 'fixed' , null,true);
							if($price_and_max_overcharge_seconds['price'] === 0)
							{
								$price_and_max_overcharge_seconds['price'] = esc_html__('Free!', 'woocommerce-files-upload'); 
							}
							else 
							{
								$sign = $price_and_max_overcharge_seconds['price'] > 0 ? "" : "";
								$price_and_max_overcharge_seconds['price'] = $sign.$price_and_max_overcharge_seconds['price'].esc_html__(' (seconds cost)', 'woocommerce-files-upload');
							}
						}
						//Additional cost per upload (sum seconds and cost per upload). If file is processed here will no be reprocesse in #2 iteration (see below)
						if($show_costs && isset($ids) && isset($file_fields['extra_cost_enabled']) && $file_fields['extra_cost_enabled'] && ($file_fields['extra_cost_overcharge_limit'] != 0 || $file_fields['extra_cost_overcharge_limit'] <= $normal_uploads_counter))
						{
							$price = $wcuf_cart_model->get_additional_costs($quantity , 0, $file_fields['extra_cost_overcharge_limit'], $file_fields['extra_cost_value'], $file_fields['extra_overcharge_type'], $ids, true);
							$sign = $price['price'] > 0 ? " +" : " ";
							$price_and_max_overcharge_seconds['price'] .= $sign.$price['price'].esc_html__(' (cost per upload)', 'woocommerce-files-upload');
							
							//forcing to display 0€ for the free items
							if($extra_cost_free_items_number != 0 && $price['price'] != "")
							{
								if($extra_cost_free_items_number - $quantity > 0)
								{
									$price_and_max_overcharge_seconds['price'] = esc_html__('Free!', 'woocommerce-files-upload'); //sprintf(get_woocommerce_price_format(), get_woocommerce_currency_symbol(), 0);
									$extra_cost_free_items_number = $extra_cost_free_items_number - $quantity;						
								}
								else
								{
									$tmp_price = $price['single_numeric_price'] * ($quantity - $extra_cost_free_items_number);
									$price_and_max_overcharge_seconds['price'] = $tmp_price == 0 ? esc_html__('Free!', 'woocommerce-files-upload') :  sprintf(get_woocommerce_price_format(), get_woocommerce_currency_symbol(), $tmp_price );
									$extra_cost_free_items_number = 0;
									$this->total_costs[$global_ordered_list_counter] = $tmp_price;
								}
							}
							 else if($price['price'] != "")
								$this->total_costs[$global_ordered_list_counter] = $price['single_numeric_price'] * $price['num']; 
						}
						$index =  isset($temp_file_name['index']) ? $temp_file_name['index'] : -1;
						$preview_html = $show_image_preview && $index > -1 ? $wcuf_media_model->get_media_preview_html($item_in_cart_temp,$temp_file_name["file_name"], $is_zip, $order_id, $index) : "";
						
						$file_name = $show_file_name ? $temp_file_name['file_name'] : "";
						$quantity_string = $quantity > 0 && $enable_quantity_selection ? esc_html__('Quantity: ', 'woocommerce-files-upload').$quantity:"";
						$delete_button_html = $show_delete_button  ? '<i data-id="'.$index.'" data-field-id="'.$item_in_cart_temp['upload_field_id'].'" class="wcuf_delete_single_file_stored_on_server wcuf_delete_file_icon"></i>' : "";
						$feedback =  in_array('feedback_text', $additional_options) && isset($item_in_cart_temp['user_feedback']) ?  $feedback_label.": ".$item_in_cart_temp['user_feedback'] : "";	
						$price_and_max_overcharge_seconds['price'] = $price_and_max_overcharge_seconds['price'] != "" ? esc_html__('Cost: ', 'woocommerce-files-upload').$price_and_max_overcharge_seconds['price'] : $price_and_max_overcharge_seconds['price'];	
						
						if($file_fields['extra_costs_consider_sum_of_all_file_seconds'])
							$price_and_max_overcharge_seconds['price'] = "";
						
						$file_name = '<span class="wcuf_single_file_name_in_multiple_list">'.$file_name.'</span>';
						$files_name .= '<li class="wcuf_file_preview_list_item"><span class="wcuf_preview_file_title">'.$global_ordered_list_counter.". ".$file_name.$delete_button_html.'</span>'
										.'<span class="wcuf_preview_quantity">'.esc_html__('Length: ', 'woocommerce-files-upload').$temp_file_name['playtime_string'].'</span>'
										.'<span class="wcuf_preview_quantity">'.$quantity_string.'</span>'
										.'<span class="wcuf_preview_price">'.$price_and_max_overcharge_seconds['price'].'</span>'
										.'<span class="wcuf_preview_feedback">'.$feedback.'</span>'
										.apply_filters('wcuf_file_preview_list_media_item', "", $item_in_cart_temp, $counter, $file_fields)
										.$preview_html.'</li>';
						$normal_uploads_counter++;
						$global_ordered_list_counter++;
						
						//Used in for #2 iteration to not reprocess an item
						if(isset( $temp_file_name['file_name_unique']))
							$already_processed[$temp_file_name['file_name_unique']] = true;
						else
							$already_processed[$temp_file_name['file_name']] = true;
					}
					
				//Remaining file types managment	
				$normal_uploads_counter = 1 ;
				
				//************** #2 iteration (no mendia type) ********************
				foreach((array)$item_in_cart_temp['name'] as $counter => $temp_file_name)
				{
					$price = array('price' =>"");
					if(isset($item_in_cart_temp['quantity'][$counter]))
						$item_in_cart_temp['quantity'][$counter] = is_array($item_in_cart_temp['quantity'][$counter]) ? array_sum($item_in_cart_temp['quantity'][$counter]) : $item_in_cart_temp['quantity'][$counter];
					$quantity = isset($item_in_cart_temp['quantity'][$counter]) ? $item_in_cart_temp['quantity'][$counter] : 1;
					
					if(!isset($already_processed[$temp_file_name])) //If file has not already been processed
					{
						$price_per_item = "";
						if($show_costs && isset($ids) && isset($file_fields['extra_cost_enabled']) && $file_fields['extra_cost_enabled'] && ($file_fields['extra_cost_overcharge_limit'] != 0 || $file_fields['extra_cost_overcharge_limit'] <= $normal_uploads_counter))
						{
							$price = $wcuf_cart_model->get_additional_costs($quantity, 0, $file_fields['extra_cost_overcharge_limit'], $file_fields['extra_cost_value'], $file_fields['extra_overcharge_type'], $ids, true);
							$normal_uploads_counter++;
						}
						if(!isset($item_in_cart_temp['tmp_name']))
							$item_in_cart_temp['tmp_name'] = $item_in_cart_temp['absolute_path'];
						$image_preview_html = $show_image_preview ? $wcuf_media_model->get_media_preview_html($item_in_cart_temp,$temp_file_name, $is_zip, $order_id, $counter) : "";
						$download_button =isset($item_in_cart_temp['download_url'][$counter]) && $file_fields['user_can_download_his_files'] ? '<a class="button download_small_button" href="'.$item_in_cart_temp['download_url'][$counter].'" target="_blank" download>'.esc_html__("Download / View file", "woocommerce-files-upload").'</a>' : "";
						$file_name = $show_file_name ? $temp_file_name : "";
						$quantity_string = $quantity > 0 && $enable_quantity_selection ? esc_html__('Quantity: ', 'woocommerce-files-upload').$quantity:"";
						$delete_button_html = $show_delete_button  ? '<i data-id="'.$counter.'" data-field-id="'.$item_in_cart_temp['upload_field_id'].'" class="wcuf_delete_single_file_stored_on_server wcuf_delete_file_icon"></i>' : false;
						$feedback =  in_array('feedback_text', $additional_options) && isset($item_in_cart_temp['user_feedback']) ?  $feedback_label.": ".$item_in_cart_temp['user_feedback'] : "";
						
						//forcing to display 0€ for the free items
						if($extra_cost_free_items_number != 0 && $price['price'] != "")
						{
							if($extra_cost_free_items_number - $quantity > 0)
							{
								$price['price'] = esc_html__('Free!', 'woocommerce-files-upload');
								$extra_cost_free_items_number = $extra_cost_free_items_number - $quantity;						
							}
							else
							{
								$tmp_price = $price['single_numeric_price'] * ($quantity - $extra_cost_free_items_number);
								$price['price'] = $tmp_price == 0 ? esc_html__('Free!', 'woocommerce-files-upload') : sprintf(get_woocommerce_price_format(), get_woocommerce_currency_symbol(),  $tmp_price);
								$extra_cost_free_items_number = 0;
								$this->total_costs[$global_ordered_list_counter] = $tmp_price;
							}
						}
						else if($price['price'] != "")
						{
							$this->total_costs[$global_ordered_list_counter] = $price['single_numeric_price'] * $price['num'];
						} 
					
						$price['price'] = $price['price'] != "" ? esc_html__('Cost: ', 'woocommerce-files-upload').$price['price'] : $price['price'];
						
						if($file_name != "" || $image_preview_html != "")
						{
							$file_name = '<span class="wcuf_single_file_name_in_multiple_list">'.$file_name.'</span>';
							$files_name .= '<li class="wcuf_file_preview_list_item"><span class="wcuf_preview_file_title">'.$global_ordered_list_counter.". ".$file_name.$delete_button_html.'</span>'
										.'<span class="wcuf_preview_quantity">'.$quantity_string.'</span>'
										.'<span class="wcuf_preview_price">'.$price['price'].'</span>'
										.'<span class="wcuf_preview_feedback">'.$feedback.'</span>'
										.apply_filters('wcuf_file_preview_list_item', "", $item_in_cart_temp, $counter, $file_fields)
										.$image_preview_html.$download_button.'</li>';
							$global_ordered_list_counter++;							
						}
					}
					//$counter++;
				}
				$files_name .= "</ol>";
			}
		}
		$result =  str_replace($shortcode,  $files_name, $already_uploaded_message);
		
		return $result;
	}
	
	//used only order details page
	function get_file_names($shortcode, $already_uploaded_message, $file_fields, $uploaded_file_data, $show_image_preview = false, $order_id = 0, $show_delete_button = true, $additional_options = array('file_name'))
	{
		global $wcuf_file_model, $wcuf_media_model, $wcuf_upload_field_model, $wcuf_option_model;
		$files_name = "";
		$global_ordered_list_counter = 1;
		$enable_quantity_selection = $wcuf_option_model->get_all_options('enable_quantity_selection');
		//already performed in the view_order template. If needed, uncomment: $uploaded_file_data['url'] = $wcuf_upload_field_model->get_secure_urls($order_id, "none", $uploaded_file_data);
		
		if(isset($uploaded_file_data['original_filename']))
		{
			if(isset($uploaded_file_data['name']))	
				$is_zip = is_array($uploaded_file_data['name']) && count($uploaded_file_data['name']) > 1 && !isset($uploaded_file_data['is_multiple_file_upload']) ? true : false; //No longer always true with new multiple file managment
			else
				$is_zip = is_array($uploaded_file_data['original_filename']) && count($uploaded_file_data['original_filename']) > 1 && !isset($uploaded_file_data['is_multiple_file_upload']) ? true : false; //No longer always true with new multiple file managment
			
			$files_name = "";
			$feedback_label = isset($file_fields['text_field_label']) ? $file_fields['text_field_label'] : "";
			
			if(!is_array($uploaded_file_data['original_filename']))
				$uploaded_file_data['original_filename'] = array($uploaded_file_data['original_filename']);
			
			
			$files_name .= '<ol class="wcuf_file_preview_list">';
			$already_processed = array();
			
			//Media (audio/video)
			if(is_array($uploaded_file_data['ID3_info']))
				foreach((array)$uploaded_file_data['ID3_info'] as $counter => $temp_file_name)
				{
					if(isset($temp_file_name['quantity']))
						$temp_file_name['quantity'] = is_array($temp_file_name['quantity']) ? array_sum($temp_file_name['quantity']) : $temp_file_name['quantity'];
					$quantity = isset($temp_file_name['quantity']) ? $temp_file_name['quantity'] : 1;
					$quantity_string = $quantity > 0 && $enable_quantity_selection ? esc_html__('Quantity: ', 'woocommerce-files-upload').$quantity:"";
					//new download/view managment
					$index =  isset($temp_file_name['index']) ? $temp_file_name['index'] : -1;
					$file_url = isset($uploaded_file_data['url'][$index]) ? $uploaded_file_data['url'][$index] : "";
					$download_button = isset($uploaded_file_data['url'][$index]) && $file_fields['user_can_download_his_files'] ? '<a class="button download_small_button" href="'.$file_url.'" target="_blank" download>'.esc_html__("Download / View file", "woocommerce-files-upload").'</a>' : "";
					$feedback =  in_array('feedback_text', $additional_options) && isset($uploaded_file_data['user_feedback']) ?  $feedback_label.": ".$uploaded_file_data['user_feedback'] : "";
					//approval
					$enable_approval = wcuf_get_value_if_set($file_fields, 'enable_file_approval', 'false') == "true";										  //general settings
					$disable_file_approval_per_single_file = wcuf_get_value_if_set($file_fields, 'disable_file_approval_per_single_file', 'false') == "true"; //general settings
					$status = wcuf_get_value_if_set($uploaded_file_data, array('approval', 'status', $counter), 'waiting-for-approval');  					 //retrieved from order metadata
					$can_be_deleted = !$enable_approval || (!$disable_file_approval_per_single_file && $status == 'rejected');
					$approva_feedback = wcuf_get_value_if_set($uploaded_file_data, array('approval', 'feedback', $counter), '');
					$delete_button_html = $show_delete_button && $can_be_deleted ? '<i data-id="'.$temp_file_name['index'].'" data-field-id="'.$uploaded_file_data['id'].'" class="wcuf_delete_single_file_stored_on_server wcuf_delete_file_icon"></i>' : false;
					$approval_status_text = "";
					if($enable_approval && !$disable_file_approval_per_single_file)
					{
						$approval_status_text = '<div class="wcuf-approval-area">';
						$approval_status_text .= '<span class="wcuf-approval-status wcuf-approval-status-'.$status.'">'.$wcuf_upload_field_model->get_approval_label_from_status($status).'</span>';
						$approval_status_text .= '<p class="wcuf-approval-feedback">'.$approva_feedback.'</p>';
						$approval_status_text .= '</div>';
					}
					
					$temp_file_name['file_name'] =  !in_array('file_name', $additional_options) ? "" : $temp_file_name['file_name'];
					$preview_html = $show_image_preview && $index > -1 ? $wcuf_media_model->get_media_preview_html($uploaded_file_data,$temp_file_name["file_name"], $is_zip, $order_id, $index) : "";
					$file_name = '<span class="wcuf_single_file_name_in_multiple_list">'.$temp_file_name['file_name'].'</span>';
					$files_name .= '<li class="wcuf_file_preview_list_item"><span class="wcuf_preview_file_title">'.$global_ordered_list_counter.". ".$file_name.$delete_button_html." </span>"
						.'<span class="wcuf_preview_quantity">'.esc_html__('Length: ', 'woocommerce-files-upload').$temp_file_name['playtime_string'].'</span>'
						.'<span class="wcuf_preview_quantity">'.$quantity_string.'</span>'
						.'<span class="wcuf_preview_feedback">'.$feedback.'</span>'
						.$preview_html." ".$approval_status_text." ".$download_button
					."</li>";
					$global_ordered_list_counter++; 
					
					if(isset( $temp_file_name['file_name_unique']))
						$already_processed[$temp_file_name['file_name_unique']] = true;
					else
						$already_processed[$temp_file_name['file_name']] = true;
					
				}
			
			
			//Non media
			foreach((array)$uploaded_file_data['original_filename'] as $counter => $temp_file_name)
			{
				if(isset($uploaded_file_data['quantity'][$counter]))
					$uploaded_file_data['quantity'][$counter] = is_array($uploaded_file_data['quantity'][$counter]) ? array_sum($uploaded_file_data['quantity'][$counter]) : $uploaded_file_data['quantity'][$counter];
				$quantity = isset($uploaded_file_data['quantity'][$counter]) ? $uploaded_file_data['quantity'][$counter] : 1;
				$quantity_string = $quantity > 0 && $enable_quantity_selection ? esc_html__('Quantity: ', 'woocommerce-files-upload').$quantity:"";
				if(!isset($uploaded_file_data['tmp_name']))
					$uploaded_file_data['tmp_name'] = $uploaded_file_data['absolute_path'];
				
				if(!isset($already_processed[$temp_file_name]))
				{
					//new download/view managment
					$image_preview_html = $show_image_preview ? $wcuf_media_model->get_media_preview_html($uploaded_file_data,$temp_file_name, $is_zip, $order_id, $counter) : "";
					$file_url = isset($uploaded_file_data['url'][$counter]) ? $uploaded_file_data['url'][$counter] : $uploaded_file_data['url'];
					$download_button =isset($uploaded_file_data['url'][$counter]) && $file_fields['user_can_download_his_files'] ? '<a class="button download_small_button" href="'.$file_url.'" target="_blank" download>'.esc_html__("Download / View file", "woocommerce-files-upload").'</a>' : "";
					$feedback =  in_array('feedback_text', $additional_options) && isset($uploaded_file_data['user_feedback']) ?  $feedback_label.": ".$uploaded_file_data['user_feedback'] : "";
					//approval
					$enable_approval = wcuf_get_value_if_set($file_fields, 'enable_file_approval', 'false') == "true"; 										  //general settings
					$disable_file_approval_per_single_file = wcuf_get_value_if_set($file_fields, 'disable_file_approval_per_single_file', 'false') == "true"; //general settings
					$status = wcuf_get_value_if_set($uploaded_file_data, array('approval', 'status', $counter), 'waiting-for-approval');					  //retrieved from order metadata
					$approva_feedback = wcuf_get_value_if_set($uploaded_file_data, array('approval', 'feedback', $counter), '');					  
					$can_be_deleted = !$enable_approval || (!$disable_file_approval_per_single_file && $status == 'rejected');
					$delete_button_html = $show_delete_button && $can_be_deleted ? '<i data-id="'.$counter.'" data-field-id="'.$uploaded_file_data['id'].'" class="wcuf_delete_single_file_stored_on_server wcuf_delete_file_icon"></i>' : false;
					$approval_status_text = "";
					if($enable_approval && !$disable_file_approval_per_single_file)
					{
						$approval_status_text = '<div class="wcuf-approval-area">';
						$approval_status_text .= '<span class="wcuf-approval-status wcuf-approval-status-'.$status.'">'.$wcuf_upload_field_model->get_approval_label_from_status($status).'</span>';
						$approval_status_text .= '<p class="wcuf-approval-feedback">'.$approva_feedback.'</p>';
						$approval_status_text .= '</div>';
					}
					
					$temp_file_name =  !in_array('file_name', $additional_options) ? "" : $temp_file_name;
					$temp_file_name = '<span class="wcuf_single_file_name_in_multiple_list">'.$temp_file_name.'</span>';
					$files_name .= '<li class="wcuf_file_preview_list_item"><span class="wcuf_preview_file_title">'.$global_ordered_list_counter.". ".$temp_file_name.$delete_button_html."</span> "
						.'<span class="wcuf_preview_quantity">'.$quantity_string.'</span>'
						.'<span class="wcuf_preview_feedback">'.$feedback.'</span>'
						.$image_preview_html.$approval_status_text.$download_button
					."</li>";
					$global_ordered_list_counter++;
				}
				
			}
			$files_name .= "</ol>";
			
		}
		$result = str_replace($shortcode,  $files_name, $already_uploaded_message);
		return $result;
	}
	
	public function uploaded_files_num($already_uploaded_message, $file_fields, $item_in_cart_temp)
	{
		$num = isset($item_in_cart_temp['num_uploaded_files']) ? $item_in_cart_temp['num_uploaded_files'] : "";
		return str_replace('[uploaded_files_num]', $num, $already_uploaded_message);
	}
	public function pdf_total_pag_num($already_uploaded_message, $file_fields, $data)
	{
		$total = 0;
		
		foreach($data['number_of_pages'] as $tmp_qty)
			$total += $tmp_qty;
		return str_replace('[pdf_total_pag_num]', $total, $already_uploaded_message);
	}
	public function additional_costs($already_uploaded_message, $file_fields_groups, $item_in_cart_temp,$file_fields,$product)
	{
		global $wcuf_cart_model;
		$extra_costs = $wcuf_cart_model->get_sum_of_all_additional_costs($file_fields_groups, $item_in_cart_temp, $file_fields['id'], $product);
		return str_replace('[additional_costs]', $extra_costs, $already_uploaded_message);			
	}
	public function total_costs()
	{
		return array_sum($this->total_costs);
	}
	
}
?>