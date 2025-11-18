<?php 
class WCUF_OrderDetailsPage
{
	public function __construct()
	{
		add_action( 'init'												, array( &$this, 'init' ));
		add_filter( 'woocommerce_order_item_name'						, array( &$this, 'process_order_table_item_name' ),10, 3 );
		add_filter( 'woocommerce_order_item_get_formatted_meta_data'	, array( &$this, 'process_order_table_item_meta' ), 10, 2 ); 			//Used to remove the "wcuf_sold_as_individual_unique_key" metakey from the product table details
		add_action('woocommerce_order_item_meta_end'					, array( &$this, 'display_upload_area_after_cart_item' ), 99, 3);  		//Display upload fields in the product table
		
		add_action('wp_head', array( &$this,'add_meta'));
		add_action('wp', array( &$this,'add_headers_meta'));
	}
	function init()
	{
		global $wcuf_option_model;
		$position = 'woocommerce_order_details_after_order_table';
		try
		{
			$all_options = $wcuf_option_model->get_all_options();
			$position = $all_options['order_details_page_positioning'];
		}catch(Exception $e){};
		
		add_action( $position, array( &$this, 'front_end_order_page_addon' ));	
	}
	function display_upload_area_after_cart_item( $item_id, $item, $order)
	{
		$this->front_end_order_page_addon($order, false, true, array( 'is_item_table' => true, 'item' => $item) );
	}
	public function process_order_table_item_name($html_link, $item = null, $is_visible = true)
	{
		global $wcuf_order_model;	
		
		if(!isset($item))
			return $html_link;
			
		global $wcuf_option_model;
		$disable_unique_identifier = $wcuf_option_model->get_all_options("disable_unique_identifier", false);
		if($disable_unique_identifier)
			return $html_link;
		
		$item_individual_id = $wcuf_order_model->read_order_item_meta($item,'_wcuf_sold_as_individual_unique_key');
		
		return $item_individual_id ? $html_link." #".$item_individual_id : $html_link ;
	}
	public function process_order_table_item_meta($formatted_meta, $obj )
	{
		foreach($formatted_meta as $key => $metakey)
		{
			if($metakey->key == "wcuf_sold_as_individual_unique_key")
				unset($formatted_meta[$key]);
		}
		return $formatted_meta;
	}
	public function order_has_been_placed($order_id)
	{
		$this->front_end_order_page_addon(wc_get_order($order_id), false, true);
	}
	public function front_end_order_page_addon( $order, $is_shortcode = false , $avoid_thank_you_page_check = true, $options = array()  )
	{	
		if(wcuf_is_request_to_rest_api())
			return;
		
		if(!wcuf_is_a_supported_browser())
			return;
		
		
		global $wcuf_order_model, $wcuf_upload_field_model, $wcuf_file_model, $wcuf_option_model, $wcuf_wpml_helper, $wcuf_media_model,
		       $wcuf_session_model, $wcuf_cart_model, $wcuf_shortcodes,$wcuf_product_model,$wcuf_text_model, 
			   $sitepress, $wcuf_customer_model, $wcuf_upload_field_model, $wcuf_time_model;
		
		$is_cart_item_table = wcuf_get_value_if_set($options, 'is_item_table', false);
		$button_texts  = $wcuf_text_model->get_button_texts();
		$file_fields_groups = $wcuf_option_model->get_fields_meta_data();
		$order_id = $wcuf_order_model->get_order_id($order) ;
		$file_order_metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);
		$css_options = $wcuf_option_model->get_style_options();
		$crop_area_options = $wcuf_option_model->get_crop_area_options();
		$display_summary_box = $wcuf_option_model->get_all_options('display_summary_box_strategy');
		$all_options = $wcuf_option_model->get_all_options();
		$additional_button_class = $all_options['additional_button_class'];
		$order_items = $wcuf_order_model->get_sorted_order_items($order);
		$current_url = $this->curPageURL();
		$current_page = $is_shortcode ? "shortcode" : "order_details"; //no more used as shortcode template
		$is_order_completed_status = $wcuf_order_model->get_order_status($order) != 'completed' ? false : true;
		$is_thank_you_page = false;
		$wcuf_session_model->remove_item_data(null, true);
		$current_order_status = $wcuf_order_model->get_order_status($order) ;
		$summary_box_info_to_display = $wcuf_option_model->get_all_options('summary_box_info_to_display');
		$current_locale = $wcuf_wpml_helper->get_current_locale();
		$container_unique_id = rand(1,500000);
		
		if($is_cart_item_table)
		{
			$product_id 	= $options['item']->get_product_id();
			$variation_id 	= $options['item']->get_variation_id();
			$individual_id = $wcuf_order_model->read_order_item_meta($options['item'],'_wcuf_sold_as_individual_unique_key');
			$current_product_id = $product_id;
			$current_item_data = array("product_id" => $product_id, "variation_id" => $variation_id, "data" => $variation_id == 0 ? wc_get_product($variation_id) : wc_get_product($product_id));
			foreach($order_items as $key => $tmp_product)
			{
				$tmp_product_id 	= $tmp_product->get_product_id();
				$tmp_variation_id 	= $tmp_product->get_variation_id();
				$tmp_individual_id = $wcuf_order_model->read_order_item_meta($tmp_product,'_wcuf_sold_as_individual_unique_key');
				if($tmp_product_id.$tmp_variation_id.$tmp_individual_id != $product_id.$variation_id.$individual_id)
					unset($order_items[$key]);
				
			}
		}
		
		//woocommerce_order_details_after_order_table action is called even on thank you page. 
		// In case of thank you page, upload fields are rendered after the woocommerce_thankyou action has been triggered
		if(did_action('woocommerce_thankyou') > 0  && $avoid_thank_you_page_check )
		{
			$is_thank_you_page = true;
			$current_page = $is_shortcode ? "shortcode" : "thank_you";
			
		}
		
		if(file_exists ( get_theme_file_path()."/wcuf/js/wcuf-frontend-cropperV2.js" ))
			$cropper_js_path = get_template_directory_uri()."/wcuf/js/wcuf-frontend-cropperV2.js";
		else
			$cropper_js_path = wcuf_PLUGIN_PATH.'/js/wcuf-frontend-cropperV2.js';
		$cropper_js_path = apply_filters('wcuf_get_js_cropper_path', $cropper_js_path);	
		if($file_fields_groups)
		{
			do_action('wcuf_before_loading_frontend_pages_js_libraries');
			wp_enqueue_style('wcuf-frontend-common', wcuf_PLUGIN_PATH.'/css/wcuf-frontend-common.css');
			wp_enqueue_style('wcuf-order-detail', wcuf_PLUGIN_PATH.'/css/wcuf-frontend-order-detail.css' );
			wp_enqueue_style('wcuf-magnific-popup', wcuf_PLUGIN_PATH.'/css/vendor/magnific-popup.css');
			wp_enqueue_style('wcuf-cropper', wcuf_PLUGIN_PATH.'/css/vendor/cropper/cropper.min.css');
			//PDF: Flipbook
			wp_enqueue_style('wcuf-pdf', wcuf_PLUGIN_PATH.'/css/vendor/flipbook/min.css');
			wp_enqueue_style('wcuf-pdf-theme', wcuf_PLUGIN_PATH.'/css/vendor/flipbook/themify-icons.min.css');
			
			wp_enqueue_script('wcuf-magnific-popup', wcuf_PLUGIN_PATH.'/js/vendor/jquery.magnific-popup.js', array('jquery'));
			wp_enqueue_script('wcuf-compressor', wcuf_PLUGIN_PATH.'/js/vendor/compressor/compressor.min.js', array('jquery'));
			wp_register_script('wcuf-order-details-page', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-order-details-page'.'_'.$current_locale.'.js' ,array('jquery'));   
			wp_register_script( 'wcuf-multiple-file-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-multiple-file-manager.js', array('jquery') );
			wp_enqueue_script( 'wcuf-generic-file-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-generic-file-uploader.js', array('jquery') );
			wp_enqueue_script( 'wcuf-feedback-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-feedback-manager.js', array('jquery') );
			wp_register_script('wcuf-frontend-ui-manager', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-ui-manager.js', array('jquery', 'wp-hooks'));
		
			wp_enqueue_script('wcuf-audio-video-file-manager', wcuf_PLUGIN_PATH. '/js/wcuf-audio-video-file-manager.js' ,array('jquery')); 
			wp_enqueue_script('wcuf-load-image', wcuf_PLUGIN_PATH. '/js/load-image.all.min.js' ,array('jquery')); 
			wp_enqueue_script('wcuf-image-size-checker', wcuf_PLUGIN_PATH. '/js/wcuf-image-size-checker.js' ,array('jquery')); 
			wp_enqueue_script('wcuf-cropper', wcuf_PLUGIN_PATH.'/js/vendor/cropper/cropper.min.js', array('jquery'));
			wp_register_script('wcuf-frontend-cropper', $cropper_js_path, array('jquery') ); 
			wp_enqueue_script('wcuf-frontend-multiple-file-uploader', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-multiple-file-uploader.js', array('jquery'));
			wp_enqueue_script( 'wcuf-global-error-catcher', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-global-error-catcher.js', array('jquery') );
			wp_enqueue_script('wcuf-frontend-global-error-catcher', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-global-error-catcher.js', array('jquery'));
			//PDF: thumb preview
			wp_enqueue_script('wcuf-pdf-preview-thumb', wcuf_PLUGIN_PATH.'/js/vendor/pdf/pdfThumbnails.js', array('jquery'));
			$pdf_thumb_opt = array( 'plugins_path' =>wcuf_PLUGIN_PATH );
			wp_localize_script( 'wcuf-pdf-preview-thumb', 'wcuf_pdf_thumb_opt', $pdf_thumb_opt );
			//PDF: Flipbook 
			wp_enqueue_script('wcuf-pdf', wcuf_PLUGIN_PATH.'/js/vendor/flipbook/dflip.min.js', array('jquery')); 
			$pdf_flipbook_opt = array( 'plugins_path' =>wcuf_PLUGIN_PATH ); //after wp_enqueue_script
			wp_localize_script( 'wcuf-pdf', 'wcuf_flipbook_opt', $pdf_flipbook_opt );
			
			if(!$is_cart_item_table)
			{
				if(file_exists ( get_theme_file_path()."/wcuf/alert_popup.php" ))
					include get_theme_file_path()."/wcuf/alert_popup.php";
				else
					include WCUF_PLUGIN_ABS_PATH.'/template/alert_popup.php';
				
				if(file_exists ( get_theme_file_path()."/wcuf/view_order_template_saving.php" ))
					include get_theme_file_path()."/wcuf/view_order_template_saving.php";
				else
					include WCUF_PLUGIN_ABS_PATH.'/template/view_order_template_saving.php';
				
				
			}
			if(file_exists ( get_theme_file_path()."/wcuf/cropper.php" ))
				include get_theme_file_path()."/wcuf/cropper.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/cropper.php';
			
			echo '<div class="wcuf_'.$current_page.'_ajax_container_loading_container" id="wcuf_'.$current_page.'_ajax_container_loading_container_'.$container_unique_id.'"></div>';
			echo '<div class="wcuf_'.$current_page.'_ajax_container" id="wcuf_'.$current_page.'_ajax_container_'.$container_unique_id.'" style="display:none;">';				
			
			if(file_exists ( get_theme_file_path()."/wcuf/view_order_template.php" ))
				include get_theme_file_path()."/wcuf/view_order_template.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/view_order_template.php';
			echo '</div>';
			
			
				$js_options = array(
					'icon_path' => wcuf_PLUGIN_PATH."/img/icons/",
					'order_id' => $order_id,
					'current_page' => $current_page,
					'crop_rotation_method' => $all_options['crop_rotation_method'],
					'crop_method' => $all_options['crop_method'],
					'security' => wp_create_nonce('wcuf_security_upload'),
					'disable_zoom_controller' => $all_options['crop_disable_zoom_controller'] ? "true" : "false",
					'container_unique_id' => $container_unique_id				
				);
			
			wp_localize_script( 'wcuf-frontend-ui-manager', 'wcuf_options', $js_options );
			wp_localize_script( 'wcuf-multiple-file-manager', 'wcuf_options', $js_options );
			wp_localize_script( 'wcuf-order-details-page', 'wcuf_options', $js_options );
			wp_localize_script( 'wcuf-frontend-cropper', 'wcuf_options', $js_options );	
			
			wp_enqueue_script( 'wcuf-multiple-file-manager' ); 
			wp_enqueue_script( 'wcuf-frontend-ui-manager' ); 
			wp_enqueue_script( 'wcuf-order-details-page' ); 
			wp_enqueue_script( 'wcuf-frontend-cropper' );
		}
					
	}
	function add_meta()
	{
		if(isset($_GET['view-order']))
		{
			
			 echo '<meta http-equiv="Cache-control" content="no-cache">';
			echo '<meta http-equiv="Expires" content="-1">';
		}
	}
	function add_headers_meta()
	{
		if(isset($_GET['view-order']))
		{
			header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
			header('Pragma: no-cache');
		}
	}
	function curPageURL() 
	{
		 $pageURL = 'http';
		 if (isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] == "on") {$pageURL .= "s";}
		 $pageURL .= "://";
		 if ($_SERVER["SERVER_PORT"] != "80") {
		  $pageURL .= $_SERVER["SERVER_NAME"].":".$_SERVER["SERVER_PORT"].$_SERVER["REQUEST_URI"];
		 } else {
		  $pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
		 }
		 return $pageURL;
	}
}
?>