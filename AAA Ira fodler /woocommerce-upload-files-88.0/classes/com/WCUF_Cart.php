<?php 
class WCUF_Cart
{
	var $already_add_to_cart_buttons_added;
	var $already_cart_item_edited 					= array();
	static $disable_stacking_cart_key_name 			= '_force_disable_stacking_for_variation';
	static $sold_as_individual_item_cart_key_name 	= 'wcuf_sold_as_individual_unique_key';
	var $session_uploaded_files_metadata = null;
	
	public function __construct()
	{
		add_action( 'woocommerce_cart_calculate_fees'		, array(&$this, 'add_extra_upload_fees') );
		add_filter('woocommerce_update_cart_validation'		, array(&$this, 'cart_update_validation'), 10, 4);
		
		add_action( 'woocommerce_remove_cart_item'			, array(&$this, 'on_cart_item_removal' ), 10 ,2);
		add_action( 'woocommerce_cart_item_removed'			, array(&$this, 'on_cart_item_removed' ), 10);
		//Checkout and Cart image preview display. Once it was used only the "woocommerce_cart_item_name" for both. Now it is not possible because in the cart template it is sanatized by the wp_kses_post function and the "woocommerce_after_cart_item_name" is not used by the checkout template
		add_filter( 'woocommerce_cart_item_name'			, array(&$this, 'checkout_edit_item_cart_name_and_set_thumbs'), 99, 3 );  
		add_action( 'woocommerce_after_cart_item_name'		, array(&$this, 'edit_item_cart_name_and_set_thumbs'), 99, 2 ); 
		//
		add_filter( 'woocommerce_cart_item_quantity'		, array(&$this, 'disable_cart_item_quantity_selector'), 10, 2 );
		add_filter( 'woocommerce_add_cart_item_data'		, array(&$this, 'check_if_force_individual_cart_item_add_method'), 10, 3 ); 
		add_filter( 'woocommerce_add_cart_item'				, array(&$this, 'automatically_split_products_added_to_cart'), 10, 2 );
		add_action( 'woocommerce_before_calculate_totals'	, array(&$this, 'edit_item_price') ); 
		add_filter( 'woocommerce_cart_loaded_from_session'	, array(&$this, 'update_product_quantity')); 
		
		add_filter('woocommerce_cart_item_thumbnail'		, array( &$this, 'replace_cart_item_thumb' ), 10, 3);
		
		//Override add to cart button on shop page
		add_filter('woocommerce_loop_add_to_cart_link'		, array(&$this, 'replace_add_to_cart'),99, 2); 
		add_action( 'wp'									, array(&$this, 'force_removing_extra_html_add_to_cart_buttons') );
		$this->already_add_to_cart_buttons_added = array();
	}
	function get_sorted_cart_contents()
	{
		if(!isset( WC()->cart))
			return array();
		
		$items = WC()->cart->cart_contents;
		if(is_array($items))
		  usort($items, function($a, $b) {
			return $a['product_id'] - $b['product_id'];
		});
		return $items;
	}
	function get_product_cart_quantity($product_data)
	{
		$items = WC()->cart->cart_contents;
		$product_data['product_id'] = $product_data['product_id'] ? $product_data['product_id'] : 0;
		if($items)
			foreach((array)$items as $item)
				if($item['product_id'] == $product_data['product_id'] &&
				   $item['variation_id'] == $product_data['variant_id'] &&
				   (!isset($item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) || $item[WCUF_Cart::$sold_as_individual_item_cart_key_name] == $product_data['unique_product_id']) )
				   {
					   return $item["quantity"];
				   }
		return 1;
	}
	function on_cart_item_quantity_update($cart_item_key, $quantity, $old_quantity)
	{
		global $woocommerce,$wcuf_product_model;
		$cart_item = $woocommerce->cart->get_cart_item($cart_item_key);
		
		$product = $cart_item['data'];
		$upload_fields_to_perform_upload = $wcuf_product_model->multipurose_check($product, true, $quantity);
		if(!empty($upload_fields_to_perform_upload))
			foreach((array)$upload_fields_to_perform_upload as $upload_field)
			{
				if(isset($upload_field['num_uploaded_files_error']) && $upload_field['num_uploaded_files_error'])
				{
					if($upload_field['min_uploadable_files'] == $upload_field['max_uploadable_files'])
						wc_add_notice( wcuf_html_escape_allowing_special_tags(sprintf(__('Upload <strong>%s</strong> for product <strong>%s</strong> requires <strong>%s file(s)</strong>. You have uploaded: <strong>%s file(s)</strong>. Please upload the requested number of files.','woocommerce-files-upload'), $upload_field['upload_field_name'], '<a href="'.get_permalink( $upload_field['product_id'] ).'" target ="_blank">'.$upload_field['product_name'].'</a>',$upload_field['max_uploadable_files'], $upload_field['num_uploaded_files']), false) ,'error');
					else 
					{
						$num_uploaded_files_error = wcuf_html_escape_allowing_special_tags(sprintf(__("Upload <strong>%s</strong> for product <strong>%s</strong> requires", 'woocommerce-files-upload'), $upload_field['upload_field_name'], '<a href="'.get_permalink( $upload_field['product_id'] ).'" target ="_blank">'.$upload_field['product_name'].'</a>'), false);
						$num_uploaded_files_error .= $upload_field['min_uploadable_files'] != 0 ? wcuf_html_escape_allowing_special_tags(sprintf(__(" a minimum of <strong>%s file(s)</strong>", 'woocommerce-files-upload'), $upload_field['min_uploadable_files'])) : "" ;
						$num_uploaded_files_error .= $upload_field['max_uploadable_files'] != 0 && $upload_field['min_uploadable_files'] != 0 ? esc_html__(" and ", 'woocommerce-files-upload') : "" ;
						$num_uploaded_files_error .= $upload_field['min_uploadable_files'] != 0 ?  wcuf_html_escape_allowing_special_tags(sprintf(__(" a maximum of <strong>%s file(s)</strong>", 'woocommerce-files-upload'),$upload_field['max_uploadable_files'])): "" ;
						$num_uploaded_files_error .= ". ".esc_html__('Please upload all the required files.','woocommerce-files-upload');
						wc_add_notice($num_uploaded_files_error,'error');
					}
				}
			}	
	}
	
	function remove_loop_button()
	{
		
		global $wcuf_option_model;
		$all_options = $wcuf_option_model->get_all_options();
		if($all_options['disable_view_button'] == 0)
			remove_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_add_to_cart', 10 );
	
	}	
	function force_removing_extra_html_add_to_cart_buttons()
	{
		global $wcuf_option_model;
		$all_options = $wcuf_option_model->get_all_options();
		
		if(function_exists('is_shop') && function_exists('is_product') && (@is_shop() || @is_product()) && $all_options['disable_view_button'] == 0)
		{
			wp_enqueue_script('wcuf-frontend-add-to-cart-buttons', wcuf_PLUGIN_PATH.'/js/wcuf-frontend-add-to-cart-buttons.js', array('jquery'));
		}
	}	
	function replace_add_to_cart($html_button, $product) 
	{
		
		global  $wcuf_product_model, $wcuf_option_model, $wcuf_text_model;
		$all_options = $wcuf_option_model->get_all_options();		
		$product_id =  $wcuf_product_model->get_product_id($product);
		
		//Check if "Add to cart" button has already been added
		
		if($all_options['disable_view_button'] == 1)
			return $html_button;
		$this->already_add_to_cart_buttons_added[$product_id ] = true; 
		
		$link = $product->get_permalink();
		$texts = $wcuf_text_model->get_button_texts();
		
		if($wcuf_product_model->multipurose_check($product))
			return sprintf( '<a rel="nofollow" href="%s" data-quantity="%s" data-product_id="%s" data-product_sku="%s" class="%s">%s</a>',
							esc_url( $link ),
							esc_attr( 1 ),
							esc_attr( $product_id ),
							esc_attr( $product->get_sku() ),
							esc_attr( 'button add_to_cart_button'),
							$texts['view_button_label']
							);
		else 
		{
			return $html_button;
		}
	}
	function on_cart_item_removal($cart_item_key, $cart)
	{
		global $wcuf_session_model, $wcuf_price_calculator_measurement_helper;
		$item = $cart->cart_contents[ $cart_item_key ];
		
		if(!isset($item[WCUF_Cart::$sold_as_individual_item_cart_key_name]))
		{
			if(!$wcuf_price_calculator_measurement_helper->is_active())
				$wcuf_session_model->remove_data_by_product_ids($item); 
		}
		else 
		{
			$wcuf_session_model->remove_all_item_data_by_unique_key($item["product_id"], $item["variation_id"], $item[WCUF_Cart::$sold_as_individual_item_cart_key_name]);
		}
		
	}
	function on_cart_item_removed($item_id)
	{
		global $wcuf_session_model;
		//Just to be sure, when the cart is empty, all items from the session are removed
		if(empty(WC()->cart->get_cart()))
		{
			$wcuf_session_model->remove_item_data();
		}
	}
	function remove_item_from_cart($unique_id, $product_id = 0, $variation_id = 0)
	{
		$cart = WC()->cart;
		if(!$cart)
			return;
		
		foreach ( $cart->get_cart() as $cart_item_key => $cart_item ) 
		{
			$unique_id_check_result = $unique_id == "" || wcuf_get_value_if_set($cart_item, WCUF_Cart::$sold_as_individual_item_cart_key_name, "none") == $unique_id;
			if( $unique_id_check_result && $cart_item["product_id"] == $product_id && $cart_item['variation_id'] == $variation_id )
				{
					
					$cart->remove_cart_item( $cart_item_key );
					wc_add_notice( sprintf(esc_html__('%s was removed from the cart because the uploaded files expired.'), $cart_item['data']->get_title()) ,'error');
				}
		}
	}
	function checkout_edit_item_cart_name_and_set_thumbs($link_text, $product_data, $cart_item_key )
	{
		//When triggered by the cart template, we skip. The text is processed by wp_keses_post. This can only be used for the checkout template
		if(function_exists('is_cart') && is_cart())
			return $link_text;
		
		return $link_text.$this->edit_item_cart_name_and_set_thumbs($product_data, $cart_item_key, false );
	}
	function edit_item_cart_name_and_set_thumbs($product_data, $cart_item_key, $echo = true )
	{
		global $wcuf_text_model, $wcuf_session_model, $wcuf_file_model, $wcuf_product_model, $wcuf_media_model, $wcuf_option_model, $wcuf_wpml_helper;
		
		//Only works on the cart and checkout pages
		if(!((function_exists('is_cart') && is_cart()) || (function_exists('is_checkout') && is_checkout())))
			return "";
		
		global $wcuf_option_model;
		$disable_unique_identifier 	= $wcuf_option_model->get_all_options("disable_unique_identifier", false);
		$additional_text 			= "";
		if(isset($product_data[WCUF_Cart::$sold_as_individual_item_cart_key_name]) && !$disable_unique_identifier)
		{
			$identfier_prefix_text 	= apply_filters("wcuf_unique_cart_id_symbol", $wcuf_text_model->get_cart_identifier_prefix(), $product_data, $cart_item_key);
			$additional_text 		= apply_filters("wcuf_unique_cart_identifier_text", " ".$identfier_prefix_text.$product_data[WCUF_Cart::$sold_as_individual_item_cart_key_name], $product_data, $cart_item_key);
		}
	
		
		//Cart item price according to uploaded files?
		$unique_id 								= isset($product_data[WCUF_Cart::$sold_as_individual_item_cart_key_name]) ? $product_data[WCUF_Cart::$sold_as_individual_item_cart_key_name] : 0;
		$item_data 								= array('product_id' => $wcuf_wpml_helper->get_main_language_id($product_data['product_id']) , 
														'variant_id'=> $product_data['variation_id'] != 0 ? $wcuf_wpml_helper->get_main_language_id($product_data['variation_id'], 'product_variation') : 0 , 
														'unique_product_id'=> $unique_id  );
		$new_item_price 						= $this->apply_or_get_extra_upload_costs(false, $item_data);
		$cart_quantity_depends_on_files_num 	= $wcuf_option_model->get_all_options('cart_quantity_as_number_of_uploaded_files');
		$cart_quantity_show_uploads_quantity 	= $wcuf_option_model->get_all_options('cart_quantity_show_uploads_quantity');
		$enable_quantity_selection 				= $wcuf_option_model->get_all_options('enable_quantity_selection'); 
		
		if(isset($this->already_cart_item_edited[$unique_id."-".$product_data['product_id']."-".$product_data['variation_id']]))
		{
			return "";
		}
		$this->already_cart_item_edited[$unique_id."-".$product_data['product_id']."-".$product_data['variation_id']] = true;
		
		
		//Used in case the product price is set as the fee
		if($new_item_price['cost'] > 0 && $new_item_price['display_cost'])
		{
			foreach($new_item_price['additional_data'] as $data)
			{
				$cost 				= 'yes' !== get_option( 'woocommerce_prices_include_tax' ) ? WCUF_Tax::apply_tax_to_price( $product_data['data'], $data['single_cost']) : $data['single_cost'];  //total_cost
				$quantity_text 		= $data['quantity'] > 1 && (!$cart_quantity_depends_on_files_num || $cart_quantity_show_uploads_quantity) ? ' X '.$data['quantity'] : ""; 
				$additional_text 	.= '<dl class="variation wcuf-details">
										<dt class="">'.$data['label'].' :</dt>
										<dd class="">'.wc_price($cost).$quantity_text.'</dd>
									</dl>';
			}
		}
		
		//Thumbs
		$uploaded_files_metadata 	= !isset($this->session_uploaded_files_metadata) ? $wcuf_session_model->get_item_data() : $this->session_uploaded_files_metadata;
		
		$html_previews = "";
		foreach((array)$uploaded_files_metadata as $temp_upload_id => $temp_upload)
		{
			$ids 										= $wcuf_file_model->get_product_ids_and_field_id_by_file_id($temp_upload_id);		
			$is_the_uploaded_assocaited_to_the_product	= $wcuf_product_model->is_the_same_product($item_data, $ids);
			$feedback									= wcuf_get_value_if_set($temp_upload, 'user_feedback', "");
			if($is_the_uploaded_assocaited_to_the_product)
			{
				$tmp_uploads = is_array($temp_upload['tmp_name']) ? $temp_upload['tmp_name'] : array($temp_upload['tmp_name']);
				foreach($tmp_uploads as $tmp_index => $uploaded_tmp_file_path)
				{
					$quantity_text 	= $enable_quantity_selection && (!$cart_quantity_depends_on_files_num || $cart_quantity_show_uploads_quantity) ? "<span class='wcuf_cart_file_preview_quantity'>".esc_html__('Quantity: ', 'woocommerce-files-upload').$temp_upload['quantity'][$tmp_index]."</span>" : ""; 
				
					$html_previews  .= '<div class="wcuf_cart_preview_container" >'.$wcuf_media_model->get_media_preview_html($temp_upload,$temp_upload["name"], false, 0, $tmp_index, false, array("preview_type" => 'cart_product_preview')).
										'<span class="wcuf_cart_file_preview_name">'.$temp_upload['name'][$tmp_index]."</span>".$quantity_text;
					$html_previews  .= apply_filters('wcuf_cart_file_preview_item', "", $temp_upload, $tmp_index, $product_data);
					$html_previews	.= "</div>";
				}
					
				
				if($feedback != "")
					$html_previews  .= "<div class='wcuf_cart_preview_feedback_container'><span class='wcuf_cart_preview_feedback_title'></span><span class='wcuf_cart_preview_feedback_text'>".$feedback."</span></div>";
			}	
		}
		
		if($html_previews != "" && $wcuf_option_model->show_preview_images_on_cart_and_checkout_item_table())
		{
			
			$additional_text .= '<dl class="variation wcuf-details">
										<dd class="wcuf_item_cart_image_previews">'.$html_previews.'</dd>
								</dl>';
								
		}
		
		if($echo)
			echo $additional_text;
		else
			return $additional_text;
	}
	function replace_cart_item_thumb($product_image, $cart_item = null, $cart_item_key = null)
	{
		if(!isset($cart_item))
			return $product_image;
		
		global $wcuf_file_model, $wcuf_product_model, $wcuf_session_model, $wcuf_media_model, $wcuf_option_model, $wcuf_wpml_helper;
		
		
		/* Example:
		 array(3) {
		  ["width"]=>
		  int(500)
		  ["height"]=>
		  string(0) ""
		  ["crop"]=>
		  int(0)
		}
		*/
		$display_strategy = $wcuf_option_model->replace_product_thumb_on_cart_item_table_strategy();
		if($display_strategy == 'no')
			return $product_image;
		
		$size = wc_get_image_size('woocommerce_thumbnail');
		$options = array('width' => " ", 'height' => " ", 'classes' => "woocommerce-placeholder wp-post-image wcuf_cart_image_thumb", "preview_type" => 'cart_product_thumb');
		$unique_id = isset($cart_item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) ? $cart_item[WCUF_Cart::$sold_as_individual_item_cart_key_name] : 0;
		$item_data = array('product_id' => $wcuf_wpml_helper->get_main_language_id($cart_item['product_id']) , 
							'variant_id'=> $cart_item['variation_id'] != 0 ? $wcuf_wpml_helper->get_main_language_id($cart_item['variation_id'], 'product_variation') : 0 , 
							'unique_product_id'=> $unique_id  );
		$uploaded_files_metadata = !isset($this->session_uploaded_files_metadata) ? $wcuf_session_model->get_item_data() : $this->session_uploaded_files_metadata;
		
		$html_previews = "";
		foreach((array)$uploaded_files_metadata as $temp_upload_id => $temp_upload)
		{
			$ids = $wcuf_file_model->get_product_ids_and_field_id_by_file_id($temp_upload_id);		
			$is_the_uploaded_assocaited_to_the_product = $wcuf_product_model->is_the_same_product($item_data, $ids);
			if($is_the_uploaded_assocaited_to_the_product)
			{
				$tmp_uploads = is_array($temp_upload['tmp_name']) ? $temp_upload['tmp_name'] : array($temp_upload['tmp_name']);
				foreach($tmp_uploads as $tmp_index => $uploaded_tmp_file_path)
					{
						$preview = $wcuf_media_model->get_media_preview_html($temp_upload,$temp_upload["name"], false, 0, $tmp_index, true, $options);
						if($preview != "")
						{
							$html_previews .= $preview;
							//$preview_counter++;
							if($display_strategy == 'only_first')
								break;
						}
					}
			}
		}
						
		$product_image = $html_previews != "" ? $html_previews : $product_image;
		return $product_image;
	}
	function generate_unique_individual_id($product_id, $variation_id, $delete_previous_session_item = false)
	{
		global $woocommerce,$wcuf_session_model;
		
		//NEW: no need to take in consideration the variation id. The unique number is just product+progressive_int
		$variation_id = 0;
		
		$variation_id = !is_numeric($variation_id) ? 0 : $variation_id;
		
		if(!isset($woocommerce) || !isset($woocommerce->cart))
			return;
		
		$items = $woocommerce->cart->get_cart();
		$obj = $this->retrieve_last_used_unique_individual_id($product_id, $variation_id, true);
		$id_to_assign = $obj['id_to_assign'] + 1;
		$item = $obj['item'];
		
		if($delete_previous_session_item && isset($item))
		{
			$item_to_remove = $item["variation_id"] == 0 ? $item["product_id"]."-".$id_to_assign : $item["product_id"]."-".$item["variation_id"]."-".$id_to_assign;
			$wcuf_session_model->remove_item_data("wcufuploadedfile_".$item_to_remove);
		}
		return $id_to_assign;
	}
	private function retrieve_last_used_unique_individual_id($product_id, $variation_id, $return_object = false)
	{
		global $woocommerce;
		$id_to_assign = 0;
		$items = $woocommerce->cart->get_cart();
		$item_to_return = null;
		foreach($items as $item)
		{
			$isset = isset($item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) ? 'true :'.$item[WCUF_Cart::$sold_as_individual_item_cart_key_name] : 'false';
			if($item["product_id"] == $product_id && ($variation_id == 0 || $item["variation_id"] == $variation_id) && isset($item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) && $item[WCUF_Cart::$sold_as_individual_item_cart_key_name] > $id_to_assign)
			{
				$id_to_assign = isset($item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) && is_numeric($item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) ? $item[WCUF_Cart::$sold_as_individual_item_cart_key_name] : $id_to_assign;
				$item_to_return = $item;				
			}
		}
		return !$return_object ? $id_to_assign : array('id_to_assign'=>$id_to_assign, 'item'=> $item_to_return);
	}
	function retrieve_my_unique_individual_id($product)
	{
		return isset($product[WCUF_Cart::$sold_as_individual_item_cart_key_name]) ? $product[WCUF_Cart::$sold_as_individual_item_cart_key_name] : 0;
	}
	
	function retrieve_complete_unique_individual_id($product_id, $variation_id, $cart_item)
	{
		return $product_id."-".$variation_id."-idsai".$this->retrieve_my_unique_individual_id($cart_item);
	}
	function disable_cart_item_quantity_selector( $product_quantity, $cart_item_key)
	{
		global $wcuf_product_model, $wcuf_option_model, $woocommerce;
		$options = $wcuf_option_model->get_individual_products_options();
		$cart = $woocommerce->cart->get_cart();
		$cart_item = $cart[$cart_item_key];
		
		$wc_product = $cart_item["data"];
		$all_options = $wcuf_option_model->get_all_options();
		if(($all_options['cart_quantity_as_number_of_uploaded_files'] && 
		    $wcuf_product_model->multipurose_check($wc_product,false,1,false, array('check_if_manual_quantity_selection_can_be_disabled' => true))) ||
		    ($wcuf_product_model->sold_as_individual_product( $cart_item['product_id'], $cart_item['variation_id']) && $options['split_products_on_cart'])
		   )
		{
			$product_quantity = sprintf( '%2$s <input type="hidden" name="cart[%1$s][qty]" value="%2$s" />', $cart_item_key, $cart_item['quantity'] );
		}
		return $product_quantity;
	}
	function check_if_force_individual_cart_item_add_method($cart_item_data, $product_id, $variation_id)
	{
		global $wcuf_product_model, $wcuf_session_model, $woocommerce;
		if($wcuf_product_model->sold_as_individual_product($product_id, $variation_id))
		{
			$cart_item_data[WCUF_Cart::$sold_as_individual_item_cart_key_name] = $this->generate_unique_individual_id($product_id, $variation_id);
			
			//TM WooCommerce TM Extra Product Options: checks if the item has been edited
			$wcuf_session_model->tm_on_add_to_cart();
			
		}
		return $cart_item_data;
	}
	function automatically_split_products_added_to_cart($product_data, $cart_item_key)
	{
		global $wcuf_option_model, $wcuf_product_model;
		
		$options = $wcuf_option_model->get_individual_products_options();
		if(!$wcuf_product_model->sold_as_individual_product( $product_data['product_id'], $product_data['variation_id']) || !$options['split_products_on_cart'])
			return $product_data;
				
		$product_id = $product_data['variation_id'] == 0 ? $product_data['product_id'] : $product_data['variation_id'];
		if($product_data['quantity'] > 1)
		{
			for($i = 0; $i < $product_data['quantity']; $i++)
			{
				WC()->cart->add_to_cart( $product_id );
			}
			$product_data['quantity'] = 1;
		}
		return $product_data;
	}
	function update_product_quantity($session_obj)
	{
		global $woocommerce, $wcuf_option_model, $wcuf_cart_model, $wcuf_product_model, $wcuf_file_model, $wcuf_session_model; 
		
		$cart_quantity_depends_on_files_num = $wcuf_option_model->get_all_options('cart_quantity_as_number_of_uploaded_files');
		if(!$cart_quantity_depends_on_files_num)
			return;
		foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item)
		{
			$total_quantity = 0;
			$unique_id = isset($cart_item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) ? $cart_item[WCUF_Cart::$sold_as_individual_item_cart_key_name] : 0;
			$item_data = array('product_id' => $cart_item['product_id'] , 'variant_id'=> $cart_item['variation_id'] , 'unique_product_id'=> $unique_id  );
			$all_temp_uploads = $wcuf_session_model->get_item_data();
			$file_fields_groups =  $wcuf_option_model->get_fields_meta_data();
			
			//Quantity computation
			foreach((array)$all_temp_uploads as $temp_upload_id => $temp_upload)
			{
				$ids = $wcuf_file_model->get_product_ids_and_field_id_by_file_id($temp_upload_id);		
				$is_in_still_in_cart = isset($ids['product_id']) && $wcuf_product_model->is_the_same_product($item_data, $ids) ? true : false;
				
				if($is_in_still_in_cart)
				{
					foreach($file_fields_groups as $upload_field_meta)
					{
						if($upload_field_meta["id"] == $ids['field_id'] && !wcuf_get_value_if_set($upload_field_meta, 'disable_product_cart_quantity_option', false)) //0 => $field_id
						{	
						
							if(isset($temp_upload['quantity']))
								$temp_upload['quantity'] = is_array($temp_upload['quantity']) ? array_sum($temp_upload['quantity']) : $temp_upload['quantity'];
							$quantity = isset($temp_upload['quantity']) ? $temp_upload['quantity'] : $temp_upload['num_uploaded_files'];
							$total_quantity += $quantity;
						}
					}
				}
				
			}
			//End quantity computation
			
			if($total_quantity > 0 )
			{
				
				$woocommerce->cart->set_quantity($cart_item_key, $total_quantity);
			}		
		}
	}
	function add_to_cart( $cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data ) 
	{
		
	}  
	function custom_add_to_cart_redirect($cart_get_cart_url) 
	{ 
		
		if ( isset( $_POST['add-to-cart'] ) ) 
		{
			$product_id = (int) apply_filters( 'woocommerce_add_to_cart_product_id', $_POST['add-to-cart'] );
			
		}
		return $cart_get_cart_url;
	}
	//Assign item price according the extra costs
	function edit_item_price($cart_item = array())
	{
		global $wcuf_option_model;
		$cart_quantity_depends_on_files_num = $wcuf_option_model->get_all_options('cart_quantity_as_number_of_uploaded_files');
		foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item)
		{
			if(!isset($cart_item))
				continue;
			$unique_id = isset($cart_item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) ? $cart_item[WCUF_Cart::$sold_as_individual_item_cart_key_name] : 0;
			$item_data = array('product_id' => $cart_item['product_id'] , 'variant_id'=> $cart_item['variation_id'] , 'unique_product_id'=> $unique_id  );
			$new_item_price = $this->apply_or_get_extra_upload_costs(false, $item_data);
			
			if($new_item_price['product_prices_multiplied_by_number_of_uploaded_files'])
			{
				$new_item_price['number_of_uploaded_files'] = $new_item_price['number_of_uploaded_files'] ? $new_item_price['number_of_uploaded_files'] : 1;
				$cart_item['data']->set_price( $cart_item['data']->get_price() * $new_item_price['number_of_uploaded_files']  );
			}	
			else if($new_item_price['cost'] > 0 )
			{
				$new_price = 0 ;
				foreach($new_item_price['additional_data'] as $data)
				{
					$new_price += !$cart_quantity_depends_on_files_num && !wcuf_get_value_if_set($data, 'disable_product_cart_quantity_option', false) ? $data['single_cost']*$data['quantity'] : $data['single_cost']*$data['number_of_uploaded_files'];
				}
							
				if(!$new_item_price['add_extra_cost_to_item_price'])
					$cart_item['data']->set_price( $new_price );
				else 
				{
					$cart_item['data']->set_price($cart_item['data']->get_price() + $new_price ); //regular_price: base price, price: current price (that might be discounted)
				}
			}
					
		}
		
		//return $cart_item;
	}
	public function add_extra_upload_fees($wc_cart)
	{
		global $wcuf_file_model;
			
		if(@is_cart() || @is_checkout())
		{
			$this->apply_or_get_extra_upload_costs();
		}
	}
	//Used to add fee to the cart
	public function apply_or_get_extra_upload_costs($add_fee_to_cart = true, $current_product = array()/* , $return_total_quantity = false */)
	{
		global $woocommerce, $wcuf_session_model, $wcuf_option_model, $wcuf_file_model, $wcuf_product_model;
		$all_temp_uploads = $wcuf_session_model->get_item_data();
		$file_fields_groups =  $wcuf_option_model->get_fields_meta_data();
		$options =  $wcuf_option_model->get_all_options();
		$fee_value = 0;
		$total_fee_value = 0;
		$additional_upload_field_cost_data = array();
		$total_quantity = 0;
		$product_name = "";
		$global_counter = 1;
		$checkout_discount_already_applied_by_field_id = array();
		$any_checkout_discount_already_applied = false;
		$cart_sub_total_ex_tax = $woocommerce->cart->subtotal_ex_tax;
		$exists_extra_cost_as_item_price = $exists_add_extra_cost_to_item_price = false;
		$product_prices_multiplied_by_number_of_uploaded_files = $options['product_prices_multiplied_by_number_of_uploaded_files'];
		
		foreach((array)$all_temp_uploads as $temp_upload_id => $temp_upload)
		{
			$ids = $wcuf_file_model->get_product_ids_and_field_id_by_file_id($temp_upload_id);		
			$is_in_still_in_cart = true; 
			if(isset($ids['product_id']))
			{
				//used to compute the item price or global item quantity
				if($add_fee_to_cart == false)
				{
					$is_in_still_in_cart = $wcuf_product_model->is_the_same_product($current_product, $ids);
					
				}
				elseif(!$this->item_is_in_cart($ids)) //problem with WC_Price_Calculator?(in the file name the second "-" is not the variation) -> theorically not because it is always a variable product
				{
					$is_in_still_in_cart = false;
					if(!class_exists('THEMECOMPLETE_Extra_Product_Options'))//To grant support to the WooCommerce TM Extra Product Options, when editing a product, tmp data is added to the session. To avoid to be deleted, this check is performed
						$wcuf_session_model->remove_item_data($temp_upload_id);
				}
			}
			
			if($is_in_still_in_cart)
			{
				
				$product = wc_get_product($ids['variant_id'] != 0 && $ids['variant_id'] != "" ? $ids['variant_id'] : $ids['product_id']);
				$product_name = $product == false ? esc_html__('Product', 'woocommerce-files-upload') : $product->get_name();
				foreach($file_fields_groups as $upload_field_meta)
				{
					$use_extra_cost_as_item_price = isset($upload_field_meta['extra_cost_as_item_price']) && $upload_field_meta['extra_cost_as_item_price'] ? true : false;
					$add_extra_cost_to_item_price = isset($upload_field_meta['extra_cost_add_to_item_price']) && $upload_field_meta['extra_cost_add_to_item_price'] ? true : false;
					$extra_cost_detect_pdf = isset($upload_field_meta['extra_cost_detect_pdf']) && $upload_field_meta['extra_cost_detect_pdf'] ? true : false;
					
					$exists_extra_cost_as_item_price = $use_extra_cost_as_item_price ? $use_extra_cost_as_item_price : $exists_extra_cost_as_item_price ;
					$exists_add_extra_cost_to_item_price = $add_extra_cost_to_item_price ? $add_extra_cost_to_item_price : $exists_add_extra_cost_to_item_price ;
					
					if(!$use_extra_cost_as_item_price && !$add_extra_cost_to_item_price && !$add_fee_to_cart && !$product_prices_multiplied_by_number_of_uploaded_files)
						continue; 
					
					if($upload_field_meta["id"] == $ids['field_id']) //0 => $field_id
					{
						$field_title = $upload_field_meta['title'];
						$checkout_percentage_enabled = wcuf_get_value_if_set($upload_field_meta, ['checkout_percentage_enabled'], false);
							$checkout_percentage_only_once = wcuf_get_value_if_set($upload_field_meta, ['checkout_percentage_only_once'], false);	
						
						
						//Checkout order total discount 
						if($checkout_percentage_enabled && !isset($checkout_discount_already_applied_by_field_id[$upload_field_meta["id"]]) && ( !$any_checkout_discount_already_applied || !$checkout_percentage_only_once) && !$product_prices_multiplied_by_number_of_uploaded_files)
						{
							$checkout_percentage_value = wcuf_get_value_if_set($upload_field_meta, ['checkout_percentage_value'], 1);
							$checkout_percentage_description =  wcuf_get_value_if_set($upload_field_meta, ['checkout_percentage_description'], "");
							$checkout_percentage_description = str_replace("%field_title" , $field_title, $checkout_percentage_description);
							
							$checkout_discount_already_applied_by_field_id[$upload_field_meta["id"]] = true;
							$any_checkout_discount_already_applied = true;
							$discount_to_apply = ($cart_sub_total_ex_tax * $checkout_percentage_value)/100;
							$cart_sub_total_ex_tax -= $discount_to_apply;
							$cart_sub_total_ex_tax = $cart_sub_total_ex_tax < 0 ? 0 : $cart_sub_total_ex_tax;
							$woocommerce->cart->add_fee($checkout_percentage_description, $discount_to_apply * -1 , true );  
						}
						if($product_prices_multiplied_by_number_of_uploaded_files)
						{
							if(isset($temp_upload['quantity']))
								$temp_upload['quantity'] = is_array($temp_upload['quantity']) ? array_sum($temp_upload['quantity']) : $temp_upload['quantity'];
							$total_quantity += isset($temp_upload['quantity']) ? $temp_upload['quantity'] : $temp_upload['num_uploaded_files'];
						}
						//Extra costs	
						else if(isset($upload_field_meta['extra_cost_enabled']) && $upload_field_meta['extra_cost_enabled'])
						{
							if(isset($temp_upload['quantity']))
								$temp_upload['quantity'] = is_array($temp_upload['quantity']) ? array_sum($temp_upload['quantity']) : $temp_upload['quantity'];
							$quantity = isset($temp_upload['quantity']) ? $temp_upload['quantity'] : $temp_upload['num_uploaded_files'];
							
							if($extra_cost_detect_pdf)
							{
								foreach($temp_upload["is_pdf"] as $index => $tmp_elem)
									if($tmp_elem)
									{
										$temp_upload['num_uploaded_files'] -= 1; //the file number is replaced by the page number
										$temp_upload['num_uploaded_files'] += $temp_upload["number_of_pages"][$index];	
									}
							}
							
							$total_quantity += $quantity;
							
							$upload_field_meta['extra_cost_overcharge_limit'] = isset($upload_field_meta['extra_cost_overcharge_limit']) ? $upload_field_meta['extra_cost_overcharge_limit'] : null;
							$upload_field_meta['extra_cost_free_items_number'] = isset($upload_field_meta['extra_cost_free_items_number']) ? $upload_field_meta['extra_cost_free_items_number'] : 0;
							$price_and_num = $this->get_additional_costs($quantity, $upload_field_meta['extra_cost_free_items_number'], $upload_field_meta['extra_cost_overcharge_limit'], $upload_field_meta['extra_cost_value'], $upload_field_meta['extra_overcharge_type'], $ids);
							$id_to_print = "";
							
							$quantity_string = $price_and_num['num'] > 1 ? " - ".$price_and_num['num'].esc_html__(' Files', 'woocommerce-files-upload'):"";
							$upload_field_meta['extra_cost_is_taxable'] = isset($upload_field_meta['extra_cost_is_taxable']) ? $upload_field_meta['extra_cost_is_taxable'] : false;
							$current_product_cart_quantity = isset($upload_field_meta['extra_cost_multiply_per_product_cart_quantity']) && $upload_field_meta['extra_cost_multiply_per_product_cart_quantity'] ? $this->get_product_cart_quantity($ids) : 1;
							$product_quantity_string = $current_product_cart_quantity > 1 ? " - ".esc_html__('Quantity: ', 'woocommerce-files-upload').$current_product_cart_quantity  : "";
							$fee_value = $price_and_num['price']*$current_product_cart_quantity;
							$total_fee_value += $fee_value;
							$fee_description_text = $upload_field_meta['extra_cost_fee_description'] != "" ? $upload_field_meta['extra_cost_fee_description'] : $temp_upload['title'];
							$fee_description_text = str_replace("%prod_name" , $product_name, $fee_description_text);
							$fee_description_text = str_replace("%field_title" , $field_title, $fee_description_text);
							
							if($fee_value != 0)
								$additional_upload_field_cost_data[] = array('label' => $fee_description_text, 
																			  'total_cost' => $fee_value, 'single_cost' =>$price_and_num['price']/$price_and_num['num'], 
																			  'quantity' => $price_and_num['num'], 
																			  'number_of_uploaded_files' => $temp_upload['num_uploaded_files'],
																			  'extra_cost_detect_pdf' => $extra_cost_detect_pdf,
																			  'use_extra_cost_as_item_price' => $use_extra_cost_as_item_price,
																			  'extra_cost_overcharge_limit' => $upload_field_meta['extra_cost_overcharge_limit'],
																			  'extra_cost_free_items_number' => $upload_field_meta['extra_cost_free_items_number'],
																			  'disable_cart_quantity_as_num_of_files' => wcuf_get_value_if_set($temp_upload,'disable_cart_quantity_as_num_of_files', false));
							
							if($add_fee_to_cart && $fee_value != 0  && !$use_extra_cost_as_item_price && !$add_extra_cost_to_item_price && !$product_prices_multiplied_by_number_of_uploaded_files)
								$woocommerce->cart->add_fee(($global_counter++).". ".$fee_description_text.$quantity_string.$product_quantity_string, $fee_value, $upload_field_meta['extra_cost_is_taxable']); //( string $name, float $amount, boolean $taxable = false, string $tax_class = ''  )
						
						}
						//Extra cost per duration
						if(isset($temp_upload['ID3_info']) && isset($upload_field_meta['extra_cost_media_enabled']) && $upload_field_meta['extra_cost_media_enabled'] && !$product_prices_multiplied_by_number_of_uploaded_files)
						{
							$upload_field_meta['extra_cost_overcharge_seconds_limit'] = isset($upload_field_meta['extra_cost_overcharge_seconds_limit']) ? $upload_field_meta['extra_cost_overcharge_seconds_limit'] : null;
							$upload_field_meta['extra_cost_media_is_taxable'] = isset($upload_field_meta['extra_cost_media_is_taxable']) ? $upload_field_meta['extra_cost_media_is_taxable'] : false;
							$upload_field_meta['extra_cost_free_seconds'] = isset($upload_field_meta['extra_cost_free_seconds']) ? $upload_field_meta['extra_cost_free_seconds'] : 0;
							$upload_field_meta['extra_costs_consider_sum_of_all_file_seconds'] = isset($upload_field_meta['extra_costs_consider_sum_of_all_file_seconds']) ? $upload_field_meta['extra_costs_consider_sum_of_all_file_seconds'] : false;
					
							if(is_array($temp_upload['ID3_info']))
							{
								$fee_description_text = $upload_field_meta['extra_cost_media_fee_description'] != "" ? $upload_field_meta['extra_cost_media_fee_description'] : $temp_upload['title'];
								$fee_description_text = str_replace("%prod_name" , $product_name, $fee_description_text);
								$fee_description_text = str_replace("%field_title" , $field_title, $fee_description_text);
								$formatted_price = sprintf(get_woocommerce_price_format(), get_woocommerce_currency_symbol(),$upload_field_meta['extra_cost_per_second_value']);
								$cost_per_second = isset($upload_field_meta['show_cost_per_second']) && $upload_field_meta['show_cost_per_second'] ? " (".$formatted_price." ".esc_html__(' per second ','woocommerce-files-upload')." )" : "";
								$current_product_cart_quantity = isset($upload_field_meta['extra_cost_multiply_per_product_cart_quantity']) && $upload_field_meta['extra_cost_multiply_per_product_cart_quantity'] ? $this->get_product_cart_quantity($ids) : 1;
								$product_quantity_string = $current_product_cart_quantity > 1 ? " - ".esc_html__('Quantity: ', 'woocommerce-files-upload').$current_product_cart_quantity  : "";
								$total_seconds = 0;
								$id3_counter = 1;
											
								foreach((array)$temp_upload['ID3_info'] as $media_file_info)
								{
									if(isset($media_file_info['quantity']))
										$media_file_info['quantity'] = is_array($media_file_info['quantity']) ? array_sum($media_file_info['quantity']) : $media_file_info['quantity'];
									$quantity = isset($media_file_info['quantity']) ? $media_file_info['quantity'] : 1;
									if($extra_cost_detect_pdf)
									{
										foreach($temp_upload["is_pdf"] as $index => $tmp_elem)
											if($tmp_elem)
											{
												$temp_upload['num_uploaded_files'] -= 1; //the file number is replaced by the page number
												$temp_upload['num_uploaded_files'] += $temp_upload["number_of_pages"][$index];	
											}
									}
									$total_quantity += $quantity;
									
									//free seconds managment
									$total_seconds += $media_file_info['playtime_seconds']*$quantity;
										
									if(!$upload_field_meta['extra_costs_consider_sum_of_all_file_seconds'])		
									{		
										$media_file_info['playtime_seconds'] = $media_file_info['playtime_seconds'] - $upload_field_meta['extra_cost_free_seconds'] < 0 ? 0 : $media_file_info['playtime_seconds'] - $upload_field_meta['extra_cost_free_seconds'];
										$over_charge = $upload_field_meta['extra_cost_overcharge_seconds_limit'] != 0 && $upload_field_meta['extra_cost_overcharge_seconds_limit'] > $upload_field_meta['extra_cost_free_seconds'] ? $upload_field_meta['extra_cost_overcharge_seconds_limit'] - $upload_field_meta['extra_cost_free_seconds'] : 0;
										
										$price_and_num = $this->get_additional_costs($media_file_info['playtime_seconds']*$quantity, 0, $over_charge, $upload_field_meta['extra_cost_per_second_value']);
										$id_to_print = "";
										
										
										$quantity_string = $quantity > 1 ? " - ".$quantity.esc_html__(' Files', 'woocommerce-files-upload'):"";
										$fee_value = $price_and_num['price']*$current_product_cart_quantity;
										$total_fee_value += $fee_value;
										
										if($fee_value != 0)
											$additional_upload_field_cost_data[] = array('label' => $fee_description_text, 
																						 'total_cost' => $fee_value, 
																						 'single_cost' =>$price_and_num['price']/$price_and_num['num'], 
																						 'quantity' => $price_and_num['num'], 
																						 'extra_cost_detect_pdf' => $extra_cost_detect_pdf,
																						 'use_extra_cost_as_item_price' => $use_extra_cost_as_item_price,
																						 'extra_cost_overcharge_limit' => $upload_field_meta['extra_cost_free_seconds'],
																						 'extra_cost_free_items_number' => $upload_field_meta['extra_cost_overcharge_seconds_limit'],
																						 'disable_cart_quantity_as_num_of_files' => wcuf_get_value_if_set($temp_upload,'disable_cart_quantity_as_num_of_files', false));
								
										if($add_fee_to_cart && $fee_value != 0  && !$use_extra_cost_as_item_price  && !$add_extra_cost_to_item_price && !$product_prices_multiplied_by_number_of_uploaded_files)
											$woocommerce->cart->add_fee(($global_counter++).". "./*$id_to_print.$id3_counter.": ". */$fee_description_text." : ".$media_file_info['file_name']." - ".$media_file_info['playtime_string'].$cost_per_second.$quantity_string.$product_quantity_string, $fee_value, $upload_field_meta['extra_cost_media_is_taxable']);
										$id3_counter++;
									}
								}
								//Consider all media files as one
								if($upload_field_meta['extra_costs_consider_sum_of_all_file_seconds'])	
								{
									$total_seconds  = $total_seconds  - $upload_field_meta['extra_cost_free_seconds'] < 0 ? 0 : $total_seconds - $upload_field_meta['extra_cost_free_seconds'];
									$over_charge = $upload_field_meta['extra_cost_overcharge_seconds_limit'] != 0 && $upload_field_meta['extra_cost_overcharge_seconds_limit'] > $upload_field_meta['extra_cost_free_seconds'] ? $upload_field_meta['extra_cost_overcharge_seconds_limit'] - $upload_field_meta['extra_cost_free_seconds'] : 0;
									$price_and_num = $this->get_additional_costs($total_seconds, 0, $over_charge, $upload_field_meta['extra_cost_per_second_value']);
									$chargable_seconds = $price_and_num['price'] *$current_product_cart_quantity;
									$fee_value = $price_and_num['price']*$current_product_cart_quantity;	
									$quantity_string = $total_quantity > 1 ? " - ".$total_quantity.esc_html__(' Files', 'woocommerce-files-upload'):"";
									
									
									if($fee_value != 0)
										$additional_upload_field_cost_data[] = array('label' => $fee_description_text, 
																					 'total_cost' => $fee_value, 
																					 'single_cost' =>$price_and_num['price']/$price_and_num['num'], 
																					 'quantity' => $price_and_num['num'], 
																					 'extra_cost_detect_pdf' => $extra_cost_detect_pdf,
																					 'use_extra_cost_as_item_price' => $use_extra_cost_as_item_price,
																					 'extra_cost_overcharge_limit' => $upload_field_meta['extra_cost_free_seconds'],
																					 'extra_cost_free_items_number' => $upload_field_meta['extra_cost_overcharge_seconds_limit'],
																					 'disable_cart_quantity_as_num_of_files' => wcuf_get_value_if_set($temp_upload,'disable_cart_quantity_as_num_of_files', false));
								
									
									
									if($add_fee_to_cart && $fee_value != 0  && !$use_extra_cost_as_item_price && !$add_extra_cost_to_item_price && !$product_prices_multiplied_by_number_of_uploaded_files)
									{
										$woocommerce->cart->add_fee(($global_counter++).". ".$fee_description_text." : ".wcuf_format_seconds_to_readable_length($chargable_seconds).$cost_per_second/* .$quantity_string */.$product_quantity_string, $fee_value, $upload_field_meta['extra_cost_media_is_taxable']);
									
									}
								}
							}
						}
					}
				} 
			}
		}
		
		return array("cost" => $total_fee_value, 
		             "display_cost" => !$product_prices_multiplied_by_number_of_uploaded_files, 
					 "additional_data" => $additional_upload_field_cost_data, 
					 "use_extra_cost_as_item_price" => $exists_extra_cost_as_item_price, 
					 "add_extra_cost_to_item_price" => $exists_add_extra_cost_to_item_price,
					 "number_of_uploaded_files" => $total_quantity,
					 "product_prices_multiplied_by_number_of_uploaded_files" => $product_prices_multiplied_by_number_of_uploaded_files
					 );
	}
	//Used by shortcode
	public function get_sum_of_all_additional_costs($file_fields_groups,$temp_upload, $field_id, $product)
	{
		$extra_cost = 0;
		foreach($file_fields_groups as $upload_field_meta)
		{
			if($upload_field_meta["id"] == $field_id) 
			{
				
				if(isset($upload_field_meta['extra_cost_enabled']) && $upload_field_meta['extra_cost_enabled'])
				{
					if(isset($temp_upload['quantity']))
						$temp_upload['quantity'] = is_array($temp_upload['quantity']) ? array_sum($temp_upload['quantity']) : $temp_upload['quantity'];
					
					$quantity = isset($temp_upload['quantity']) ? $temp_upload['quantity'] : $temp_upload['num_uploaded_files'];
					$upload_field_meta['extra_cost_overcharge_limit'] = isset($upload_field_meta['extra_cost_overcharge_limit']) ? $upload_field_meta['extra_cost_overcharge_limit'] : null;
					$upload_field_meta['extra_cost_free_items_number'] = isset($upload_field_meta['extra_cost_free_items_number']) ? $upload_field_meta['extra_cost_free_items_number'] : 0;
					$price_and_num = $this->get_additional_costs($quantity, $upload_field_meta['extra_cost_free_items_number'], $upload_field_meta['extra_cost_overcharge_limit'], $upload_field_meta['extra_cost_value'], $upload_field_meta['extra_overcharge_type'], $product);
					//wcuf_var_dump($price_and_num);
					$upload_field_meta['extra_cost_is_taxable'] = isset($upload_field_meta['extra_cost_is_taxable']) ? $upload_field_meta['extra_cost_is_taxable'] : false;
					$extra_cost += $price_and_num['price'];
				}
				//Extra cost per duration
				if(isset($temp_upload['ID3_info']) && $temp_upload['ID3_info'] != 'none' && isset($upload_field_meta['extra_cost_media_enabled']) && $upload_field_meta['extra_cost_media_enabled'])
				{
					//backward compability
					$upload_field_meta['extra_costs_consider_sum_of_all_file_seconds'] = isset($upload_field_meta['extra_costs_consider_sum_of_all_file_seconds']) ? $upload_field_meta['extra_costs_consider_sum_of_all_file_seconds'] : false;
					$total_seconds = 0;
					$upload_field_meta['extra_cost_overcharge_seconds_limit'] = isset($upload_field_meta['extra_cost_overcharge_seconds_limit']) ? $upload_field_meta['extra_cost_overcharge_seconds_limit'] : null;
					$upload_field_meta['extra_cost_free_seconds'] = isset($upload_field_meta['extra_cost_free_seconds']) ? $upload_field_meta['extra_cost_free_seconds'] : 0;
							
					//Extra costs per file	
					foreach($temp_upload['ID3_info'] as $media_file_info)
					{
						if(isset($media_file_info['quantity']))
								$media_file_info['quantity'] = is_array($media_file_info['quantity']) ? array_sum($media_file_info['quantity']) : $media_file_info['quantity'];
						$quantity = isset($media_file_info['quantity']) ? $media_file_info['quantity'] : 1;
						
									
						$total_seconds += $media_file_info['playtime_seconds']*$quantity;
						if(!$upload_field_meta['extra_costs_consider_sum_of_all_file_seconds'])
						{
							$over_charge = $upload_field_meta['extra_cost_overcharge_seconds_limit'] != 0 && $upload_field_meta['extra_cost_overcharge_seconds_limit'] > $upload_field_meta['extra_cost_free_seconds'] ? $upload_field_meta['extra_cost_overcharge_seconds_limit'] - $upload_field_meta['extra_cost_free_seconds'] : 0;
							$media_file_info['playtime_seconds'] = $media_file_info['playtime_seconds'] - $upload_field_meta['extra_cost_free_seconds'] < 0 ? 0 : $media_file_info['playtime_seconds'] - $upload_field_meta['extra_cost_free_seconds'];
							$price_and_num = $this->get_additional_costs($media_file_info['playtime_seconds']*$quantity, 0, $over_charge, $upload_field_meta['extra_cost_per_second_value']);
							$extra_cost += $price_and_num['price'];
						}
						//??
						$upload_field_meta['extra_cost_media_is_taxable'] = isset($upload_field_meta['extra_cost_media_is_taxable']) ? $upload_field_meta['extra_cost_media_is_taxable'] : false;
					}
					//In case the media files have to be considered as one
					if($upload_field_meta['extra_costs_consider_sum_of_all_file_seconds'])
					{
						$total_seconds = $total_seconds - $upload_field_meta['extra_cost_free_seconds'] < 0 ? 0 : $total_seconds - $upload_field_meta['extra_cost_free_seconds'];
						$over_charge = $upload_field_meta['extra_cost_overcharge_seconds_limit'] != 0 && $upload_field_meta['extra_cost_overcharge_seconds_limit'] > $upload_field_meta['extra_cost_free_seconds'] ? $upload_field_meta['extra_cost_overcharge_seconds_limit'] - $upload_field_meta['extra_cost_free_seconds'] : 0;
						$price_and_num = $this->get_additional_costs($total_seconds, 0, $over_charge, $upload_field_meta['extra_cost_per_second_value']);
						$extra_cost += $price_and_num['price'];	
						
					}
					
				}
			}
		}
		return sprintf(get_woocommerce_price_format(), get_woocommerce_currency_symbol(),$extra_cost);		
	}
	public function get_additional_costs($num, $lower_limit, $higher_limit, $value, $type = 'fixed', $product_ids = null, $use_currecy_symbol = false)
	{
		$price = 0;
		$single_numeric_price = $value;
		
		if($lower_limit > $num)
			$num = 0;	
		else
			$num = $lower_limit != 0 && round($num) - $lower_limit > -1 ? $num - $lower_limit : $num; 
		$num = isset($higher_limit) && ($higher_limit == 0 || round($num) <= $higher_limit) ? round($num) : $higher_limit ;
		
		if($type == 'fixed')
		{
			$value = !isset($value) || !is_numeric($value) ? 0 : $value;
			$price = $num * $value;
			$single_numeric_price = $value;
		}
		else if(isset($product_ids) && isset($product_ids['product_id']))
		{
			$product_ids['variant_id'] = !isset($product_ids['variant_id']) || $product_ids['variant_id'] == "" ? 0 : $product_ids['variant_id'];
			$product_ids['variant_id'] = !isset($product_ids['variation_id']) || $product_ids['variation_id'] == "" ? $product_ids['variant_id'] : $product_ids['variation_id'];
			$product =  $product_ids['variant_id'] == 0 ? wc_get_product($product_ids['product_id']) : wc_get_product($product_ids['variant_id']);
			 
			 
			//Price adjust
			$sign = $value < 0 ? -1 : 1;
			$value = abs($value);
			$price =  $sign * $num * $product->get_price( ) * ($value/100);
			$single_numeric_price  = $sign * $product->get_price( ) * ($value/100);
			
		}
		$price_string = $use_currecy_symbol ? sprintf(get_woocommerce_price_format(), get_woocommerce_currency_symbol(),$price) : $price;
		return array('price'=>$price_string, 'num'=>$num, 'single_numeric_price' => $single_numeric_price);
	}
	public function get_cart_item_price($item_id, $variation_id = 0)
	{
		$cart_items = WC()->cart->cart_contents;
		if(!isset($item_id) || empty($cart_items))
			return false;
		global $wcuf_wpml_helper;
		 
		foreach((array)$cart_items as $item)
		{
			if($wcuf_wpml_helper->wpml_is_active())
			{
				$item['product_id'] = $wcuf_wpml_helper->get_main_language_id($item['product_id']);
				$item['variation_id'] = $wcuf_wpml_helper->get_main_language_id($item['variation_id']);
			}
			if($item['product_id'] == $item_id && ($variation_id == 0 || $item['variation_id'] == $variation_id ))
			{
				return $item["data"]['price'];
			}
		}
		return false;
	}
	public function item_is_in_cart($ids)
	{
		$item_id = $ids['product_id'];
		$variation_id = $ids['variant_id'];
		$unique_id = $ids['is_sold_individually'] ? $ids['unique_product_id'] : false;
		
		$cart_items = WC()->cart->cart_contents;
		if(!isset($item_id) || empty($cart_items))
			return false;
		global $wcuf_wpml_helper;
		
		foreach((array)$cart_items as $item)
		{
			if($wcuf_wpml_helper->wpml_is_active())
			{
				$item['product_id'] = $wcuf_wpml_helper->get_main_language_id($item['product_id']);
				$item['variation_id'] = $wcuf_wpml_helper->get_main_language_id($item['variation_id']);
			}
			if($item['product_id'] == $item_id && 
				($variation_id == 0 || $item['variation_id'] == $variation_id ) &&
				(!$unique_id || (isset($item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) && $item[WCUF_Cart::$sold_as_individual_item_cart_key_name] == $unique_id ))
			)
				return true;
		}
		return false;
	}
	/* Add to cart: if needed uncomment to implement validation when adding a product to cart
	 public function cart_add_to_validation( $original_result, $product_id, $quantity , $variation_id = 0, $variations = null )
	{
		global $woocommerce,$wcps_product_model;

		//wcps_var_dump($product_id." ".$quantity);
		//wcps_var_dump(WC()->cart);
		//WC()->cart
		//$woocommerce->add_error( sprintf( "You must add a minimum of %s %s's to your cart to proceed." , $minimum, $product_title ) );
		$result = $wcps_product_model->customer_can_purchase_product($product_id,  $variation_id,  $quantity, false);
		if(!$result['result'])
			foreach($result['messages'] as $message)
				wc_add_notice( $message ,'error');
		
		if($result['result'] == true)
			$result['result'] = $original_result;
		
		return $result['result'];
	} */
	
	//Update cart
	public function cart_update_validation($original_result = true, $cart_item_key = null, $values = null, $quantity = 0 )
	{
		global $woocommerce, $wcuf_product_model;
		$cart = WC()->cart;
		$removed = false;
		
		foreach($cart->cart_contents  as $item_cart_key => $item)
		{
			if(isset($item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) && !$wcuf_product_model->sold_as_individual_product($item["product_id"], $item["variation_id"]))
			{
				$removed = true;
				$cart->remove_cart_item($item_cart_key);
			}
			elseif(!isset($item[WCUF_Cart::$sold_as_individual_item_cart_key_name]) && $wcuf_product_model->sold_as_individual_product($item["product_id"], $item["variation_id"]))
			{
				$removed = true;
				$cart->remove_cart_item($item_cart_key);
			}
		
		}
		
		if($removed)
			wc_add_notice( esc_html__('Invalid item(s) were removed from your cart.', 'woocommerce-files-upload') ,'error');
		return $original_result;
	}
}
?>