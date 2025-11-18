<?php  
class WCUF_CartPage
{
	var $upload_form_is_active = false;
	var $form_was_already_rendered = false;
	public function __construct()
	{
		add_action( 'init', array( &$this, 'init' ));
		add_action( 'wp_ajax_reload_upload_fields_on_cart', array( &$this, 'ajax_reload_upload_fields' ));
		add_action( 'wp_ajax_nopriv_reload_upload_fields_on_cart', array( &$this, 'ajax_reload_upload_fields' ));
		add_action( 'woocommerce_after_cart_item_name', array( &$this, 'display_upload_area_after_cart_item' ), 99, 2);
		//NOTE: the 'woocommerce_cart_item_name' cannot be used. It removes some HTML (wp_kses_post) like the <input> tag
		
		//Upload form
		add_action('wp_head', array( &$this,'add_meta'));
		add_action('wp', array( &$this,'add_headers_meta'));
	}
	function init()
	{
		global $wcuf_option_model;
		$position = 'woocommerce_before_cart_table';
		try
		{
			$all_options = $wcuf_option_model->get_all_options();
			$position = $all_options['cart_page_positioning'];
		}catch(Exception $e){};
		
		add_action( $position, array( &$this, 'add_uploads_cart_page' ), 10, 1 ); //Cart page	
	}
	function display_upload_area_after_cart_item($cart_item, $cart_item_key)
	{
		global $wcuf_option_model;
		$display = $wcuf_option_model->get_all_options("cart_display_upload_fields_outside_product_table", false);
		
		if($display)
			return;
		$this->add_uploads_cart_page(true, false, false, array( 'is_cart_item_table' => true, 'cart_item' => $cart_item) );
	}
	function ajax_reload_upload_fields()
	{
		$product_id				= isset($_POST['product_id']) ? $_POST['product_id'] : 0;
		$container_unique_id 	= wcuf_get_value_if_set($_POST, 'container_unique_id', rand(1,500000));
		$cart_item 				= wcuf_get_value_if_set($_POST, 'cart_item_id', false);
		$cart_item 				= $cart_item ? WC()->cart->get_cart_item( $cart_item ) : false;
		$used_by_shortcode 		= wcuf_get_value_if_set($_POST, 'used_by_shortcode', false) == "true";
		$options 				= array('container_unique_id' => $container_unique_id, 'is_cart_item_table' => $cart_item != false, 'cart_item' => $cart_item);
		$this->add_uploads_cart_page(true, $used_by_shortcode, true, $options );
		wp_die();
	}
	public function add_uploads_cart_page($checkout, $used_by_shortcode = false, $is_ajax_request = false, $options = array())
	{
		
		$is_cart_item_table = wcuf_get_value_if_set($options, 'is_cart_item_table', false);
	
		if(wcuf_is_request_to_rest_api())
			return;
		
		/* if($this->form_was_already_rendered && !$is_cart_item_table)
			return; */
		
		if(!wcuf_is_a_supported_browser())
			return;
		
		global $wcuf_option_model, $wcuf_wpml_helper, $wcuf_session_model, $wcuf_cart_model, $wcuf_shortcodes,$wcuf_media_model,
		       $wcuf_product_model,$wcuf_text_model, $sitepress, $wcuf_customer_model, $wcuf_upload_field_model, $wcuf_time_model; 
		
		
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
		$current_page = 'cart';
		$cart_item_id = "none";
		$container_unique_id = wcuf_get_value_if_set($options, 'container_unique_id', rand(1,500000));
		$current_locale = $wcuf_wpml_helper->get_current_locale();
		$tm_extra_product_edit_page = false;
		$tm_extra_product_edit_page_ajax_request = false;
		$display_outside_product_table = $wcuf_option_model->get_all_options("cart_display_upload_fields_outside_product_table", false) || $used_by_shortcode;
		
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
		
		if(($this->upload_form_is_active && !$is_cart_item_table ) || (in_array($current_page, $check_if_standard_managment_is_disabled)  && !$used_by_shortcode))
			return;
		else
		{
			//$this->upload_form_is_active = true;
		}
			
		
		
		if(file_exists ( get_theme_file_path()."/wcuf/js/wcuf-frontend-cropperV2.js" ))
			$cropper_js_path = get_template_directory_uri()."/wcuf/js/wcuf-frontend-cropperV2.js";
		else
			$cropper_js_path = wcuf_PLUGIN_PATH.'/js/wcuf-frontend-cropperV2.js';
		$cropper_js_path = apply_filters('wcuf_get_js_cropper_path', $cropper_js_path);
		if(!$is_ajax_request)
		{
			do_action('wcuf_before_loading_frontend_pages_js_libraries');
			wp_enqueue_script('wcuf-image-size-checker', wcuf_PLUGIN_PATH. '/js/wcuf-image-size-checker.js' ,array('jquery'));	
			wp_register_script('wcuf-ajax-upload-file', wcuf_PLUGIN_PATH. '/js/wcuf-frontend-cart-checkout-product-page'.'_'.$current_locale.'.js' ,array('jquery','wp-hooks')); 
			wp_register_script('wcuf-multiple-file-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-multiple-file-manager.js', array('jquery') );
			wp_enqueue_script( 'wcuf-generic-file-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-generic-file-uploader.js', array('jquery') );
			wp_enqueue_script( 'wcuf-feedback-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-feedback-manager.js', array('jquery') );
			wp_register_script('wcuf-frontend-ui-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-ui-manager.js', array('jquery', 'wp-hooks'));
			wp_enqueue_script('wcuf-compressor', wcuf_PLUGIN_PATH.'/js/vendor/compressor/compressor.min.js', array('jquery'));
			
			wp_enqueue_script( 'wcuf-cart-page', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-cart-page.js', array('jquery') );
			
			wp_enqueue_script('wcuf-audio-video-file-manager', wcuf_PLUGIN_PATH. '/js/wcuf-audio-video-file-manager.js' ,array('jquery')); 
			wp_enqueue_script('wcuf-load-image', wcuf_PLUGIN_PATH. '/js/load-image.all.min.js' ,array('jquery'));  
			wp_enqueue_script('wcuf-cropper', wcuf_PLUGIN_PATH.'/js/vendor/cropper/cropper.min.js', array('jquery'));
			wp_register_script('wcuf-frontend-cropper', $cropper_js_path, array('jquery') ); 	
			
			wp_enqueue_script('wcuf-magnific-popup', wcuf_PLUGIN_PATH.'/js/vendor/jquery.magnific-popup.js', array('jquery'));
			wp_enqueue_script('wcuf-frontend-multiple-file-uploader', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-multiple-file-uploader.js', array('jquery'));
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
			wp_enqueue_style('wcuf-checkout', wcuf_PLUGIN_PATH. '/css/wcuf-frontend-cart.css');  
			wp_enqueue_style('wcuf-cropper', wcuf_PLUGIN_PATH.'/css/vendor/cropper/cropper.min.css');
			//PDF: Flipbook
			wp_enqueue_style('wcuf-pdf', wcuf_PLUGIN_PATH.'/css/vendor/flipbook/min.css');
			wp_enqueue_style('wcuf-pdf-theme', wcuf_PLUGIN_PATH.'/css/vendor/flipbook/themify-icons.min.css');
			
			if(!$is_cart_item_table)
			{
				if(file_exists ( get_theme_file_path()."/wcuf/alert_popup.php" ))
					include get_theme_file_path()."/wcuf/alert_popup.php";
				else
					include WCUF_PLUGIN_ABS_PATH.'/template/alert_popup.php';	
			}
			if(file_exists ( get_theme_file_path()."/wcuf/cropper.php" ))
				include get_theme_file_path()."/wcuf/cropper.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/cropper.php';
				
			echo '<div class="wcuf_cart_ajax_container_loading_container" id="wcuf_cart_ajax_container_loading_container_'.$container_unique_id.'"></div>';
			echo '<div class="wcuf_cart_ajax_container" id="wcuf_cart_ajax_container_'.$container_unique_id.'" style="opacity:0;">';
			
		}
		if(file_exists ( get_theme_file_path()."/wcuf/checkout_cart_product_page_template.php" ))
				include get_theme_file_path()."/wcuf/checkout_cart_product_page_template.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/checkout_cart_product_page_template.php';	
		$this->form_was_already_rendered = true;
		if(!$is_ajax_request)	
		{
			echo '</div>';
			$js_options = array(
				'icon_path' 												=> wcuf_PLUGIN_PATH."/img/icons/",
				'current_item_cart_id' 										=> "",
				'current_product_id' 										=> 0,
				'current_page' 												=> $current_page,
				'exists_a_field_to_show_before_adding_item_to_cart' 		=> $exists_a_field_to_show_before_adding_item_to_cart ? "true" : "false",
				'has_already_added_to_cart' 								=> isset($has_already_added_to_cart) && $has_already_added_to_cart? "true" : "false",
				'exists_at_least_one_upload_field_bounded_to_variations' 	=> $exists_at_least_one_upload_field_bounded_to_variations ? "true" : "false",
				'exists_at_least_one_upload_field_bounded_to_gateway'		=> $exists_at_least_one_upload_field_bounded_to_gateway ? "true" : "false",
				'hide_add_to_cart_button' 									=> $all_options['mandatory_hide_add_to_cart_button'] ? 'yes' : 'no',
				'crop_rotation_method' 										=> $all_options['crop_rotation_method'],
				'crop_method' 												=> $all_options['crop_method'],
				'security' 													=> wp_create_nonce('wcuf_security_upload'),
				'disable_zoom_controller' 									=> $all_options['crop_disable_zoom_controller'] ? "true" : "false",
				'tm_extra_product_edit_page' 								=> $tm_extra_product_edit_page ? "true" : "false",
				'used_by_shortcode' 										=> $used_by_shortcode ? "true" : "false"
			);
			
			wp_localize_script( 'wcuf-frontend-ui-manager', 'wcuf_options', $js_options );
			wp_localize_script( 'wcuf-multiple-file-manager', 'wcuf_options', $js_options );
			wp_localize_script( 'wcuf-ajax-upload-file', 'wcuf_options', $js_options );
			wp_localize_script( 'wcuf-frontend-cropper', 'wcuf_options', $js_options );	
			
			wp_enqueue_script( 'wcuf-frontend-ui-manager' );
			wp_enqueue_script( 'wcuf-ajax-upload-file' );
			wp_enqueue_script( 'wcuf-multiple-file-manager' ); 
			wp_enqueue_script( 'wcuf-frontend-cropper' );
			wp_enqueue_script( 'wcuf-global-error-catcher', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-global-error-catcher.js', array('jquery') );
		}
		else
		{
			wp_die();
		}
	}
	function add_meta()
	{
		if(function_exists('is_cart') && @is_cart())
		{
			
			 echo '<meta http-equiv="Cache-control" content="no-cache">';
			echo '<meta http-equiv="Expires" content="-1">';
		}
	}
	function add_headers_meta()
	{
		if(function_exists('is_cart') && @is_cart())
		{
			header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
			header('Pragma: no-cache');
		}
	}
}
?>