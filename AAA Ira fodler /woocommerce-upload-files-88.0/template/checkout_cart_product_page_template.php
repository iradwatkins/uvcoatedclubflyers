<?php 
/* Version: 1.8 */
?>
<div class="wcuf_file_uploads_container" id="wcuf_file_uploads_container_<?php echo $container_unique_id; ?> " data-id="<?php echo $container_unique_id;?>">
<input type="hidden" value="yes" name="wcuf-uploading-data"></input>
<?php 
$exists_one_required_field = false;
$exists_a_field_to_show_before_adding_item_to_cart = false;
$post_max_size = WCUF_File::return_bytes(ini_get('post_max_size'));
$max_chunk_size = WCUF_File::return_bytes($wcuf_option_model->get_php_settings('size_that_can_be_posted'));
$is_variable_product_page = isset($is_variable_product_page) ? $is_variable_product_page : false;
$exists_at_least_one_upload_field_bounded_to_variations = false;
$exists_at_least_one_upload_field_bounded_to_gateway = false;
$exists_at_least_one_upload_field_bounded_to_shipping_method = false;
$bad_chars = array('"', "'");
$num_total_uploaded_files = 0;
$total_costs = 0;
if(is_array($file_fields_groups))
foreach($file_fields_groups as $file_fields):  
	
		$enable_for = isset($file_fields['enable_for']) ? $file_fields['enable_for']:'always';
		$hide_upload_after_upload = isset($file_fields['hide_upload_after_upload']) ? $file_fields['hide_upload_after_upload']:false;
		$hide_extra_info = isset($file_fields['hide_extra_info']) ? $file_fields['hide_extra_info']:false;
		$display_on_checkout = isset($file_fields['display_on_checkout']) ? $file_fields['display_on_checkout']:false;
		$display_on_product = isset($file_fields['display_on_product']) ? $file_fields['display_on_product']:false;
		$display_on_product_before_adding_to_cart = isset($file_fields['display_on_product_before_adding_to_cart']) ? $file_fields['display_on_product_before_adding_to_cart']:false;
		$display_on_cart = isset($file_fields['display_on_cart']) ? $file_fields['display_on_cart']:false;
		$display_text_field = isset($file_fields['text_field_on_order_details_page']) ? (bool)$file_fields['text_field_on_order_details_page']:false;
		$text_field_max_input_chars = !isset($file_fields['text_field_max_input_chars']) ?  0:$file_fields['text_field_max_input_chars'];
		$is_text_field_required = isset($file_fields['is_text_field_on_order_details_page_required']) ? (bool)$file_fields['is_text_field_on_order_details_page_required']:false;
		$display_disclaimer_checkbox = isset($file_fields['disclaimer_checkbox']) ? (bool)$file_fields['disclaimer_checkbox']:false;
		$disclaimer_text = isset($file_fields['disclaimer_text']) ? $file_fields['disclaimer_text']:"";
		$hide_on_shortcode_form = isset($file_fields['hide_on_shortcode_form']) ? $file_fields['hide_on_shortcode_form']:false;
		$required_on_checkout = isset($file_fields['required_on_checkout']) ? $file_fields['required_on_checkout']:false;
		$multiple_uploads_max_files_depends_on_quantity = isset($file_fields['multiple_uploads_max_files_depends_on_quantity']) && !$display_on_product_before_adding_to_cart ? $file_fields['multiple_uploads_max_files_depends_on_quantity']:false;
		$multiple_uploads_min_files_depends_on_quantity = isset($file_fields['multiple_uploads_min_files_depends_on_quantity']) && !$display_on_product_before_adding_to_cart ? $file_fields['multiple_uploads_min_files_depends_on_quantity']:false;
		$multiple_uploads_minimum_required_files = isset($file_fields['multiple_uploads_minimum_required_files']) ? $file_fields['multiple_uploads_minimum_required_files']:0;
		$disable_stacking = isset($file_fields['disable_stacking']) ? (bool)$file_fields['disable_stacking']:false;
		$disable_stacking_for_variation = isset($file_fields['disable_stacking_for_variation']) /* &&  !$display_on_product_before_adding_to_cart */? (bool)$file_fields['disable_stacking_for_variation']:false; //No longer need the "&& $display_on_product_before_adding_to_cart": now it is possible to display for variation before adding them to the cart
		$multiple_files_min_size_sum = isset($file_fields['multiple_files_min_size_sum']) ? $file_fields['multiple_files_min_size_sum']*1048576:0;
		$multiple_files_max_size_sum = isset($file_fields['multiple_files_max_size_sum']) ? $file_fields['multiple_files_max_size_sum']*1048576:0;
		$min_size = isset($file_fields['min_size']) ? $file_fields['min_size']*1048576:0;
		$selected_categories = isset($file_fields['category_ids']) ? $file_fields['category_ids']:array();
		$selected_attributes = !isset($file_fields['attributes_ids']) ? array(): $file_fields['attributes_ids'];
		$selected_products = isset($file_fields['products_ids']) ? $file_fields['products_ids']:array();
		$enable_multiple_uploads_per_field = isset($file_fields['enable_multiple_uploads_per_field']) ? (bool)$file_fields['enable_multiple_uploads_per_field'] : false;
		$display_product_fullname = isset($file_fields['full_name_display']) ? $file_fields['full_name_display']:true; //Usefull only for variable products
		$display_simple_product_name_with_attributes = isset($file_fields['display_simple_product_name_with_attributes']) ? $file_fields['display_simple_product_name_with_attributes']:false; //Usefull only for simple products
		$all_products_cats_ids = array();
		$products_for_which_stacking_is_disabled = array();
		$can_render = $enable_for == 'always' ? true:false;
		$dimensions_logical_operator = isset($file_fields['dimensions_logical_operator']) ? $file_fields['dimensions_logical_operator'] : 'and';
		$max_width = isset($file_fields['width_limit']) ? $file_fields['width_limit'] : 0;
		$max_height = isset($file_fields['height_limit']) ? $file_fields['height_limit'] : 0;
		$min_width_limit = isset($file_fields['min_width_limit']) ? $file_fields['min_width_limit'] : 0;
		$min_height_limit = isset($file_fields['min_height_limit']) ? $file_fields['min_height_limit'] : 0;
		$min_dpi_limit = isset($file_fields['min_dpi_limit']) ? $file_fields['min_dpi_limit'] : 0;		
		$max_dpi_limit = isset($file_fields['max_dpi_limit']) ? $file_fields['max_dpi_limit'] : 0;	
		$ratio_x = isset($file_fields['ratio_x']) ? $file_fields['ratio_x'] : 0;		
		$ratio_y = isset($file_fields['ratio_y']) ? $file_fields['ratio_y'] : 0;	
		$min_seconds_length = isset($file_fields['min_seconds_length']) ? $file_fields['min_seconds_length'] : 0;		
		$max_seconds_length = isset($file_fields['max_seconds_length']) ? $file_fields['max_seconds_length'] : 0;
		$consider_sum_of_media_seconds = isset($file_fields['consider_sum_of_media_seconds']) ? $file_fields['consider_sum_of_media_seconds'] : false;
		$enable_crop_editor = isset($file_fields['enable_crop_editor']) ?  $file_fields['enable_crop_editor']:false;
		$crop_mandatory_for_multiple_files_upload = isset($file_fields['crop_mandatory_for_multiple_files_upload']) ?  $file_fields['crop_mandatory_for_multiple_files_upload']:false;
		$crop_area_type = isset($file_fields['crop_area_type']) ?  $file_fields['crop_area_type']:'square';
		$cropped_image_width = isset($file_fields['cropped_image_width']) ?  $file_fields['cropped_image_width']:200;
		$cropped_image_height = isset($file_fields['cropped_image_height']) ?  $file_fields['cropped_image_height']:200;
		$crop_image_fit_canvas = wcuf_get_value_if_set($file_fields, 'crop_image_fit_canvas', false);
		$crop_disable_aspect_ratio_for_free_resize = wcuf_get_value_if_set($file_fields, 'crop_disable_aspect_ratio_for_free_resize', "false");
		$crop_auto_adjust = wcuf_get_value_if_set($file_fields, 'crop_auto_adjust', "false");
		$crop_use_ratio = wcuf_get_value_if_set($file_fields, 'crop_use_ratio', "false");
		$crop_compress_image = wcuf_get_value_if_set($file_fields, 'crop_enable_compression', false);
		$crop_compression_quality = wcuf_get_value_if_set($file_fields, 'crop_crompression_quality', 1);
		$text_field_description = isset($file_fields['text_field_description']) ? $file_fields['text_field_description'] : "";
		$text_field_label = isset($file_fields['text_field_label']) ? $file_fields['text_field_label'] : "";
		$roles = !isset($file_fields['roles']) ?  array():$file_fields['roles'];
		$roles_policy = !isset($file_fields['roles_policy']) ?  "allow":$file_fields['roles_policy'];
		$visibility_gateways = !isset($file_fields['visibility_gateways']) ?  array():$file_fields['visibility_gateways'];
		$visibility_payment_gateway_policy = !isset($file_fields['visibility_payment_gateway_policy']) ?  "allow":$file_fields['visibility_payment_gateway_policy'];
		$visibility_shipping_methods = !isset($file_fields['shipping_method']) ?  array():$file_fields['shipping_method'];		
		$preview_images_before_upload_disabled = !isset($file_fields['preview_images_before_upload_disabled']) ? false:$file_fields['preview_images_before_upload_disabled'];
		$disable_quantity_selector = wcuf_get_value_if_set($file_fields, 'disable_cart_quantity_as_number_of_uploaded_files', false);
		$file_fields['extra_cost_detect_pdf'] = isset($file_fields['extra_cost_detect_pdf']) ? $file_fields['extra_cost_detect_pdf'] : false;
		$toggle_autoupload = wcuf_get_value_if_set($file_fields, 'toggle_autoupload', 'false') == "true";
		$exists_one_required_field = !$exists_one_required_field && $required_on_checkout ? true:$exists_one_required_field;
		$exists_at_least_one_upload_field_bounded_to_gateway = $exists_at_least_one_upload_field_bounded_to_gateway ? true : !empty($visibility_gateways);
		$exists_at_least_one_upload_field_bounded_to_shipping_method = $exists_at_least_one_upload_field_bounded_to_shipping_method ? true : !empty($visibility_shipping_methods);
		$delete_previous_uploaded_file_in_session = false;
		
		//In case of "Order uploads", if the upload field is rendeerd inside the product table, the template returns
		if($is_cart_item_table && !$disable_stacking)
			continue;
		
		//Role check
		if(!empty($roles) && !$wcuf_customer_model->belongs_to_allowed_roles($roles,$roles_policy))
			continue;
		
		if(!$disable_stacking_for_variation)
			foreach($item_to_show_upload_fields as $product_index => $product)
			{
				//$item_to_show_upload_fields[$product_index]['orignial_variation_id'] = $item_to_show_upload_fields[$product_index]['variation_id'] ;
				$item_to_show_upload_fields[$product_index]['variation_id'] = 0;
				$current_item_data['variation_id'] = 0;
			}
		
		//Visibility per gateway
		if(!empty($visibility_gateways) && (!isset($current_payment_method) || !$wcuf_order_model->is_selected_payment_method_allowed($current_payment_method, $visibility_gateways,$visibility_payment_gateway_policy)))
		{
			foreach($item_to_show_upload_fields as $product)
			{
				$wcuf_session_model->remove_all_item_data($file_fields['id'], $product['product_id'], $product['variation_id']);
			}	
			continue;
		}
		
		//Visibility per shipping method
		if(!empty($visibility_shipping_methods) && (!isset($current_shipping_method) || !$wcuf_order_model->is_selected_shipping_method_allowed($current_shipping_method, $visibility_shipping_methods)))
		{
			foreach($item_to_show_upload_fields as $product)
			{
				$wcuf_session_model->remove_all_item_data($file_fields['id'], $product['product_id'], $product['variation_id']);
			}	
			continue;
		}
		//Visibility per time
		if(!$wcuf_time_model->can_be_displayed($file_fields))
			continue;
		
		$enable_upload_per_file = false;
		if(($current_page == 'shortcode' && !$hide_on_shortcode_form) || ($display_on_checkout && $current_page == 'checkout') || ($display_on_cart && $current_page == 'cart')  || ($display_on_product && $current_page == 'product'))
		{
			//1: which restriction applies (if any)
			if(($enable_for === 'always' && $disable_stacking) || $enable_for !== 'always' && (count($selected_categories) > 0 || count($selected_products) > 0 || count($selected_attributes) > 0))
			{
						
				//Forcing field to show even if the product has not been added to the cart
				$filtered_item_to_show_upload_fields = $item_to_show_upload_fields;
				if($display_on_product && $current_page == 'product' && ($display_on_product_before_adding_to_cart || $wcuf_product_model->sold_as_individual_product($current_item_data["product_id"], $current_item_data["variation_id"]))) // Field will not be showed until a variation has been selected
				{
					$exists_a_field_to_show_before_adding_item_to_cart = true;
					$display_on_product_before_adding_to_cart = true; //In case was false BUT the product is sold as individul
					$filtered_item_to_show_upload_fields = array($current_item_data);
				}
				foreach($filtered_item_to_show_upload_fields as $product)
				{
					if($wcuf_product_model->sold_as_individual_product($product["product_id"], $product["variation_id"]))
					{
						$orignial_variation_id = isset($product['orignial_variation_id']) ? $product['orignial_variation_id'] : $product['variation_id'];
						if($current_page == 'product')
						{
							//WooCommerce TM Extra Product Options: if the id is already set, it means we are editing the product
							if(!isset($product[WCUF_Cart::$sold_as_individual_item_cart_key_name])) 
							{
								$product[WCUF_Cart::$sold_as_individual_item_cart_key_name] = $wcuf_cart_model->generate_unique_individual_id($product['product_id'], $orignial_variation_id , false);
								//delete previous uploaded files 
								//$delete_previous_uploaded_file_in_session = !$is_ajax_request ? true : false;
							}
						}
						else 
						{
							$product[WCUF_Cart::$sold_as_individual_item_cart_key_name] = $wcuf_cart_model->retrieve_my_unique_individual_id($product);							
						}
					}
					else 
					{
						$product[WCUF_Cart::$sold_as_individual_item_cart_key_name] = 0;
					}
					
					//if current item is not in cart or this is not the product page for configured id(s) (product page)
					if($current_page == 'product' && $product['product_id'] != $current_product_id)
					{
						continue;
					}
					if( isset($product['bundled_by']))
						continue;
					
					//WPML
					if($wcuf_wpml_helper->wpml_is_active())
					{
						$product['product_id'] = $wcuf_wpml_helper->get_main_language_id($product['product_id']);
						if($product['variation_id'] != 0)
							$product['variation_id'] = $wcuf_wpml_helper->get_main_language_id($product['variation_id'], 'product_variation');
					}
					
					//2. Check restriction: product, categories or attributes
					//attributes 
					if(!empty($selected_attributes))
					{
						foreach($selected_attributes as $attribute_value_id)
						{
							$tmp_product_id = $product['variation_id'] != 0 ? $product['variation_id'] : $product['product_id'];
							$selected_products[] = $wcuf_product_model->has_attribute_value($tmp_product_id, $attribute_value_id) ? $tmp_product_id : -1;
						}
					}
					//end attributes 
					
					//products
					$discard_field = false;
					if(!empty($selected_products) )
					{
						foreach($selected_products as $product_id)
						{	
							$variation_id = $is_variation = 0;
							//if(!$display_on_product_before_adding_to_cart) //No longer used: now it is possible to display for variation before adding them to the cart
							{
								$is_variation = $wcuf_product_model->is_variation($product_id);
								$variation_id = $is_variation > 0 ? $product_id : 0 ;
								$product_id = $is_variation > 0 ? $is_variation : $product_id ;
							}
							
							$discard_field = false;
							if( ($product_id == $product['product_id'] && ($variation_id == 0 || $variation_id == $product['variation_id']) && ($enable_for === 'categories' || $enable_for === 'categories_children'))
								|| ( !in_array($product['product_id'], $selected_products) && !in_array($product['variation_id'], $selected_products) && ($enable_for === 'disable_categories' || $enable_for === 'disable_categories_children')) 
							   )
								{
									if($disable_stacking)
										$enable_upload_per_file = true;
									$can_render = true;
									
									$force_disable_stacking_for_variation = $product['force_disable_stacking_for_variation'] = $disable_stacking_for_variation;
									 
									//In case of variable
									if(!wcuf_product_is_in_array($product, $products_for_which_stacking_is_disabled, $force_disable_stacking_for_variation, $disable_stacking ))
									{
										$products_for_which_stacking_is_disabled[] = $product;
									}
								}
								elseif( $enable_for !== 'always') 
									$discard_field = true;
						}
					}
					else if($enable_for === 'always' && $disable_stacking)
					{
						$enable_upload_per_file = true;
						$can_render = true;
						//In case of variable
						if(!wcuf_product_is_in_array($product, $products_for_which_stacking_is_disabled, $disable_stacking_for_variation, $disable_stacking))
							$products_for_which_stacking_is_disabled[] = $product;
					}
					//end product 
							
			
					//product categories
					$product_cats = wp_get_post_terms( $product["product_id"], 'product_cat' );
					$current_product_categories_ids = array();
					foreach($product_cats as $category)
					{
						$category_id = $wcuf_wpml_helper->get_main_language_id( $category->term_id, 'product_cat');
						
						if(!$disable_stacking)
							array_push($all_products_cats_ids, (string)$category_id);
						else
							array_push($current_product_categories_ids, (string)$category_id);
						
						//parent categories
						if($enable_for == "categories_children" || $enable_for == "disable_categories_children")
						{
							$parents =  get_ancestors( $category_id , 'product_cat' ); 
							foreach($parents as $parent_id)
							{
								$temp_category = $wcuf_wpml_helper->get_main_language_id($parent_id, 'product_cat');
								if(!$disable_stacking)
									array_push($all_products_cats_ids, (string)$temp_category);
								else
									array_push($current_product_categories_ids, (string)$temp_category); //category_id
							}
						}
					}
					//Can enable upload for this product? (if stacking uploads are disabled)
					if($disable_stacking && count($selected_categories) > 0)
					{
						if($enable_for === 'categories' || $enable_for === 'categories_children')
						{
							if(array_intersect($selected_categories, $current_product_categories_ids))
							{
								if(!wcuf_product_is_in_array($product, $products_for_which_stacking_is_disabled, $disable_stacking_for_variation, $disable_stacking))
									array_push($products_for_which_stacking_is_disabled, $product);
								$can_render = true;
							}
						}
						elseif(!$discard_field)
						{
							if(!array_intersect($selected_categories, $current_product_categories_ids))
							{
								if(!wcuf_product_is_in_array($product, $products_for_which_stacking_is_disabled, $disable_stacking_for_variation, $disable_stacking))
									array_push($products_for_which_stacking_is_disabled, $product);
								$can_render = true;
							}
							else $can_render = false;
						}	
					}
					//end categories
					
				} //ends product foreach
				
				
				//NOTE $product is the last and only found element  found in foreach ************************
				
				//Cumulative ORDER catagories. If exists at least one product with an "enabled"/"disabled" category, upload field can be rendered
				if(!$disable_stacking && count($selected_categories) > 0)
					if($enable_for === 'categories' || $enable_for === 'categories_children')
					{  
						if(array_intersect($selected_categories, $all_products_cats_ids))
							$can_render = true;
					}
					elseif(!$discard_field)
					{ 
						if(!array_intersect($selected_categories, $all_products_cats_ids))
							$can_render = true;
						else $can_render = false;
					}	
				$exists_a_field_to_show_before_adding_item_to_cart = $can_render && $display_on_product && $current_page == 'product' && $display_on_product_before_adding_to_cart ? true : $exists_a_field_to_show_before_adding_item_to_cart;
				
				// Field will not be showed until a variation has been selected IF THE FIELD IS SPECIFIC TO VARIATIONS
				if($current_page == 'product' && ($is_variable_product_page && $disable_stacking_for_variation) && $display_on_product_before_adding_to_cart && !$is_ajax_request) 
				{
					$exists_at_least_one_upload_field_bounded_to_variations = true;
					continue;
				}
			}
			//End computation -> Fields rendering
			
			
			//Cart item table check 
			if(!$is_cart_item_table && (($current_page == 'cart'  || $current_page == 'checkout') && !$display_outside_product_table )) //check on page because the feature is only available for the Cart page
			{
				//In case the item table is not rendered ($is_cart_item_table is false), the upload fields for specific product are emptied.
				$products_for_which_stacking_is_disabled = array(); 
			}
			else if($is_cart_item_table)
			{
				$can_render = empty($products_for_which_stacking_is_disabled) ? false : true;
			}
			
			if($can_render && ((!$disable_stacking && !$enable_upload_per_file) || (!empty($products_for_which_stacking_is_disabled)))):  ?>
		<div class="wcuf_single_upload_field_container" id="<?php if(isset($file_fields['field_css_id'])) echo $file_fields['field_css_id'];?>">
			<?php
				
				//Checks if the upload is an "order upload" or "product upload"
				if(!$disable_stacking && !$enable_upload_per_file):
				
					if(!isset($product))
						$product = null;
				
					$upload_field_id = "wcufuploadedfile_".$file_fields['id'];
					/* if($delete_previous_uploaded_file_in_session)
						$wcuf_session_model->remove_item_data($upload_field_id); */
					$num_of_uploaded_files = $wcuf_upload_field_model->get_num_uploaded_files_in_session($upload_field_id, $all_options['max_uploaded_files_number_considered_as_sum_of_quantities']);
					$item_in_cart_temp =  $wcuf_session_model->get_item_data($upload_field_id);
					$upload_has_been_performed = false;
					if(isset($item_in_cart_temp))
					{
						$item_in_cart_temp['is_order_field'] = false;
						$upload_has_been_performed = isset($item_in_cart_temp) ? true : false;
					}
					$multiple_uploads_max_files = $upload_has_been_performed ? 0 : 1;
					$multiple_uploads_min_files = 1;
					$unlimited_uploads = $file_fields['multiple_uploads_max_files'] == 0 ? true : false;
					$feedback_can_be_peformed = $upload_has_been_performed ? false : true;
					
					//Min/max uploadable files
					if($enable_multiple_uploads_per_field)
					{
						if($required_on_checkout)
							$multiple_uploads_min_files = $multiple_uploads_min_files == 0 ? 1 : $multiple_uploads_min_files;
						$multiple_uploads_max_files  = $file_fields['multiple_uploads_max_files'] != 0 && $file_fields['multiple_uploads_max_files'] - $num_of_uploaded_files >= 0 ? $file_fields['multiple_uploads_max_files'] - $num_of_uploaded_files : 0;
						$multiple_uploads_min_files = $num_of_uploaded_files > $multiple_uploads_minimum_required_files ? 0 : $multiple_uploads_minimum_required_files - $num_of_uploaded_files;
						
						$feedback_can_be_peformed = $unlimited_uploads || $multiple_uploads_max_files > 0 ? true : false;
				}
				
				?>
			<div class="wcuf_upload_fields_row_element">
				<!-- Upload field title -->
				<div class="wcuf-title-container">
					<<?php echo $all_options['upload_field_title_style']; ?> style="margin-bottom:5px;  margin-top:15px;" class="wcuf_upload_field_title <?php if($required_on_checkout /* && $current_page == 'checkout' */) echo 'wcuf_required_label'; ?>"><?php  echo $file_fields['title'] ?></<?php echo $all_options['upload_field_title_style']; ?>>
				</div>
				<!-- Progess bar UI -->
				<div class="wcuf_upload_status_box" id="wcuf_upload_status_box_<?php echo $file_fields['id']; ?>">
					<div class="wcuf_multiple_file_progress_container" id="wcuf_multiple_file_progress_container_<?php echo $file_fields['id']; ?>">
						<span class="wcuf_total_files_progress_bar_title"><?php esc_html_e('Total: ', 'woocommerce-files-upload'); ?></span>
						<div class="wcuf_bar" id="wcuf_multiple_file_bar_<?php echo $file_fields['id']; ?>"></div>
						<div id="wcuf_multiple_file_upload_percent_<?php echo $file_fields['id']; ?>"></div>
						<span class="wcuf_current_file_progress_bar_title" ><?php esc_html_e('Current: ', 'woocommerce-files-upload'); ?></span>
					</div>
					<div class="wcuf_bar" id="wcuf_bar_<?php echo $file_fields['id']; ?>"></div >
					<div class="wcuf_percent" id="wcuf_percent_<?php echo $file_fields['id']; ?>">0%</div>
					<div class="wcuf_status" id="wcuf_status_<?php echo $file_fields['id']; ?>"></div>
					<button class="button wcuf_abort_upload" id="wcuf_abort_upload_<?php echo $file_fields['id']; ?>" data-id="<?php echo $file_fields['id']; ?>" data-container-unique-id="<?php echo $container_unique_id; ?>" data-cart-item-id="<?php echo $cart_item_id; ?>" ><?php esc_html_e('Cancel', 'woocommerce-files-upload'); ?></button>
				</div>
				
				<div class="wcuf_to_hide_when_performing_data_transimssion">	
				<!-- Upload field rendering -->
				<?php if(!$hide_upload_after_upload || ($hide_upload_after_upload && !$upload_has_been_performed)):?>
					<p class="wcuf_field_description"><?php echo do_shortcode($file_fields['description']); ?></p>
				<?php endif; ?>
				<?php if($display_text_field): ?>
					<?php if($text_field_label != ""):?>
						<h5><?php echo $text_field_label; ?></h5>
					<?php endif; ?>
					<?php if ($text_field_description != ""): ?>
						<div class="wpuef_text_field_description"><?php echo $text_field_description; ?></div>
					<?php endif; ?>
					<textarea data-id="<?php echo $file_fields['id']; ?>" class="wcuf_feedback_textarea" id="wcuf_feedback_textarea_<?php echo $file_fields['id']; ?>" name="wcuf[<?php echo $file_fields['id']; ?>][user_feedback]" <?php if($is_text_field_required) echo 'required="required"'; if(!$feedback_can_be_peformed) echo "disabled";?> <?php if($text_field_max_input_chars != 0) echo 'maxlength="'.$text_field_max_input_chars.'"';?>><?php if(isset($item_in_cart_temp) ) echo $item_in_cart_temp['user_feedback'];?></textarea>
				<?php endif;?>
				<?php 
					   $upload_field_unique_name = $file_fields['title'];
					  if( ($enable_multiple_uploads_per_field && ($unlimited_uploads || $multiple_uploads_max_files > 0)) || !$upload_has_been_performed ): ?>
							<input type="hidden" name="wcuf[<?php echo $file_fields['id']; ?>][title]" value="<?php echo $upload_field_unique_name; ?>"></input>
							<input type="hidden" name="wcuf[<?php echo $file_fields['id']; ?>][id]" value="<?php echo $file_fields['id']; ?>"></input>
							<input type="hidden" id="wcuf-filename-<?php echo $file_fields['id']; ?>" name="wcuf[<?php echo $file_fields['id']; ?>][file_name]" value=""></input>
							<div class="wcuf_upload_button_container">
								<?php if($display_disclaimer_checkbox): ?>
									<label class="wcuf_disclaimer_label"><input type="checkbox" class="wcuf_disclaimer_checkbox" id="wcuf_disclaimer_checkbox_<?php echo $file_fields['id']; ?>"></input><span class="wcuf_discaimer_text"><?php echo $disclaimer_text;?></span></label>
								<?php endif; ?>
								<?php if($all_options['drag_and_drop_disable']):?>
									<button id="wcuf_upload_field_button_<?php echo $file_fields['id']; ?>"  style="margin-right:<?php echo $style_options['css_distance_between_upload_buttons']; ?>px;" class="button wcuf_upload_field_button <?php echo $additional_button_class;?>" data-id="<?php echo $file_fields['id']; ?>"><?php if(!$enable_multiple_uploads_per_field) echo $button_texts['drag_and_drop_area_single_file_instruction']; else echo $button_texts['drag_and_drop_area_instruction']; ?></button>
								<?php else: ?>
									<div id="wcuf_upload_field_button_<?php echo $file_fields['id']; ?>" class="wcuf_upload_field_button wcuf_upload_drag_and_drop_area" data-id="<?php echo $file_fields['id']; ?>">
										<svg class="wcuf_drag_and_drop_area_icon" xmlns="http://www.w3.org/2000/svg" width="50" height="43" viewBox="0 0 50 43"><path d="M48.4 26.5c-.9 0-1.7.7-1.7 1.7v11.6h-43.3v-11.6c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v13.2c0 .9.7 1.7 1.7 1.7h46.7c.9 0 1.7-.7 1.7-1.7v-13.2c0-1-.7-1.7-1.7-1.7zm-24.5 6.1c.3.3.8.5 1.2.5.4 0 .9-.2 1.2-.5l10-11.6c.7-.7.7-1.7 0-2.4s-1.7-.7-2.4 0l-7.1 8.3v-25.3c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v25.3l-7.1-8.3c-.7-.7-1.7-.7-2.4 0s-.7 1.7 0 2.4l10 11.6z"/></svg>
										<span class="wcuf_drag_and_drop_area_description"><?php echo !$enable_multiple_uploads_per_field ? $button_texts['drag_and_drop_area_single_file_instruction'] : $button_texts['drag_and_drop_area_instruction'];?></span>
									</div>
								<?php endif; ?>
								<button id="wcuf_upload_multiple_files_button_<?php echo $file_fields['id']; ?>" class="button wcuf_upload_multiple_files_button <?php echo $additional_button_class;?>" data-id="<?php echo $file_fields['id']; ?>"><?php echo $button_texts['upload_selected_files_button']; ?></button>
								<input type="file"  data-title="<?php echo $file_fields['title']; ?>" id="wcuf_upload_field_<?php echo $file_fields['id']; ?>" 
													data-disclaimer="<?php echo $display_disclaimer_checkbox;?>"  
													data-id="<?php echo $file_fields['id']; ?>" 
													data-required="<?php if($required_on_checkout) echo 'true'; else echo 'false' ?>" 
													data-min-files="<?php echo $multiple_uploads_min_files ?>" 
													data-max-files="<?php echo $multiple_uploads_max_files; ?>" 
													data-dimensions-logical-operator="<?php echo $dimensions_logical_operator; ?>" 
													data-max-width="<?php echo $max_width; ?>" 
													data-max-height="<?php echo $max_height; ?>" 
													data-min-height="<?php echo $min_height_limit; ?>" 
													data-min-width="<?php echo $min_width_limit; ?>" 
													data-min-dpi="<?php echo $min_dpi_limit; ?>" 
													data-max-dpi="<?php echo $max_dpi_limit; ?>" 
													data-ratio-x="<?php echo $ratio_x; ?>" 
													data-ratio-y="<?php echo $ratio_y; ?>" 
													data-min-length="<?php echo $min_seconds_length; ?>" 
													data-max-length="<?php echo $max_seconds_length; ?>" 
													data-length-already-uploaded="<?php echo $wcuf_media_model->get_sum_of_media_length($item_in_cart_temp); ?>" 
													data-consider-sum-length="<?php echo $consider_sum_of_media_seconds; ?>" 
													data-images-preview-disabled= "<?php echo $preview_images_before_upload_disabled ? 'true' : 'false';?>"
													data-detect-pdf = "<?php echo $file_fields['extra_cost_detect_pdf'] ? 'true' : 'false';?>" 
													data-disable-quantity-selector = "<?php echo $disable_quantity_selector ? 'true' : 'false';?>" 
													data-toggle-autoupload = "<?php echo $toggle_autoupload ? 'true' : 'false';?>" 
													data-cropped-width="<?php echo $cropped_image_width; ?>" 
													data-cropped-height="<?php echo $cropped_image_height; ?>" 
													data-cropper-autoadjust="<?php echo $crop_auto_adjust; ?>" 
													data-cropper-disable-aspect-ration-for-free-resize="<?php echo $crop_disable_aspect_ratio_for_free_resize; ?>" 
													data-cropper-enable-ratio="<?php echo $crop_use_ratio; ?>" 
													data-cropper-compress-image="<?php echo $crop_compress_image ? "true" : "false"; ?>" 
													data-cropper-compression-quality="<?php echo $crop_compression_quality; ?>" 
													data-cropper-image-fit-canvas="<?php echo $crop_image_fit_canvas ? 'true' : 'false'; ?>" 
													data-cropper-allow-resize="<?php echo wcuf_get_value_if_set($file_fields, 'crop_allow_resize', "false") ? 'true' : 'false'; ?>" 	
													data-multiple-files-max-sum-size="<?php echo $multiple_files_max_size_sum; ?>"
													data-multiple-files-min-sum-size="<?php echo $multiple_files_min_size_sum; ?>"
													data-is-multiple-files="<?php if($enable_multiple_uploads_per_field) echo 'true'; else echo 'false'; ?>" 
													data-enable-crop-editor="<?php echo $enable_crop_editor; ?>" 
													data-crop-mandatory-for-multiple-uploads="<?php echo $crop_mandatory_for_multiple_files_upload; ?>" 
													data-crop-area-shape="<?php echo $crop_area_type; ?>" 
													class="wcuf_file_input <?php if($enable_multiple_uploads_per_field) echo 'wcuf_file_input_multiple'; ?>" <?php if($enable_multiple_uploads_per_field)  echo 'multiple="multiple"'; ?> 
													name="wcufuploadedfile_<?php echo $file_fields['id']?>"  <?php if($file_fields['types'] != '') echo 'accept="'.$file_fields['types'].'"';?> 
													data-min-size="<?php echo $min_size; ?>"
													data-size="<?php echo $file_fields['size']*1048576; ?>" value="<?php echo $file_fields['size']*1048576; ?>"   
													data-container-unique-id="<?php echo $container_unique_id; ?>"
													data-cart-item-id="<?php echo $cart_item_id; ?>"
													<?php //if($required_on_checkout ) echo 'required="required"'; ?>></input>
							</div>
							<?php if(!$hide_extra_info): ?>							
							<strong class="wcuf_max_size_notice" id="wcuf_max_size_notice_<?php echo $file_fields['id'];?>">
											<?php if($min_size !=0) echo sprintf(esc_html__('Min size: %s MB', 'woocommerce-files-upload'), $min_size/1048576)."<br/>"; 
												  if($file_fields['size'] !=0) echo sprintf(esc_html__('Max size: %s MB', 'woocommerce-files-upload'),$file_fields['size'])."<br/>"; 	
												  if($enable_multiple_uploads_per_field && $multiple_uploads_min_files) esc_html__('Min files: ', 'woocommerce-files-upload').$multiple_uploads_min_files."<br/>"; 
												  if($enable_multiple_uploads_per_field && $multiple_uploads_max_files && !$unlimited_uploads) esc_html__('Max files: ', 'woocommerce-files-upload').$multiple_uploads_max_files."<br/>";
											      if($min_width_limit) echo esc_html__('Min width: ', 'woocommerce-files-upload').$min_width_limit."px"."<br/>"; 
												  if($max_width) echo esc_html__('Max width: ', 'woocommerce-files-upload').$max_width."px"."<br/>"; 
												  if($min_height_limit) echo esc_html__('Min height: ', 'woocommerce-files-upload').$min_height_limit."px"."<br/>"; 
												  if($max_height) echo esc_html__('Max height: ', 'woocommerce-files-upload').$max_height."px"."<br/>"; 
												  if($min_dpi_limit) echo esc_html__('Min DPI: ', 'woocommerce-files-upload').$min_dpi_limit."px"."<br/>";   
												  if($max_dpi_limit) echo esc_html__('Max DPI: ', 'woocommerce-files-upload').$max_dpi_limit."px"."<br/>"; 
												  if($ratio_x && $ratio_y) echo esc_html__('Ratio: ', 'woocommerce-files-upload').$ratio_x.":".$ratio_y."<br/>"; 
												  if($min_seconds_length) echo esc_html__('Min length: ', 'woocommerce-files-upload').wcuf_format_seconds_to_readable_length($min_seconds_length)."<br/>"; 
												  if($max_seconds_length) echo esc_html__('Max length: ', 'woocommerce-files-upload').wcuf_format_seconds_to_readable_length($max_seconds_length); 
												  ?>
							</strong>
							<?php endif;  ?>
										
							<!-- Action buttons -->
							<div id="wcuf_file_name_<?php echo $file_fields['id']; ?>" class="wcuf_file_name"></div>
							<div class="wcuf_multiple_files_actions_button_container" id="wcuf_multiple_files_actions_button_container_<?php echo $file_fields['id']; ?>">
								<button class="button wcuf_just_selected_multiple_files_delete_button" id="wcuf_just_selected_multiple_files_delete_button_<?php echo $file_fields['id']; ?>" data-id="<?php echo $file_fields['id']; ?>"><?php  echo $button_texts['delete_file_button']; ?></button>
								<button id="wcuf_upload_multiple_files_mirror_button_<?php echo $file_fields['id']; ?>" class="button wcuf_upload_multiple_files_mirror_button <?php echo $additional_button_class;?>" data-id="<?php echo $file_fields['id']; ?>"><?php echo $button_texts['upload_selected_files_button']; ?></button>
							</div>
							<div class="wcuf_delete_metadata" id="wcuf_delete_metadata_<?php echo $file_fields['id'];?>" data-container-unique-id="<?php echo $container_unique_id; ?>" data-cart-item-id="<?php echo $cart_item_id; ?>"></div>
							<div id="wcuf_delete_button_box_<?php echo $file_fields['id']; ?>"></div>
			      <?php 
					endif;
					if($upload_has_been_performed): //not uplaoded data -> &upload_has_been_performed  $item_in_cart_temp  
				  ?>
						<div class="wcuf_already_uploaded_data_container"><?php 
						
							if(!isset($file_fields['message_already_uploaded']))
							{
								
							}
							else
								{
									$already_uploaded_message = $file_fields['message_already_uploaded'];
									//shortcode: [file_name]
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name]', $already_uploaded_message, $file_fields, $item_in_cart_temp, null);
									//shortcode: [file_name_no_cost]
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name_no_cost]',$already_uploaded_message, $file_fields, $item_in_cart_temp, null, false, 0 , false);
									//shortcode: [file_name_with_image_preview] 
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name_with_image_preview]',$already_uploaded_message, $file_fields, $item_in_cart_temp,null,true); //old
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name_with_media_preview]',$already_uploaded_message, $file_fields, $item_in_cart_temp,null,true);
									//shortcode: [file_name_with_image_preview_no_cost] 
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name_with_image_preview_no_cost]',$already_uploaded_message, $file_fields, $item_in_cart_temp, null, true, 0, false); //old
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name_with_media_preview_no_cost]',$already_uploaded_message, $file_fields, $item_in_cart_temp, null, true, 0, false);
									//shortcode: [image_preview_list] 
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[image_preview_list]',$already_uploaded_message, $file_fields, $item_in_cart_temp, null, true, 0, false, false);
									//shortcode: [uploaded_files_num]
									$already_uploaded_message = $wcuf_shortcodes->uploaded_files_num($already_uploaded_message, $file_fields, $item_in_cart_temp);
									//shortcode: [pdf_total_pag_num]
									$already_uploaded_message = $wcuf_shortcodes->pdf_total_pag_num($already_uploaded_message, $file_fields, $item_in_cart_temp);
									//shortcode: [additional_costs]
									$already_uploaded_message = $wcuf_shortcodes->additional_costs($already_uploaded_message, $file_fields_groups, $item_in_cart_temp,$file_fields,null);
									
									$num_total_uploaded_files += count($item_in_cart_temp["quantity"]); //each quantity element contains the selected quantity for each file
									$total_costs += $wcuf_shortcodes->total_costs();
									
									
									echo do_shortcode( $already_uploaded_message);
								}
							?></div>
					 <?php if(true):?>
							<button class="button delete_button wcuf_delete_button" data-id="wcufuploadedfile_<?php echo $file_fields['id'];?>"><?php  echo $button_texts['delete_file_button']; ?></button>
					<?php endif; ?>	
			<?php endif; ?>
				</div> <!-- end of wcuf_to_hide_when_performing_data_transimssion -->
			</div> <!-- end of wcuf_upload_fields_row_element -->
			
			<?php  else:  //Disable stacking: Upload per product & variant -> if defined on line 327 -> !$disable_stacking && !$enable_upload_per_file ?>
				
				<?php foreach($products_for_which_stacking_is_disabled as $product): ?>
			<div class="wcuf_upload_fields_row_element">
				<?php	
						$product_id = $product["product_id"];
						$product_name = $wcuf_product_model->get_my_name($product_id );
						$product_name_backend = $product_name;
						$product_name = $current_page != 'product' ? $product_name  : "";
						$product_var_id = $product["variation_id"] == "" ? false:$product["variation_id"];
						$product_variation = null;
						$product['force_disable_stacking_for_variation'] = isset($product['force_disable_stacking_for_variation']) && $product['force_disable_stacking_for_variation'] ? $product['force_disable_stacking_for_variation'] : false;
						$show_upload_field_for_each_variation = false;
						if($product_var_id != false)
						{
							$product_name = $product_name_backend =  $wcuf_product_model->get_variation_parent_name($product_var_id); //$variation->parent->post->post_title;
						}
						if($product_var_id && ($disable_stacking_for_variation || $product['force_disable_stacking_for_variation']))	
						{
							$show_upload_field_for_each_variation = true;
							$_product = wc_get_product( $product_var_id );
							$_item = apply_filters( 'woocommerce_get_product_from_item', $_product, $product, null );
							
							$product_in_order = $_item ; 
							
							$variation = $_product;
							$product_id .= "-".$product_var_id;
							if($display_product_fullname)
							{
								$product_name = $current_page != 'product' ? $variation->get_title()." - ": "";	
							}
							$product_name_backend = $variation->get_title()." - ";
							$attributes_counter = 0;
							foreach($variation->get_attributes( ) as $attribute_name => $value)
							{
								
								$product_name .=  $attributes_counter > 0  && $display_product_fullname ? ", " : "";
								$product_name_backend .=  $attributes_counter > 0 ? ", " : "";
								
								$meta_key = urldecode( str_replace( 'attribute_', '', $attribute_name ) ); 
								if(isset($product['variation']) && !empty($product['variation']))
									foreach($product['variation'] as $attribute_name => $attribute_value)
										if($attribute_name == "attribute_".$meta_key)
												$value = urldecode($attribute_value);
								
								if($display_product_fullname)
									$product_name .= " ".wc_attribute_label( $meta_key, $product_in_order ).": ".$value;
								$product_name_backend .= " ".wc_attribute_label( $meta_key, $product_in_order ).": ".$value;
								$attributes_counter++;
							} 
							$wc_price_calculator_is_active = $wcuf_product_model->wc_price_calculator_is_active_on_product( $variation );
						}
						else
						{
							$_product = wc_get_product( $product_id );
							$attributes = $_product->get_attributes( );
							$product_name = $current_page != 'product' ? $_product->get_title() : "";
							$product_in_order = apply_filters( 'woocommerce_get_product_from_item', $_product, $product, null );
							$product_name .= !empty($attributes) && $display_simple_product_name_with_attributes ? " - " : "";
							$attributes_counter = 0;	
							foreach($attributes as $attribute)
							{
								$product_name .= $attributes_counter > 0  && $display_simple_product_name_with_attributes ? ", " : "";
								$product_name_backend .=  $attributes_counter > 0 ? ", " : "";
								$meta_key = urldecode( str_replace( 'attribute_', '', $attribute->get_name() ) ); 
								if($display_simple_product_name_with_attributes)
									$product_name .= " ".wc_attribute_label( $meta_key, $product_in_order ).": ".$_product->get_attribute($attribute->get_name() );
									
								$product_name_backend .= " ".wc_attribute_label( $meta_key, $product_in_order ).": ".$_product->get_attribute($attribute->get_name() );
								
								$attributes_counter++;
							}
							
							
							$wc_price_calculator_is_active = $wcuf_product_model->wc_price_calculator_is_active_on_product( $_product );
						}
						
						 $upload_field_unique_name = $file_fields['title'].' ('.$product_name_backend.')';
						 $file_field_title = $file_fields['title'];
						 
						//Wc price calclator managment (if active)
						$unique_product_name_hash = $addtional_id_on_title = "";
						if($wc_price_calculator_is_active && ($disable_stacking_for_variation || $product['force_disable_stacking_for_variation']))
						{
							$measures_string = $wcuf_product_model->wc_price_calulator_get_cart_item_name($product);
							$product_name_backend .= $measures_string;
							$product_name .= $measures_string ;							
							$upload_field_unique_name = $file_fields['title'].' ('.$product_name_backend.')';
							$product_id .= !$disable_stacking_for_variation || !$product_var_id || $product_var_id == "" ? "-0"."-idsai".$product[WCUF_Cart::$sold_as_individual_item_cart_key_name] : "-idsai".$product[WCUF_Cart::$sold_as_individual_item_cart_key_name];
							
						}
						//individual product managment
						else if($wcuf_product_model->sold_as_individual_product($product["product_id"], $product["variation_id"]) && 
								$product[WCUF_Cart::$sold_as_individual_item_cart_key_name] != 0) 
						{	
							$product_id .= !$disable_stacking_for_variation || !$product_var_id || $product_var_id == "" ? "-0"."-idsai".$product[WCUF_Cart::$sold_as_individual_item_cart_key_name] : "-idsai".$product[WCUF_Cart::$sold_as_individual_item_cart_key_name];
							$addtional_id_on_title =  " ".$button_texts['cart_individual_item_identifier'].$product[WCUF_Cart::$sold_as_individual_item_cart_key_name];
							$product_name .= $addtional_id_on_title;
							$upload_field_unique_name = $file_fields['title'].' ('.$product_name_backend.$addtional_id_on_title.') ';
						}
						
						//Multiple file upload managment
						$upload_field_id = "wcufuploadedfile_".$file_fields['id']."-".$product_id;
						/* if($delete_previous_uploaded_file_in_session)
							 $wcuf_session_model->remove_item_data($upload_field_id); */
						$num_of_uploaded_files = $wcuf_upload_field_model->get_num_uploaded_files_in_session($upload_field_id, $all_options['max_uploaded_files_number_considered_as_sum_of_quantities']);
						
						$item_in_cart_temp =  $wcuf_session_model->get_item_data($upload_field_id);
						$upload_has_been_performed = false;
						
						if(isset($item_in_cart_temp))
						{
							$item_in_cart_temp['is_order_field'] = false;
							$upload_has_been_performed = isset($item_in_cart_temp) ? true : false;
						}
						$multiple_uploads_max_files = $upload_has_been_performed ? 0 : 1;
						$multiple_uploads_min_files = 1;
						$unlimited_uploads = !$multiple_uploads_max_files_depends_on_quantity && $file_fields['multiple_uploads_max_files'] == 0 ? true : false;
						$feedback_can_be_peformed = $upload_has_been_performed ? false : true;
						
						//Min/max uploadable files
						if($enable_multiple_uploads_per_field)
						{
							$multiple_uploads_max_files = $multiple_uploads_max_files_depends_on_quantity ? $product['quantity'] : $file_fields['multiple_uploads_max_files'];
							$multiple_uploads_min_files = $multiple_uploads_min_files_depends_on_quantity ? $product['quantity'] : $multiple_uploads_minimum_required_files;
							
							//Incremental upload
							if($required_on_checkout)
								$multiple_uploads_min_files = $multiple_uploads_min_files == 0 ? 1 : $multiple_uploads_min_files;
							$multiple_uploads_max_files  =  $multiple_uploads_max_files != 0 && $multiple_uploads_max_files - $num_of_uploaded_files >= 0 ? $multiple_uploads_max_files - $num_of_uploaded_files : 0;
							$multiple_uploads_min_files = $num_of_uploaded_files > $multiple_uploads_min_files ? 0 : $multiple_uploads_min_files - $num_of_uploaded_files;
						
							
							$feedback_can_be_peformed = $unlimited_uploads || $multiple_uploads_max_files > 0 ? true : false;
							
						}	
						
						//Sanatize 
						$file_fields['title'] = str_replace($bad_chars, "",$file_fields['title']);
						$product_name = str_replace($bad_chars, "",$product_name);
						$upload_field_unique_name = str_replace($bad_chars, "",$upload_field_unique_name);
						
				  ?>
					 <!-- Upload field title -->
					 <div class="wcuf-title-container">
					  <<?php echo $all_options['upload_field_title_style']; ?> style="margin-bottom:5px;  margin-top:15px;" class="wcuf_upload_field_title <?php if($required_on_checkout /* && $current_page == 'checkout' */) echo 'wcuf_required_label'; ?>"><?php  echo $file_field_title; ?></<?php echo $all_options['upload_field_title_style']; ?>>
					  <?php if(!empty($product_name) && $current_page != 'product') echo '<'.$all_options['product_title_style'].' class="wcuf_product_title_under_upload_field_name">'.$product_name.'</'.$all_options['product_title_style'].'>'; ?>
					 </div> 
					  <!-- Progess bar UI -->
						<div class="wcuf_upload_status_box" id="wcuf_upload_status_box_<?php echo $file_fields['id']."-".$product_id; ?>">
							<div class="wcuf_multiple_file_progress_container" id="wcuf_multiple_file_progress_container_<?php echo $file_fields['id']."-".$product_id; ?>">
								<span class="wcuf_total_files_progress_bar_title"><?php esc_html_e('Total: ', 'woocommerce-files-upload'); ?></span>
								<div class="wcuf_bar" id="wcuf_multiple_file_bar_<?php echo $file_fields['id']."-".$product_id; ?>"></div>
								<div id="wcuf_multiple_file_upload_percent_<?php echo $file_fields['id']."-".$product_id; ?>"></div>
								<span class="wcuf_current_file_progress_bar_title" ><?php esc_html_e('Current: ', 'woocommerce-files-upload'); ?></span>
							</div>
							<div class="wcuf_bar" id="wcuf_bar_<?php echo $file_fields['id']."-".$product_id; ?>"></div >
							<div class="wcuf_percent" id="wcuf_percent_<?php echo $file_fields['id']."-".$product_id; ?>">0%</div>
							<div class="wcuf_status" id="wcuf_status_<?php echo $file_fields['id']."-".$product_id; ?>"></div>
							<button class="button wcuf_abort_upload" id="wcuf_abort_upload_<?php echo $file_fields['id']."-".$product_id; ?>" data-id="<?php echo $file_fields['id']."-".$product_id; ?>" data-container-unique-id="<?php echo $container_unique_id; ?>" data-cart-item-id="<?php echo $cart_item_id; ?>" ><?php esc_html_e('Cancel', 'woocommerce-files-upload'); ?></button>
						</div>
						<div class="wcuf_to_hide_when_performing_data_transimssion">	
					  <!-- Upload field rendering -->
					  <?php if(!$hide_upload_after_upload || ($hide_upload_after_upload && !$upload_has_been_performed)):?>
							<p class="wcuf_field_description"><?php echo do_shortcode($file_fields['description']); ?></p>
						<?php endif; ?>
						<?php if($display_text_field): ?>
							<?php if($text_field_label != ""):?>
								<h5><?php echo $text_field_label; ?></h5>
							<?php endif; ?>
							<?php if ($text_field_description != ""): ?>
								<div class="wpuef_text_field_description"><?php echo $text_field_description; ?></div>
							<?php endif; ?>
							<textarea class="wcuf_feedback_textarea" data-id="<?php echo $file_fields['id']."-".$product_id; ?>" id="wcuf_feedback_textarea_<?php echo $file_fields['id']."-".$product_id; ?>" name="wcuf[<?php echo $file_fields['id']."-".$product_id; ?>][user_feedback]" <?php if($is_text_field_required) echo 'required="required"'; if( !$feedback_can_be_peformed) echo "disabled";?> <?php if($text_field_max_input_chars != 0) echo 'maxlength="'.$text_field_max_input_chars.'"';?>><?php if(isset($item_in_cart_temp) ) echo $item_in_cart_temp['user_feedback'];?></textarea>
						<?php do_action('wcuf_after_feedback_area', $file_fields['id']."-".$product_id, $file_fields, $product_id, $item_in_cart_temp);  
						endif;?>
						<?php 
							 
							  if(   ($enable_multiple_uploads_per_field && ($unlimited_uploads || $multiple_uploads_max_files > 0)) || !$upload_has_been_performed): 
								
								 ?>
									<input type="hidden" name="wcuf[<?php echo $file_fields['id']."-".$product_id; ?>][title]" value="<?php echo $upload_field_unique_name; ?>"></input>
									<input type="hidden" name="wcuf[<?php echo $file_fields['id']."-".$product_id; ?>][id]" value="<?php echo $file_fields['id']."-".$product_id; ?>"></input>
									<input type="hidden" id="wcuf-filename-<?php echo $file_fields['id']."-".$product_id; ?>" name="wcuf[<?php echo $file_fields['id']."-".$product_id; ?>][file_name]" value=""></input>
									<div class="wcuf_upload_button_container">
										<?php if($display_disclaimer_checkbox): ?>
											<label class="wcuf_disclaimer_label"><input type="checkbox" class="wcuf_disclaimer_checkbox" id="wcuf_disclaimer_checkbox_<?php echo $file_fields['id']."-".$product_id; ?>"></input><span class="wcuf_discaimer_text"><?php echo $disclaimer_text;?></span></label>
										<?php endif; ?>
										<?php if($all_options['drag_and_drop_disable']):?>
											<button id="wcuf_upload_field_button_<?php echo $file_fields['id']."-".$product_id; ?>"  style="margin-right:<?php echo $style_options['css_distance_between_upload_buttons']; ?>px;" class="button wcuf_upload_field_button <?php echo $additional_button_class;?>" data-id="<?php echo $file_fields['id']."-".$product_id; ?>"><?php if(!$enable_multiple_uploads_per_field) echo $button_texts['drag_and_drop_area_single_file_instruction']; else echo $button_texts['drag_and_drop_area_instruction']; ?></button>
										<?php else: ?>
											<div id="wcuf_upload_field_button_<?php echo $file_fields['id']."-".$product_id; ?>" class="wcuf_upload_field_button wcuf_upload_drag_and_drop_area" data-id="<?php echo $file_fields['id']."-".$product_id; ?>">
												<svg class="wcuf_drag_and_drop_area_icon" xmlns="http://www.w3.org/2000/svg" width="50" height="43" viewBox="0 0 50 43"><path d="M48.4 26.5c-.9 0-1.7.7-1.7 1.7v11.6h-43.3v-11.6c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v13.2c0 .9.7 1.7 1.7 1.7h46.7c.9 0 1.7-.7 1.7-1.7v-13.2c0-1-.7-1.7-1.7-1.7zm-24.5 6.1c.3.3.8.5 1.2.5.4 0 .9-.2 1.2-.5l10-11.6c.7-.7.7-1.7 0-2.4s-1.7-.7-2.4 0l-7.1 8.3v-25.3c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v25.3l-7.1-8.3c-.7-.7-1.7-.7-2.4 0s-.7 1.7 0 2.4l10 11.6z"/></svg>
												<span class="wcuf_drag_and_drop_area_description"><?php echo !$enable_multiple_uploads_per_field ? $button_texts['drag_and_drop_area_single_file_instruction'] : $button_texts['drag_and_drop_area_instruction']; ?></span>
											</div>
										<?php endif; ?>
										<button id="wcuf_upload_multiple_files_button_<?php echo $file_fields['id']."-".$product_id; ?>" class="button wcuf_upload_multiple_files_button <?php echo $additional_button_class;?>" data-id="<?php echo $file_fields['id']."-".$product_id; ?>"><?php echo $button_texts['upload_selected_files_button']; ?></button>
										<input type="file"  data-title="<?php echo $upload_field_unique_name; ?>" 
															id="wcuf_upload_field_<?php echo $file_fields['id']."-".$product_id; ?>" 
															data-disclaimer="<?php echo $display_disclaimer_checkbox;?>" 
															data-id="<?php echo $file_fields['id']."-".$product_id; ?>" 
															data-required="<?php if($required_on_checkout) echo 'true'; else echo 'false' ?>" 
															data-min-files="<?php echo $multiple_uploads_min_files ?>" 
															data-max-files="<?php echo $multiple_uploads_max_files; ?>" 
															data-dimensions-logical-operator="<?php echo $dimensions_logical_operator; ?>" 
															data-max-width="<?php echo $max_width; ?>" 
															data-max-height="<?php echo $max_height; ?>" 															
															data-min-height="<?php echo $min_height_limit; ?>" 
															data-min-width="<?php echo $min_width_limit; ?>" 
															data-min-dpi="<?php echo $min_dpi_limit; ?>" 
															data-max-dpi="<?php echo $max_dpi_limit; ?>"
															data-ratio-x="<?php echo $ratio_x; ?>" 
															data-ratio-y="<?php echo $ratio_y; ?>"
															data-min-length="<?php echo $min_seconds_length; ?>" 
															data-max-length="<?php echo $max_seconds_length; ?>" 
															data-length-already-uploaded="<?php echo $wcuf_media_model->get_sum_of_media_length($item_in_cart_temp); ?>" 
															data-consider-sum-length="<?php echo $consider_sum_of_media_seconds; ?>" 
															data-images-preview-disabled= "<?php echo $preview_images_before_upload_disabled ? 'true' : 'false';?>" 
															data-detect-pdf = "<?php echo $file_fields['extra_cost_detect_pdf'] ? 'true' : 'false';?>" 
															data-disable-quantity-selector = "<?php echo $disable_quantity_selector ? 'true' : 'false';?>" 
															data-toggle-autoupload = "<?php echo $toggle_autoupload ? 'true' : 'false';?>" 
															data-enable-crop-editor="<?php echo $enable_crop_editor; ?>" 
															data-crop-mandatory-for-multiple-uploads="<?php echo $crop_mandatory_for_multiple_files_upload; ?>" 
															data-crop-area-shape="<?php echo $crop_area_type; ?>" 
															data-cropped-width="<?php echo $cropped_image_width; ?>" 
															data-cropped-height="<?php echo $cropped_image_height; ?>"  
															data-cropper-autoadjust="<?php echo $crop_auto_adjust; ?>" 
															data-cropper-disable-aspect-ration-for-free-resize="<?php echo $crop_disable_aspect_ratio_for_free_resize; ?>" 
															data-cropper-enable-ratio="<?php echo $crop_use_ratio; ?>"
															data-cropper-compress-image="<?php echo $crop_compress_image ? "true" : "false"; ?>" 
															data-cropper-compression-quality="<?php echo $crop_compression_quality; ?>" 															
															data-cropper-image-fit-canvas="<?php echo $crop_image_fit_canvas ? 'true' : 'false'; ?>" 
															data-cropper-allow-resize="<?php echo wcuf_get_value_if_set($file_fields, 'crop_allow_resize', "false") ? 'true' : 'false'; ?>" 	
															data-multiple-files-max-sum-size="<?php echo $multiple_files_max_size_sum; ?>"
															data-multiple-files-min-sum-size="<?php echo $multiple_files_min_size_sum; ?>"
															data-is-multiple-files="<?php if($enable_multiple_uploads_per_field) echo 'true'; else echo 'false'; ?>" 
															class="cropit-image-input wcuf_file_input <?php if($enable_multiple_uploads_per_field) echo 'wcuf_file_input_multiple'; ?>" <?php if($enable_multiple_uploads_per_field)  echo 'multiple="multiple"'; ?> 
															name="wcufuploadedfile_<?php echo $file_fields['id']."-".$product_id; ?>" <?php if($file_fields['types'] != '') echo 'accept="'.$file_fields['types'].'"';?> 
															data-min-size="<?php echo $min_size; ?>"
															data-size="<?php echo $file_fields['size']*1048576; ?>" value="<?php echo $file_fields['size']*1048576; ?>" 
															data-container-unique-id="<?php echo $container_unique_id; ?>"
															data-cart-item-id="<?php echo $cart_item_id; ?>"
															></input>
									<?php if(!$hide_extra_info): ?>			
									<strong class="wcuf_max_size_notice" id="wcuf_max_size_notice_<?php echo $file_fields['id']."-".$product_id; ?>" >
													<?php if($min_size !=0) echo sprintf(esc_html__('Min size: %s MB', 'woocommerce-files-upload'), $min_size/1048576)."<br/>"; 
														  if($file_fields['size'] !=0) echo sprintf(esc_html__('Max size: %s MB', 'woocommerce-files-upload'),$file_fields['size'])."<br/>"; 
														  if($enable_multiple_uploads_per_field && $multiple_uploads_min_files ) echo esc_html__('Min files: ', 'woocommerce-files-upload').$multiple_uploads_min_files."<br/>"; 
														  if($enable_multiple_uploads_per_field && $multiple_uploads_max_files && !$unlimited_uploads) echo esc_html__('Max files: ', 'woocommerce-files-upload').$multiple_uploads_max_files."<br/>"; 
														  if($min_width_limit) echo esc_html__('Min width: ', 'woocommerce-files-upload').$min_width_limit."px"."<br/>"; 
														  if($max_width) echo esc_html__('Max width: ', 'woocommerce-files-upload').$max_width."px"."<br/>"; 
														  if($min_height_limit) echo esc_html__('Min height: ', 'woocommerce-files-upload').$min_height_limit."px"."<br/>"; 
														  if($max_height) echo esc_html__('Max height: ', 'woocommerce-files-upload').$max_height."px"."<br/>"; 
														  if($min_dpi_limit) echo esc_html__('Min DPI: ', 'woocommerce-files-upload').$min_dpi_limit."px"."<br/>";   
														  if($max_dpi_limit) echo esc_html__('Max DPI: ', 'woocommerce-files-upload').$max_dpi_limit."px"."<br/>"; 
														  if($ratio_x && $ratio_y) echo esc_html__('Ratio: ', 'woocommerce-files-upload').$ratio_x.":".$ratio_y."<br/>"; 
														  if($min_seconds_length) echo esc_html__('Min length: ', 'woocommerce-files-upload').wcuf_format_seconds_to_readable_length($min_seconds_length)."<br/>"; 
														  if($max_seconds_length) echo esc_html__('Max length: ', 'woocommerce-files-upload').wcuf_format_seconds_to_readable_length($max_seconds_length); 
												  ?>
									</strong>
									
									<?php endif; ?>
										
									</div>
									<!-- Action buttons -->
									<div id="wcuf_file_name_<?php echo $file_fields['id']."-".$product_id; ?>" class="wcuf_file_name"></div>
									<div class="wcuf_multiple_files_actions_button_container" id="wcuf_multiple_files_actions_button_container_<?php echo $file_fields['id']."-".$product_id ?>">
										<button class="button wcuf_just_selected_multiple_files_delete_button" id="wcuf_just_selected_multiple_files_delete_button_<?php echo $file_fields['id']."-".$product_id; ?>" data-id="<?php echo $file_fields['id']."-".$product_id; ?>"><?php  echo $button_texts['delete_file_button']; ?></button>
										<button id="wcuf_upload_multiple_files_mirror_button_<?php echo $file_fields['id']."-".$product_id; ?>" class="button wcuf_upload_multiple_files_mirror_button <?php echo $additional_button_class;?>" data-id="<?php echo $file_fields['id']."-".$product_id;; ?>"><?php echo $button_texts['upload_selected_files_button']; ?></button>
									</div>
									<div class="wcuf_delete_metadata" id="wcuf_delete_metadata_<?php echo $file_fields['id']."-".$product_id;?>" data-container-unique-id="<?php echo $container_unique_id; ?>"></div>
									<div id="wcuf_delete_button_box_<?php echo $file_fields['id']."-".$product_id; ?>"></div>
						<?php
							//else:
							endif;
							if($upload_has_been_performed): //not uplaoded data -> $upload_has_been_performed      $item_in_cart_temp ?>
								<div class="wcuf_already_uploaded_data_container"><?php 
								
								if(!isset($file_fields['message_already_uploaded'])){
									
								}
								else
								{
									$already_uploaded_message = $file_fields['message_already_uploaded'];
									//shortcode: [file_name]
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name]', $already_uploaded_message, $file_fields, $item_in_cart_temp, $product);
									//shortcode: [file_name_no_cost]
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name_no_cost]',$already_uploaded_message, $file_fields, $item_in_cart_temp, $product, false, 0 , false);
									//shortcode: [file_name_with_image_preview] 
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name_with_image_preview]',$already_uploaded_message, $file_fields, $item_in_cart_temp, $product,true);//old
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name_with_media_preview]',$already_uploaded_message, $file_fields, $item_in_cart_temp, $product,true);
									//shortcode: [file_name_with_image_preview_no_cost] 
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name_with_media_preview_no_cost]',$already_uploaded_message, $file_fields, $item_in_cart_temp, $product, true, 0, false);
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name_with_image_preview_no_cost]',$already_uploaded_message, $file_fields, $item_in_cart_temp, $product, true, 0, false);//ol
									//shortcode: [image_preview_list] 
									$already_uploaded_message = $wcuf_shortcodes->get_file_names_with_additional_info('[image_preview_list]',$already_uploaded_message, $file_fields, $item_in_cart_temp, $product, true, 0, false, false);
									//shortcode: [uploaded_files_num]
									$already_uploaded_message = $wcuf_shortcodes->uploaded_files_num($already_uploaded_message, $file_fields, $item_in_cart_temp);
									//shortcode: [pdf_total_pag_num]
									$already_uploaded_message = $wcuf_shortcodes->pdf_total_pag_num($already_uploaded_message, $file_fields, $item_in_cart_temp);
									//shortcode: [additional_costs]
									$already_uploaded_message = $wcuf_shortcodes->additional_costs($already_uploaded_message, $file_fields_groups, $item_in_cart_temp,$file_fields,$product);
									
									$num_total_uploaded_files += count($item_in_cart_temp["quantity"]); //each quantity element contains the selected quantity for each file
									$total_costs += $wcuf_shortcodes->total_costs();
									
									echo do_shortcode( $already_uploaded_message);
									
								}
								?></div>
							 <?php if(true/* $file_fields['user_can_delete'] */):?>
									<div class="wcuf_delete_metadata" id="wcuf_delete_metadata_<?php echo $file_fields['id']."-".$product_id;?>" data-container-unique-id="<?php echo $container_unique_id; ?>" data-cart-item-id="<?php echo $cart_item_id; ?>"></div>
									<button class="button delete_button wcuf_delete_button" data-id="wcufuploadedfile_<?php echo $file_fields['id']."-".$product_id;?>"><?php  echo $button_texts['delete_file_button']; ?></button>
							<?php endif; ?>
			<?php endif; ?>
				 </div> <!-- end wcuf_to_hide_when_performing_data_transimssion -->
			</div> <!-- end wcuf_upload_fields_row_element -->
				<?php endforeach; //---> $products_for_which_stacking_is_disabled as $product  	?>
			<?php endif;//disable stacking ?>
		</div> <!--end of wcuf_single_upload_field_container-->
			<?php endif;//can render
		}
	endforeach; //upload field 
	
	//Totals area
	if($current_page == 'product' && $all_options['display_totals_in_product_page'] && $num_total_uploaded_files > 0): ?>
	<div class="wcuf_totals_container">
	<<?php echo $all_options['upload_field_title_style']; ?> class="wcuf_totals_area_title"><?php echo $button_texts['totals_area_title'] ?></<?php echo $all_options['upload_field_title_style']; ?>>
	<?php
		if(in_array('num_files',$all_options['totals_info_to_display'])) //num_files, costs
			echo "<div class='wcuf_total_single_line_container'><span class='wcuf_extra_costs_label'>".$button_texts['totals_num_files_label']."</span> <span class='wcuf_extra_costs_value'>".$num_total_uploaded_files."</span></div>";
		if(in_array('costs',$all_options['totals_info_to_display'])) 
			echo "<div class='wcuf_total_single_line_container'><span class='wcuf_extra_costs_label'>".$button_texts['totals_extra_costs_label']."</span> <span class='wcuf_extra_costs_value'>".wc_price($total_costs)."</span></div>";
	?>
	</div>
	<?php endif; ?>
</div> <!-- end of wcuf_file_uploads_container -->
<?php 
//Summary data

if($is_cart_item_table)
	return;
$summary_box_data = array();
$all_uploaded_data = $wcuf_session_model->get_item_data();
$num_total_uploaded_files = 0; //Used for cart and checkout page
$total_costs = $wcuf_shortcodes->total_costs(); //Used for cart and checkout page
if($display_summary_box != 'no' && isset($all_uploaded_data))
{
	global $wcuf_file_model;
	foreach($all_uploaded_data as $completed_upload)
	{
		/* Product uploads */
		$ids = $wcuf_file_model->get_product_ids_and_field_id_by_file_id($completed_upload_id);	
		if($ids["product_id"] && !$wcuf_cart_model->item_is_in_cart($ids))
			continue;
		
		if(!isset( $summary_box_data[$completed_upload['title']]))
			$summary_box_data[$completed_upload['title']] = array();
		
		$num_total_uploaded_files += count($completed_upload["quantity"]);
		$show_file_name = in_array('file_name', $summary_box_info_to_display);
		$show_preview_image = in_array('preview_image', $summary_box_info_to_display);
		$summary_box_data[$completed_upload['title']] = $wcuf_shortcodes->get_file_names_with_additional_info('[file_name_with_image_preview]', '[file_name_with_image_preview]', $file_fields, $completed_upload, null, $show_preview_image, 0, false, $show_file_name, false, $summary_box_info_to_display);
	}
}
if(!empty($summary_box_data) && in_array($current_page, $display_summary_box)): ?>
	<div id="wcuf_summary_uploaded_files">
		<h2><?php esc_html_e('Uploads Summary', 'woocommerce-files-upload');?></h2>
		<?php foreach($summary_box_data as $title => $file_list): ?>
			<div class="wcuf_summary_file_list_block">
				<h4 class="wcuf_upload_field_title wcuf_summary_uploaded_files_title"><?php echo $title; ?></h4>
				<?php echo $file_list; ?>
			</div>
		<?php endforeach; ?>
		
		<?php //Totals area
		if($all_options['display_totals_in_summary_boxes']): ?>
			<h3 class="wcuf_upload_field_title wcuf_summary_uploaded_files_title wcuf_summary_box_totals_area_title"><?php echo $button_texts['totals_area_title'] ?></h3>
			<div class="wcuf_summany_box_totals_container">
			<?php
				if(in_array('num_files',$all_options['totals_info_to_display'])) //num_files, costs
					echo "<div class='wcuf_total_single_line_container'><span class='wcuf_extra_costs_label'>".$button_texts['totals_num_files_label']."</span> <span class='wcuf_extra_costs_value'>".$num_total_uploaded_files."</span></div>";
				if(in_array('costs',$all_options['totals_info_to_display'])) 
					echo "<div class='wcuf_total_single_line_container'><span class='wcuf_extra_costs_label'>".$button_texts['totals_extra_costs_label']."</span> <span class='wcuf_extra_costs_value'>".wc_price($total_costs)."</span></div>";
			?>
			</div>
		<?php endif; ?>
	</div>
<?php endif; 
//End //Summary data ?>