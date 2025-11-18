<?php  
class WCUF_CheckoutPage
{
	var $upload_form_is_active = false;
	var $popup_can_be_rendered = true;
	var $upload_metadata_saved_on_order = false;
	public function __construct()
	{
		
		add_action( 'init', array( &$this, 'init' ));
		//Upload form
		add_action( 'woocommerce_after_checkout_form', array( &$this, 'add_popup' ), 10, 1 ); //Checkout page
		
		//Before Checkout
		add_action('woocommerce_checkout_process', array( &$this, 'check_required_uploads_before_checkout_is_complete' )); 
		
		//Checkout item table
		add_filter('woocommerce_checkout_cart_item_quantity', array(&$this,'display_upload_area_after_cart_item'), 10, 3); 
		//NOTE: the 'woocommerce_cart_item_name' cannot be used. It removes some HTML (wp_kses_post) like the <input> tag
			
		add_action( 'wp_ajax_reload_upload_fields_on_checkout', array( &$this, 'ajax_add_uploads_checkout_page' ));
		add_action( 'wp_ajax_nopriv_reload_upload_fields_on_checkout', array( &$this, 'ajax_add_uploads_checkout_page' ));
		
		add_action('wp', array( &$this,'add_headers_meta'));
		add_action('wp_head', array( &$this,'add_meta'));
	}
	function init()
	{
		global $wcuf_option_model;
		$position = 'woocommerce_after_checkout_billing_form';
		$checkout_file_association_type = 'thank_you';
		try
		{
			$all_options = $wcuf_option_model->get_all_options();
			$position = $all_options['checkout_page_positioning'];
			$checkout_file_association_type =  $all_options['checkout_file_association_method'];
		}catch(Exception $e){};
		
		add_action( $position, array( &$this, 'add_uploads_checkout_page' ), 10, 1 ); //Checkout page
		
		if(defined('WC_VERSION') && version_compare( WC_VERSION, '3.0.7', '<' ))
			add_action('woocommerce_add_order_item_meta', array( &$this, 'update_order_item_meta' ),10,3); //Update order items meta
		else
			add_action('woocommerce_new_order_item', array( &$this, 'update_order_item_meta' ),10,3);
		
		
		//After Checkout
		if($checkout_file_association_type != 'thank_you')	
			add_action('woocommerce_checkout_order_processed', array( &$this, 'save_uploads_after_checkout' )); //After checkout
		else
			add_action('woocommerce_thankyou', array( &$this, 'save_uploads_after_checkout' ), 1, 1); //After checkout
	}
	function display_upload_area_after_cart_item($text, $cart_item, $cart_item_key)
	{
		global $wcuf_option_model;
		$display = $wcuf_option_model->get_all_options("checkout_display_upload_fields_outside_product_table", false);
		
		if($display)
			return;
		
		echo $text."<br/>";
		$this->add_uploads_checkout_page("checkout", false, false, "none", "none", array( 'is_cart_item_table' => $cart_item != false, 'cart_item' => $cart_item) );
	}
	function ajax_add_uploads_checkout_page() 
	{
		$payment_method 		= wcuf_get_value_if_set($_POST, 'payment_method', 'none');
		$shipping_method 		= wcuf_get_value_if_set($_POST, 'shipping_method', 'none');
		$container_unique_id 	= wcuf_get_value_if_set($_POST, 'container_unique_id', rand(1,500000));
		$cart_item 				= wcuf_get_value_if_set($_POST, 'cart_item_id', false);
		$cart_item 				= $cart_item ? WC()->cart->get_cart_item( $cart_item ) : false;
		$used_by_shortcode 		= wcuf_get_value_if_set($_POST, 'used_by_shortcode', false) == "true";
		$options 				= array('container_unique_id' => $container_unique_id, 'is_cart_item_table' => $cart_item != false, 'cart_item' => $cart_item);
		$this->add_uploads_checkout_page("",true, $used_by_shortcode, $payment_method, $shipping_method, $options);
	}
	function add_popup($checkout)
	{
		if(wcuf_is_request_to_rest_api())
			return;
		
		global $wcuf_option_model, $wcuf_text_model;
		if(!$this->popup_can_be_rendered)
			return;
		
		$this->popup_can_be_rendered = false;
		$all_options = $wcuf_option_model->get_all_options();
		$button_texts  = $wcuf_text_model->get_button_texts();
		if(file_exists ( get_theme_file_path()."/wcuf/alert_popup.php" ))
				include get_theme_file_path()."/wcuf/alert_popup.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/alert_popup.php';
			if(file_exists ( get_theme_file_path()."/wcuf/cropper.php" ))
				include get_theme_file_path()."/wcuf/cropper.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/cropper.php';
	}
	function add_uploads_checkout_page($checkout, $is_ajax_request = false, $used_by_shortcode = false, $current_payment_method = 'none', $current_shipping_method = 'none', $options = array()) 
	{
		if(wcuf_is_request_to_rest_api())
			return;
		
		if(!wcuf_is_a_supported_browser())
			return;
		
		
		global $wcuf_option_model, $wcuf_order_model, $wcuf_wpml_helper, $wcuf_session_model, $wcuf_cart_model, $wcuf_media_model,
		       $wcuf_shortcodes,$wcuf_product_model,$wcuf_text_model, $sitepress, $wcuf_customer_model, $wcuf_upload_field_model, $wcuf_time_model;
		
		$is_cart_item_table = wcuf_get_value_if_set($options, 'is_cart_item_table', false);
		$button_texts  = $wcuf_text_model->get_button_texts();
		$item_to_show_upload_fields = $wcuf_cart_model->get_sorted_cart_contents();
		$file_order_metadata = array();
		$file_fields_groups = $wcuf_option_model->get_fields_meta_data();
		$style_options = $wcuf_option_model->get_style_options();
		$crop_area_options = $wcuf_option_model->get_crop_area_options();
		$display_summary_box = $wcuf_option_model->get_all_options('display_summary_box_strategy');
		$summary_box_info_to_display = $wcuf_option_model->get_all_options('summary_box_info_to_display');
		$all_options = $wcuf_option_model->get_all_options();
		$additional_button_class = $all_options['additional_button_class'];
		$check_if_standard_managment_is_disabled = $all_options['pages_in_which_standard_upload_fields_managment_is_disabled'];
		$current_page = 'checkout';
		$container_unique_id = wcuf_get_value_if_set($options, 'container_unique_id', rand(1,500000));
		$cart_item_id = "none";
		$current_locale = $wcuf_wpml_helper->get_current_locale();		
		$tm_extra_product_edit_page = false;
		$tm_extra_product_edit_page_ajax_request = false;
		$display_outside_product_table = $wcuf_option_model->get_all_options("checkout_display_upload_fields_outside_product_table", false) || $used_by_shortcode;
		
		//When rendering on checkout page, before "place order" the upload area is reloaded twice. In order to avoid to lose the posted value, check in this way.
		$current_payment_method = isset($_POST['payment_method']) ? $_POST['payment_method'] : $current_payment_method; 
		$dafault_choosen_shipping_method = WC()->session->get( 'chosen_shipping_methods' ) ? WC()->session->get( 'chosen_shipping_methods' )[0] : "";
		$current_shipping_method = $current_shipping_method == 'none' ? $dafault_choosen_shipping_method : $current_shipping_method;
		$current_shipping_method = isset($_POST['shipping_method']) ? $_POST['shipping_method'] : $current_shipping_method; 
		
		if($is_cart_item_table)
		{
			$cart_item_id = $options['cart_item']["key"];
			$current_item_data = array("product_id" => $options['cart_item']['product_id'], "variation_id" => $options['cart_item']['variation_id'], "data" => $options['cart_item']['variation_id'] == 0 ? wc_get_product($options['cart_item']['product_id']) : wc_get_product($options['cart_item']['variation_id']));
			$current_product_id = $options['cart_item']['product_id'];
			foreach($item_to_show_upload_fields as $key => $tmp_product)
			{
				$individual_id = wcuf_get_value_if_set($tmp_product,WCUF_Cart::$sold_as_individual_item_cart_key_name, "");
				$individual_2_id = wcuf_get_value_if_set($options,array('cart_item',WCUF_Cart::$sold_as_individual_item_cart_key_name), "");
				if($tmp_product['product_id'].$tmp_product['variation_id'].$individual_id != $options['cart_item']['product_id'].$options['cart_item']['variation_id'].$individual_2_id)
					unset($item_to_show_upload_fields[$key]);
				
			}
		}
		
		if(($this->upload_form_is_active && !$is_cart_item_table) || (in_array($current_page,$check_if_standard_managment_is_disabled) && !$is_ajax_request && !$used_by_shortcode) )
		{
			$this->popup_can_be_rendered = false;
			return;
		}
		else
			$this->upload_form_is_active = true;
		
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
			wp_register_script( 'wcuf-multiple-file-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-multiple-file-manager.js', array('jquery') );
			wp_enqueue_script( 'wcuf-feedback-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-feedback-manager.js', array('jquery') );
			wp_register_script('wcuf-frontend-ui-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-ui-manager.js', array('jquery', 'wp-hooks'));
			wp_enqueue_script('wcuf-compressor', wcuf_PLUGIN_PATH.'/js/vendor/compressor/compressor.min.js', array('jquery'));
			
			wp_enqueue_script('wcuf-audio-video-file-manager', wcuf_PLUGIN_PATH. '/js/wcuf-audio-video-file-manager.js' ,array('jquery')); 
			wp_enqueue_script('wcuf-image-size-checker', wcuf_PLUGIN_PATH. '/js/wcuf-image-size-checker.js' ,array('jquery')); 
			wp_enqueue_script('wcuf-cropper', wcuf_PLUGIN_PATH.'/js/vendor/cropper/cropper.min.js', array('jquery'));
			wp_register_script('wcuf-frontend-cropper', $cropper_js_path, array('jquery') ); 
			wp_enqueue_script('wcuf-magnific-popup', wcuf_PLUGIN_PATH.'/js/vendor/jquery.magnific-popup.js', array('jquery'));
			wp_enqueue_script('wcuf-checkout-page', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-checkout-page.js', array('jquery'));
			wp_enqueue_script('wcuf-frontend-multiple-file-uploader', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-multiple-file-uploader.js', array('jquery'));
			wp_enqueue_script( 'wcuf-generic-file-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-generic-file-uploader.js', array('jquery') );
			//PDF: thumb preview
			wp_enqueue_script('wcuf-pdf-preview-thumb', wcuf_PLUGIN_PATH.'/js/vendor/pdf/pdfThumbnails.js', array('jquery'));
			$pdf_thumb_opt = array( 'plugins_path' =>wcuf_PLUGIN_PATH );
			wp_localize_script( 'wcuf-pdf-preview-thumb', 'wcuf_pdf_thumb_opt', $pdf_thumb_opt );
			//PDF: Flipbook 
			wp_enqueue_script('wcuf-pdf', wcuf_PLUGIN_PATH.'/js/vendor/flipbook/dflip.min.js', array('jquery')); 
			$pdf_flipbook_opt = array( 'plugins_path' =>wcuf_PLUGIN_PATH ); //after wp_enqueue_script
			wp_localize_script( 'wcuf-pdf', 'wcuf_flipbook_opt', $pdf_flipbook_opt );
			
			wp_enqueue_style('wcuf-magnific-popup', wcuf_PLUGIN_PATH.'/css/vendor/magnific-popup.css');	
			wp_enqueue_style('wcuf-frontend-common', wcuf_PLUGIN_PATH.'/css/wcuf-frontend-common.css');		
			wp_enqueue_style('wcuf-checkout', wcuf_PLUGIN_PATH. '/css/wcuf-frontend-checkout.css' );  
			wp_enqueue_style('wcuf-cropper', wcuf_PLUGIN_PATH.'/css/vendor/cropper/cropper.min.css');
			//PDF: Flipbook
			wp_enqueue_style('wcuf-pdf', wcuf_PLUGIN_PATH.'/css/vendor/flipbook/min.css');
			wp_enqueue_style('wcuf-pdf-theme', wcuf_PLUGIN_PATH.'/css/vendor/flipbook/themify-icons.min.css');
			
			echo '<div class="wcuf_checkout_ajax_container_loading_container" id="wcuf_checkout_ajax_container_loading_container_'.$container_unique_id.'" ></div>';
			echo '<div class="wcuf_checkout_ajax_container" id="wcuf_checkout_ajax_container_'.$container_unique_id.'" style="opacity:1;">';
		}
		if(file_exists ( get_theme_file_path()."/wcuf/checkout_cart_product_page_template.php" ))
				include get_theme_file_path()."/wcuf/checkout_cart_product_page_template.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/checkout_cart_product_page_template.php';
		if(!$is_ajax_request)	
		{
			echo '</div>';
			$js_options = array(
				'icon_path' 													=> wcuf_PLUGIN_PATH."/img/icons/",
				'current_item_cart_id'										    => "",
				'current_product_id' 											=> 0,
				'current_page' 													=> $current_page,
				'exists_a_field_to_show_before_adding_item_to_cart' 			=> $exists_a_field_to_show_before_adding_item_to_cart ? "true" : "false",
				'has_already_added_to_cart' 									=> isset($has_already_added_to_cart) && $has_already_added_to_cart ? "true" : "false",
				'exists_at_least_one_upload_field_bounded_to_variations'		=> $exists_at_least_one_upload_field_bounded_to_variations ? "true" : "false",
				'exists_at_least_one_upload_field_bounded_to_gateway'			=> $exists_at_least_one_upload_field_bounded_to_gateway ? "true" : "false",
				'exists_at_least_one_upload_field_bounded_to_shipping_method' 	=> $exists_at_least_one_upload_field_bounded_to_shipping_method ? "true" : "false",
				'hide_add_to_cart_button' 										=> $all_options['mandatory_hide_add_to_cart_button'] ? 'yes' : 'no',
				'crop_rotation_method'											=> $all_options['crop_rotation_method'],
				'crop_method' 													=> $all_options['crop_method'],
				'security' 														=> wp_create_nonce('wcuf_security_upload'),
				'disable_zoom_controller' 										=> $all_options['crop_disable_zoom_controller'] ? "true" : "false",
				'tm_extra_product_edit_page' 									=> $tm_extra_product_edit_page ? "true" : "false",
				'used_by_shortcode' 											=> $used_by_shortcode ? "true" : "false"
			);
			
			wp_localize_script( 'wcuf-frontend-ui-manager', 'wcuf_options', $js_options );
			wp_localize_script( 'wcuf-multiple-file-manager', 'wcuf_options', $js_options );
			wp_localize_script( 'wcuf-ajax-upload-file', 'wcuf_options', $js_options );
			wp_localize_script( 'wcuf-frontend-cropper', 'wcuf_options', $js_options );	
			
			wp_enqueue_script( 'wcuf-ajax-upload-file' );
			wp_enqueue_script( 'wcuf-frontend-ui-manager' );  
			wp_enqueue_script( 'wcuf-multiple-file-manager' ); 
			wp_enqueue_script( 'wcuf-frontend-cropper' );
			wp_enqueue_script( 'wcuf-global-error-catcher', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-global-error-catcher.js', array('jquery') );			
		}
		else
		{
			wp_die();
		}
	}
	function check_required_uploads_before_checkout_is_complete($checkout_fields)
	{
		global $wcuf_product_model,$woocommerce, $wcuf_cart_model;
		$wcuf_cart_model->cart_update_validation();
		$cart = $woocommerce->cart->cart_contents;
		$upload_fields_already_processed = array();
		foreach((array)$cart as $cart_item)
		{
			$product = array();
			$product['product_id'] = $cart_item['product_id'];
			$product['variation_id'] = !isset($cart_item['variation_id']) || $cart_item['variation_id'] == "" ? 0 : $cart_item['variation_id'];
			$product[WCUF_Cart::$sold_as_individual_item_cart_key_name] = isset($cart_item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) ? $cart_item[WCUF_Cart::$sold_as_individual_item_cart_key_name] : null;
			
			$upload_fields_to_perform_upload = $wcuf_product_model->multipurose_check($product, true, $cart_item["quantity"]);
			$upload_fields_to_perform_upload = apply_filters('wcuf_mandatory_uploads_on_checkout_submission', $upload_fields_to_perform_upload, $checkout_fields);
			
			if(!empty($upload_fields_to_perform_upload))
				foreach((array)$upload_fields_to_perform_upload as $field_id => $upload_field)
				{
					if(in_array($field_id,$upload_fields_already_processed))
						continue;
						
					$upload_fields_already_processed[] = $field_id;
					if(isset($upload_field['num_uploaded_files_error']) && $upload_field['num_uploaded_files_error'])
					{
						if($upload_field['min_uploadable_files'] == $upload_field['max_uploadable_files'])
						{
							$additional_product_text = $upload_field['disable_stacking'] ? wcuf_html_escape_allowing_special_tags(sprintf(__(" for product <strong>%s</strong>",'woocommerce-files-upload'), '<a href="'.get_permalink( $upload_field['product_id'] ).'" target ="_blank">'.$upload_field['product_name'].'</a>'), false) : "";
							wc_add_notice( wcuf_html_escape_allowing_special_tags(sprintf(__('Upload <strong>%s</strong>%s requires <strong>%s file(s)</strong>. You have uploaded: <strong>%s file(s)</strong>. Please upload the requested number of files.','woocommerce-files-upload'), $upload_field['upload_field_name'], $additional_product_text, $upload_field['max_uploadable_files'],  $upload_field['num_uploaded_files']), false) ,'error');
							
						}
						else 
						{
							$additional_product_text = $upload_field['disable_stacking'] ? wcuf_html_escape_allowing_special_tags(sprintf(__(" for product <strong>%s</strong>",'woocommerce-files-upload'), '<a href="'.get_permalink( $upload_field['product_id'] ).'" target ="_blank">'.$upload_field['product_name'].'</a>'), false) : "";
							$num_uploaded_files_error = wcuf_html_escape_allowing_special_tags(sprintf(__("Upload <strong>%s</strong>%s requires", 'woocommerce-files-upload'), $upload_field['upload_field_name'], $additional_product_text), false);
							$num_uploaded_files_error .= $upload_field['min_uploadable_files'] != 0 ? wcuf_html_escape_allowing_special_tags(sprintf(__(" a minimum of <strong>%s file(s)</strong>", 'woocommerce-files-upload'), $upload_field['min_uploadable_files']), false) : "" ;
							$num_uploaded_files_error .= $upload_field['max_uploadable_files'] != 0 && $upload_field['min_uploadable_files'] != 0 ? wcuf_html_escape_allowing_special_tags(__(" and ", 'woocommerce-files-upload'), false) : "" ;
							$num_uploaded_files_error .= $upload_field['min_uploadable_files'] != 0 ?  wcuf_html_escape_allowing_special_tags(sprintf(__(" a maximum of <strong>%s file(s)</strong>", 'woocommerce-files-upload'),$upload_field['max_uploadable_files']), false): "" ;
							$num_uploaded_files_error .= ". ".wcuf_html_escape_allowing_special_tags(__('Please upload all the required files.','woocommerce-files-upload'), false);
							wc_add_notice($num_uploaded_files_error,'error');
						}
					}
					else
						wc_add_notice( wcuf_html_escape_allowing_special_tags(sprintf(__('Upload <strong>%s</strong> for product <strong>%s</strong> has not been performed.','woocommerce-files-upload'), $upload_field['upload_field_name'],'<a href="'.get_permalink( $upload_field['product_id'] ).'" target ="_blank">'.$upload_field['product_name'].'</a>'), false) ,'error');
				}					
					
		}
		
		
	}
	function update_order_item_meta($item_id, $values, $cart_item_key)
	{
		global $wcuf_cart_model;
		
		/* if(!$this->upload_metadata_saved_on_order)
			return; */
		
		if ( is_a( $values, 'WC_Order_Item_Product' ) ) 
		{
			if(!isset($values->legacy_values))
				return;
			
			$values = $values->legacy_values;
			
		} 
		
		if(isset($values[WCUF_Cart::$sold_as_individual_item_cart_key_name]))
		{
			wc_add_order_item_meta($item_id, '_'.WCUF_Cart::$sold_as_individual_item_cart_key_name, $values[WCUF_Cart::$sold_as_individual_item_cart_key_name], true);
			
		}
		
		//Extra price meta 
		$unique_id = isset($values[WCUF_Cart::$sold_as_individual_item_cart_key_name]) ? $values[WCUF_Cart::$sold_as_individual_item_cart_key_name] : 0;
		$item_data = array('product_id' => $values['product_id'] , 'variant_id'=> $values['variation_id'] , 'unique_product_id'=> $unique_id  );
		$new_item_price = $wcuf_cart_model->apply_or_get_extra_upload_costs(false, $item_data);
		if(isset($values['data']))
			foreach($new_item_price['additional_data'] as $data)
				{
					$cost = 'yes' !== get_option( 'woocommerce_prices_include_tax' ) ? WCUF_Tax::apply_tax_to_price( $values['data'], $data['single_cost']) : $data['single_cost'];  //total_cost
					$quantity_text = $data['quantity'] > 1 ? ' X '.$data['quantity'] : ""; 
					wc_add_order_item_meta($item_id, $data['label'], wc_price($cost).$quantity_text, true);
				}
	}
	function save_uploads_after_checkout( $order_id)
	{
		global $wcuf_file_model, $wcuf_option_model, $wcuf_session_model, $wcuf_upload_field_model;
		$status_to_ignore = array('cancelled', 'failed');
		if(defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) 
		  return $order_id;
		 
		$wcuf_session_model->tm_before_saving_meta_on_order();
		$temp_uploads = $wcuf_session_model->get_item_data();
		$order = wc_get_order($order_id);
		$status = $order->get_status();
			
		if(!empty($temp_uploads) && !in_array($status,$status_to_ignore))
		{
			$file_fields_groups =  $wcuf_option_model->get_fields_meta_data();
			
			$file_order_metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);
			$file_order_metadata = $wcuf_file_model->upload_files($order, $file_order_metadata, $file_fields_groups, $temp_uploads);
			
			$wcuf_session_model->remove_item_data();
			$this->upload_metadata_saved_on_order = true;
		}
		
	}
	function add_meta()
	{
		if(function_exists('is_checkout') && @is_checkout())
		{
			
			echo '<meta http-equiv="Cache-control" content="no-cache">';
			echo '<meta http-equiv="Expires" content="-1">';
		}
	}
	function add_headers_meta()
	{
		if(function_exists('is_checkout') && @is_checkout())
		{
			header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
			header('Pragma: no-cache');
		}
	}
}
?>