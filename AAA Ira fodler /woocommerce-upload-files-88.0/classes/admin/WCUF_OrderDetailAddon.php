<?php 
use Automattic\WooCommerce\Utilities\OrderUtil;
use Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController;

class WCUF_OrderDetailAddon
{
	var $current_order;
	var $email_sender;
	var $uploaded_files_metadata = array();
	public function __construct()
	{
		add_action( 'add_meta_boxes', array( &$this, 'woocommerce_metaboxes' ) );
		add_action( 'woocommerce_process_shop_order_meta', array( &$this, 'woocommerce_process_shop_ordermeta' ), 5, 2 );
		add_action( 'woocommerce_after_order_itemmeta', array( &$this, 'display_order_item_meta' ), 10, 3 );
		add_filter( 'woocommerce_hidden_order_itemmeta', array( &$this, 'hide_private_metakeys' )); 
		
	}
	
	function display_order_item_meta($item_id, $item, $_product )
	{
		if (get_class($item) != "WC_Order_Item_Product")
			return; 
		
		global $wcuf_order_model, $post, $order, $wcuf_media_model, $wcuf_upload_field_model, $wcuf_file_model, $wcuf_option_model, $wcuf_product_model, $woocommerce, $theorder;		
		$item_individual_id = $wcuf_order_model->read_order_item_meta($item, "_".WCUF_Cart::$sold_as_individual_item_cart_key_name);
		
		if($item_individual_id)
			echo '<span class="wcuf-individual-id-text"><strong>'.esc_html__('Individual ID:', 'woocommerce-files-upload').'</strong> '.$item_individual_id.'</span>';
		
		$order = $item->get_order();
		//Product upload preview
		if(isset($_product))
		{
			$order_id = $order->get_id();		
			$uploaded_files_metadata = wcuf_get_value_if_set($this->uploaded_files_metadata, $order_id, false) != false ? $this->uploaded_files_metadata[$order_id] : $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);
			$this->uploaded_files_metadata[$order_id] = $uploaded_files_metadata;
			
			//Compute which files are images and which not
			$current_product_uploads = $product_specific_uploads  = array();
			foreach($uploaded_files_metadata as $upload_field_id => $file_meta)
			{
				$product_id = $item->get_product_id();
				$variation_id = $item->get_variation_id();
				$unique_id = $wcuf_order_model->read_order_item_meta($item,"_".WCUF_Cart::$sold_as_individual_item_cart_key_name);
				$item_id_data = array('product_id' => $product_id , 'variant_id'=> $variation_id , 'unique_product_id'=> $unique_id  );
				
				$ids = $wcuf_file_model->get_product_ids_and_field_id_by_file_id("order_".$upload_field_id);		
				$is_the_uploaded_assocaited_to_the_product = $wcuf_product_model->is_the_same_product($item_id_data, $ids);
				
				if($is_the_uploaded_assocaited_to_the_product)
				{
					$current_product_uploads[$upload_field_id] = $file_meta;
					$product_specific_uploads[$upload_field_id] = $upload_field_id;
				}
					
			}
			$disable_image_preview = $wcuf_option_model->disable_admin_order_page_items_table_image_preview();
			
			if(file_exists ( get_theme_file_path()."/wcuf/admin_order_details_product_uploads_preview.php" ))
				include get_theme_file_path()."/wcuf/admin_order_details_product_uploads_preview.php";
			else
				include WCUF_PLUGIN_ABS_PATH.'/template/admin_order_details_product_uploads_preview.php';
		}
	}
	public function hide_private_metakeys($keys)
	{
		$keys[] = "_".WCUF_Cart::$sold_as_individual_item_cart_key_name;
		$keys[] = WCUF_Cart::$sold_as_individual_item_cart_key_name;
		$keys[] = "_force_disable_stacking_for_variation"; //Added in the view_order_template.php
		$keys[] = "force_disable_stacking_for_variation";  //Backward compability
		
		return $keys;
	}
	function woocommerce_process_shop_ordermeta( $post_id, $post ) 
	{
		global $wcuf_file_model, $wcuf_option_model, $wcuf_upload_field_model;
		
		$file_order_metadata = wcuf_get_value_if_set($this->uploaded_files_metadata, $post_id, false) != false ? $this->uploaded_files_metadata[$post_id] : $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($post_id); 
		$this->uploaded_files_metadata[$post_id] = $file_order_metadata;
			
			
		//Used when admin save order from order detail page in backend
		if(isset($_POST['files_to_delete']))
		{
			foreach($_POST['files_to_delete'] as $value)
				$file_order_metadata = $wcuf_file_model->delete_file($value, $file_order_metadata, $post_id);
		}
		if(isset($_POST['wcuf_approval']))
		{
			$wcuf_upload_field_model->update_approva_data($_POST['wcuf_approval'], $file_order_metadata, $post_id);
		}
	}
	function woocommerce_metaboxes() 
	{
		$screen = 'shop_order';
		try
		{
			$screen = wc_get_container()->get( CustomOrdersTableController::class )->custom_orders_table_usage_is_enabled()
			? wc_get_page_screen_id( 'shop-order' )
			: 'shop_order';
		}
		catch (Exception $e) {$screen = 'shop_order';}

		add_meta_box( 'woocommerce-files-upload', esc_html__('Uploaded files', 'woocommerce-files-upload'), array( &$this, 'woocommerce_order_uploaded_files_box' ), $screen, 'side', 'high');

	}
	function woocommerce_order_uploaded_files_box($post_or_order_object ) 
	{
		global $wcuf_option_model, $wcuf_upload_field_model, $wcuf_media_model;
		$order = ( $post_or_order_object instanceof WP_Post ) ? wc_get_order( $post_or_order_object->ID ) : $post_or_order_object;
		$order_id = ( $post_or_order_object instanceof WP_Post ) ? $post_or_order_object->ID : $post_or_order_object->get_id();
		$this->current_order = $order;
		
		$file_fields_meta = $wcuf_option_model->get_fields_meta_data();
		$uploaded_files = wcuf_get_value_if_set($this->uploaded_files_metadata, $order_id, false) != false ? $this->uploaded_files_metadata[$order_id] : $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id); 
		$this->uploaded_files_metadata[$order_id] = $uploaded_files;
		$num_of_active_upload_fields = 0;
		$number_of_local_upload_fields = 0;
		$disable_force_download_on_admin_order_page =  $wcuf_option_model->get_all_options('disable_force_download_on_admin_order_page');
		$disable_image_preview = $wcuf_option_model->disable_admin_order_page_uploaded_files_metabox_image_preview();
		
		//css
		wp_enqueue_style( 'wcuf-admin-order-details-page', wcuf_PLUGIN_PATH.'/css/wcuf-admin-order-details-page.css' );
		wp_enqueue_style( 'wcuf-toggle', wcuf_PLUGIN_PATH.'/css/vendor/toggle.css' );
		//js
		wp_register_script( 'wcuf-admin-order-details-page', wcuf_PLUGIN_PATH.'/js/wcuf-admin-order-details-page.js' );
		wp_localize_script( 'wcuf-admin-order-details-page', 'wcuf', array('order_id' => $order_id,
																		   'delete_msg' => esc_html__('Are you sure?', 'woocommerce-files-upload')) );
		wp_enqueue_script( 'wcuf-admin-order-details-page' );
		wp_enqueue_script('wcuf-pdf-2', wcuf_PLUGIN_PATH.'/js/vendor/pdf/pdfThumbnails.js', array('jquery'));
		
		?>
		<div id="upload-box">
		<p><?php wcuf_html_escape_allowing_special_tags(__('Here you find the uploaded files <strong>grouped per upload field</strong>.', 'woocommerce-files-upload')); ?>
		<br/><i><?php wcuf_html_escape_allowing_special_tags(__('Click the order <a href="#woocommerce-order-actions"><strong>Update</strong></a> button after one or more files has been deleted, rejected or approved in order to save changes.', 'woocommerce-files-upload')); ?></i></p>
			<?php if(empty($uploaded_files)): echo '<p><strong>'.esc_html__('Customer hasn\'t uploaded any file...yet.', 'woocommerce-files-upload').'</strong></p>'; 
			else:?>
			<ul class="totals">
			 <?php 
				foreach($uploaded_files as $upload_field_id => $file_meta): 
				//approval management
				$option_id = $file_meta["id"];
				$option_id = explode("-", $option_id);
				$option_id = $option_id[0];
				
				$enable_approval = isset($file_fields_meta[$option_id]) ? wcuf_get_value_if_set($file_fields_meta[$option_id], 'enable_file_approval', 'false') == "true" : false;										    //general settings
				$disable_file_approval_per_single_file = isset($file_fields_meta[$option_id]) ? wcuf_get_value_if_set($file_fields_meta[$option_id], 'disable_file_approval_per_single_file', 'false') == "true" : false;   //general settings
				 									
				$num_of_active_upload_fields = count($file_meta['original_filename']) > 0 ? $num_of_active_upload_fields+1 : $num_of_active_upload_fields;
				$is_zip = $wcuf_upload_field_model->is_upload_field_content_managed_as_zip($file_meta);
				$is_multiple_files = $wcuf_upload_field_model->is_upload_field_content_managed_as_multiple_files($file_meta); 
				$original_name = "";
				$file_meta['url'] = $wcuf_upload_field_model->get_secure_urls($order_id, $upload_field_id, $uploaded_files);
				$approval_area = "";
				
				if($is_zip || $is_multiple_files)
					$original_name = esc_html__('Multiple files', 'woocommerce-files-upload');
				else if(isset($file_meta['original_filename']))
					$original_name = !is_array($file_meta['original_filename']) ? $file_meta['original_filename'] : $file_meta['original_filename'][0];
				
				if($original_name == "")
					continue;
				
				
				?>
				<li style="margin-bottom:40px;">
					<h4 class="wcuf_upload_field_title">
					<input type="hidden" name="wcuf_approval[<?php echo $upload_field_id; ?>][disable_notification]" value="<?php echo wcuf_get_value_if_set($file_fields_meta[$option_id], 'disable_file_approval_notification', "false"); ?>" />
					<?php echo $file_meta['title']." : ".$original_name;?></h4>
					<?php 
						$quantity = 1;
						if(!$is_zip && !$is_multiple_files)
							echo "<span class='wcuf-qty-text'>".esc_html__('Quantity: ', 'woocommerce-files-upload')."<i>".$quantity."</i></br></br></span>";
					
					 
					if($is_zip || $is_multiple_files) //old multiple file managment
					{
						$files_name = "<p><ol>";
						foreach( $file_meta['original_filename'] as $counter => $temp_file_name)
						{
							//approval management
							$status = wcuf_get_value_if_set($file_meta, array('approval', 'status', $counter), 'waiting-for-approval'); 
							$approval_feedback = wcuf_get_value_if_set($file_meta, array('approval', 'feedback', $counter), ""); 
							
							if(isset($file_meta['quantity'][$counter]))
								$quantity = is_array($file_meta['quantity'][$counter]) ? array_sum($file_meta['quantity'][$counter]) : $file_meta['quantity'][$counter];
							
							$delete_icon = '<i data-id="'.$counter.'" data-field-id="'.$upload_field_id.'" class="wcuf_delete_single_file_stored_on_server wcuf_delete_file_icon"></i>';
								
							if($is_zip) //No longer used
							{
								$zip_file_name = basename ($file_meta['absolute_path']);
								if(!$wcuf_upload_field_model->is_dropbox_stored($file_meta))
									$files_name .= '<li><a class="wcuf_link" target="_blank" href="'.get_site_url().'?wcuf_zip_name='.$zip_file_name.'&wcuf_single_file_name='.$temp_file_name.'&wcuf_order_id='.$order_id.'">'.$temp_file_name.'</a> <span class="wcuf-qty-text">('.esc_html__('Quantity: ', 'woocommerce-files-upload').$quantity.')</<span></li>';
								else
									$files_name .= '<li>'.$temp_file_name.' <span class="wcuf-qty-text">('.esc_html__('Quantity: ', 'woocommerce-files-upload').$quantity.')</span></li>';
							}
							else
							{
								if($enable_approval && !$disable_file_approval_per_single_file)
								{
									$approval_area = "<div class='wcuf-approval-area'>";
									$approval_area .= "<div class='wcuf-approval-selector-container'>";
									$approval_area .= "<label class='wcuf-label'>".esc_html__('Approve or reject', 'woocommerce-files-upload')."</label>";
									$approval_area .= "<select name='wcuf_approval[".$upload_field_id."][status][".$counter."]'>";
									$approval_area .= "<option value='waiting-for-approval' ".($status =='waiting-for-approval' ? "selected='selected' ": "" ).">".$wcuf_upload_field_model->get_approval_label_from_status('waiting-for-approval')."</option>";
									$approval_area .= "<option value='rejected' ".($status =='rejected' ? "selected='selected' ": "" ).">".$wcuf_upload_field_model->get_approval_label_from_status('rejected')."</option>";
									$approval_area .= "<option value='approved' ".($status =='approved' ? "selected='selected' ": "" ).">".$wcuf_upload_field_model->get_approval_label_from_status('approved' )."</option>";
									$approval_area .= "</select>";
									$approval_area .= "</div>";
									$approval_area .= "<div class='wcuf-approva-feedback-container'>";
									$approval_area .= "<label class='wcuf-label'>".esc_html__('Feedback', 'woocommerce-files-upload')."</label>";
									$approval_area .= "<textarea name='wcuf_approval[".$upload_field_id."][feedback][".$counter."]'>".$approval_feedback."</textarea>";
									$approval_area .= "</div>";
									$approval_area .= "</div>";
									
								}
								$preview_html = $disable_image_preview ? "" : $wcuf_media_model->get_media_preview_html($file_meta, $temp_file_name, $is_zip, $order_id, $counter, false, array('width' => 120, 'height' => 120));
								$download_attribute = $disable_force_download_on_admin_order_page ? "  " : " download ";
								$additional_html = apply_filters('wcuf_admin_order_files_list_elemet', "", $file_meta, $counter);
								$files_name .= '<li><a class="wcuf_link" target="_blank" href="'.$file_meta['url'][$counter].'" '.$download_attribute.'>'.$preview_html.'<br/>'.$temp_file_name.'</a> '.$delete_icon.$additional_html.'<span class="wcuf-qty-text"><br/>('.esc_html__('Quantity: ', 'woocommerce-files-upload').$quantity.')</span>'.$approval_area.'</li>';
							}
						}
						$files_name .= "</ol></p>";
						echo $files_name;
					}
					?>
					
					<?php 
					if($enable_approval && $disable_file_approval_per_single_file): 
						$status = wcuf_get_value_if_set($file_meta, array('approval', 'status', 0), 'waiting-for-approval'); 
						$approval_feedback = wcuf_get_value_if_set($file_meta, array('approval', 'feedback', 0), ""); 
					?>
						<div class="wcuf-approval-area">
						<div class="wcuf-approval-selector-container">
							<label class="wcuf-label"><?php echo esc_html_e('Approve or reject', 'woocommerce-files-upload'); ?></label>
							<select name="wcuf_approval[<?php echo $upload_field_id; ?>][status][0]">
								<option value="waiting-for-approval" <?php echo $status =='waiting-for-approval' ? "selected='selected' ": ""?>><?php  echo $wcuf_upload_field_model->get_approval_label_from_status('waiting-for-approval'); ?></option>
								<option value="rejected" <?php echo $status =='rejected' ? "selected='selected' ": ""?>><?php  echo $wcuf_upload_field_model->get_approval_label_from_status('rejected'); ?></option>
								<option value="approved" <?php echo $status =='approved' ? "selected='selected' ": ""?>><?php  echo $wcuf_upload_field_model->get_approval_label_from_status('approved');?></option>
							</select>
						</div>
						<div class="wcuf-approva-feedback-container">
						<label class="wcuf-label"><?php echo esc_html_e('feedback', 'woocommerce-files-upload'); ?></label>
						<textarea name="wcuf_approval[<?php echo $upload_field_id; ?>][feedback][0]" rows="5"><?php echo $approval_feedback; ?></textarea>
						</div>
						</div>
					<?php endif; ?>
					<?php if(isset($file_meta['user_feedback']) && $file_meta['user_feedback'] != "" && $file_meta['user_feedback'] != "undefined"):?>
						<p style="margin-top:5px;">
							<strong><?php echo esc_html_e('User feedback', 'woocommerce-files-upload'); ?></strong></br>
							<?php echo $file_meta['user_feedback'];?>
						</p>
					<?php endif;?>
					<?php $media_counter = 0;
						if(isset($file_meta['ID3_info']) && $file_meta['ID3_info'] != "none"): ?>
						<p style="margin-top:5px;">
							<strong><?php echo esc_html_e('Media info', 'woocommerce-files-upload') ?></strong></br>
							<?php	foreach($file_meta['ID3_info'] as $file_media_info):?>
											<?php if($media_counter > 0) echo "<br/>";?>
											<?php  echo esc_html__('Name: ', 'woocommerce-files-upload')."<i>".$file_media_info['file_name']."</i>";?></br> 
											<?php echo esc_html__('Duration: ', 'woocommerce-files-upload')."<i>".$file_media_info['playtime_string']."</i>"?></br>
											<!-- <?php echo esc_html__('Quantity: ', 'woocommerce-files-upload')."<i>".$file_media_info['quantity']."</i>"?></br> -->
											<?php $media_counter++; 
									endforeach; ?>
						</p>
					<?php endif;?>
						
					<p style="margin-top:3px;">
						<?php if($is_zip || !$is_multiple_files): 
							$file_url = !is_array($file_meta['url']) ? $file_meta['url'] : $file_meta['url'][0];
						?>
							<a target="_blank" class="button button-primary wcuf_primary_button" style="text-decoration:none; color:white;  margin-bottom:4px;" href="<?php echo $file_url; ?>"><?php esc_html_e('Download', 'woocommerce-files-upload'); ?></a>
						<?php elseif($wcuf_upload_field_model->can_be_zip_file_created_upload_field_content($file_meta)):
							$number_of_local_upload_fields++;
							?>
							<p><strong><?php esc_html_e('Note:', 'woocommerce-files-upload') ?></strong> <?php esc_html_e('Only local files can be zipped.', 'woocommerce-files-upload') ?>
							<a target="_blank" class="button button-primary wcuf_primary_button" style="text-decoration:none; color:white;" href="<?php echo get_site_url();?>?wcuf_create_zip_for_field=<?php echo $file_meta['id']; ?>&wcuf_order_id=<?php echo $order_id;?>"><?php esc_html_e('Download as zip', 'woocommerce-files-upload'); ?></a>
							</p>
						<?php endif; ?>
						<input  type="submit" class="button delete_button wcuf_delete_button" data-fileid="<?php echo $file_meta['id'] ?>" value="<?php esc_html_e('Delete file(s)', 'woocommerce-files-upload'); ?>" ></input>
					</p>
				</li>
			  <?php endforeach;?>
			</ul>
			<?php if($num_of_active_upload_fields > 0 && $number_of_local_upload_fields>1): ?>
			<a class="button button-primary wcuf_primary_button" id="wcuf_download_files_as_single_zip" target="_blank" href="<?php echo admin_url( "?wcuf_create_single_zip_for_order={$order_id}" ); ?>"><?php esc_html_e('Download all files as zip', 'woocommerce-files-upload') ?></a>
			<?php endif; ?>
			<a class="button button-primary wcuf_primary_button" target="_blank" href="<?php echo admin_url( "?wcuf_page=uploads_details_sheet&wcuf_order_id={$order_id}" ); ?>"><?php esc_html_e('Uploads details sheet', 'woocommerce-files-upload') ?></a>
			<?php endif; ?>
		</div>
		<div class="clear"></div>
		<?php 
	}	
}
?>