<?php 
class WCUF_DokanOrderDetailsPage
{
	var $uploaded_files_metadata = array();
	public function __construct()
	{
		add_action( 'dokan_order_detail_after_order_items', array( &$this, 'render_uploaded_fiels_metabox' ));
	}
	function render_uploaded_fiels_metabox($order)
	{
		global $wcuf_option_model, $wcuf_upload_field_model, $wcuf_time_model;
		$file_fields_meta = $wcuf_option_model->get_fields_meta_data();
		$uploaded_files = wcuf_get_value_if_set($this->uploaded_files_metadata, $order->get_id(), false) != false ? $this->uploaded_files_metadata[$order->get_id()] : $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order->get_id()); //$wcuf_option_model->get_order_uploaded_files_meta_data($order->get_id());
		$this->uploaded_files_metadata[$order->get_id()] = $uploaded_files;
		
		wp_enqueue_style( 'wcuf-frontend-dokan-order-details-page', wcuf_PLUGIN_PATH.'/css/wcuf-frontend-dokan-order-details-page.css' );
		?>
		
		<div class="" style="width: 100%">
			<div class="dokan-panel dokan-panel-default">
				<div class="dokan-panel-heading"><strong><?php esc_html_e( 'Uploaded files', 'woocommerce-files-upload' ); ?></strong></div>
				<div class="dokan-panel-body">		
					<?php if(empty($uploaded_files)): echo '<p><strong>'.esc_html__('Customer hasn\'t uploaded any file...yet.', 'woocommerce-files-upload').'</strong></p>'; 
					else:?>
					<ul class="wcuf_uploaded_files_list">
					 <?php foreach($uploaded_files as $file_meta): 
						
																													//could be used 'soruce'. test if is setted and != 'dropbox'
						$is_zip = $wcuf_upload_field_model->is_upload_field_content_managed_as_zip($file_meta);
						$is_multiple_files = $wcuf_upload_field_model->is_upload_field_content_managed_as_multiple_files($file_meta); 
						$original_name = "";
						
						if($is_zip || $is_multiple_files)
							$original_name = esc_html__('Multiple files', 'woocommerce-files-upload');
						else if(isset($file_meta['original_filename']))
							$original_name = !is_array($file_meta['original_filename']) ? $file_meta['original_filename'] : $file_meta['original_filename'][0];
						
						if($original_name == "")
							continue;
						?>
						<li style="margin-bottom:40px;">
							<h4 class="wcuf_upload_field_title">
							<?php echo $file_meta['title']; ?></h4>
							<?php 
								$quantity = 1;
								if(!$is_zip && !$is_multiple_files)
									echo esc_html__('Quantity: ', 'woocommerce-files-upload')."<i>".$quantity."</i></br></br>";
							
							 
							if($is_zip || $is_multiple_files) //old multiple file managment
							{
								$files_name = "<p><ol>";
								
								foreach( $file_meta['original_filename'] as $counter => $temp_file_name)
								{
									if(isset($file_meta['quantity'][$counter]))
										$quantity = is_array($file_meta['quantity'][$counter]) ? array_sum($file_meta['quantity'][$counter]) : $file_meta['quantity'][$counter];
									if($is_zip)
									{
										$zip_file_name = basename ($file_meta['absolute_path']);
										if(!$wcuf_upload_field_model->is_dropbox_stored($file_meta))
											$files_name .= '<li><a class="wcuf_link" target="_blank" href="'.get_site_url().'?wcuf_zip_name='.$zip_file_name.'&wcuf_single_file_name='.$temp_file_name.'&wcuf_order_id='.$order->get_id().'">'.$temp_file_name.'</a> ('.esc_html__('Quantity: ', 'woocommerce-files-upload').$quantity.')</li>';
										else
											$files_name .= '<li>'.$temp_file_name.' ('.esc_html__('Quantity: ', 'woocommerce-files-upload').$quantity.')</li>';
									}
									else
										$files_name .= '<li><a class="wcuf_link" target="_blank" href="'.$file_meta['url'][$counter].'" download>'.$temp_file_name.'</a> ('.esc_html__('Quantity: ', 'woocommerce-files-upload').$quantity.')</li>';
									$counter++;
								}
								$files_name .= "</ol></p>";
								echo $files_name;
							}
							?>
							
							
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
													<?php $media_counter++; 
											endforeach; ?>
								</p>
							<?php endif;?>
								
							<p style="margin-top:3px;">
								<?php if($is_zip || !$is_multiple_files): 
									$file_url = !is_array($file_meta['url']) ? $file_meta['url'] : $file_meta['url'][0];
								?>
									<a target="_blank" class="button button-primary wcuf_primary_button" style="text-decoration:none; color:white;  margin-bottom:4px;" href="<?php echo $file_url; ?>"><?php esc_html_e('Download', 'woocommerce-files-upload'); ?></a>
								<?php elseif($wcuf_upload_field_model->can_be_zip_file_created_upload_field_content($file_meta)): ?>
									<p>
										<a target="_blank" class="button button-primary wcuf_primary_button" style="text-decoration:none; color:white;" href="<?php echo get_site_url();?>?wcuf_create_zip_for_field=<?php echo $file_meta['id']; ?>&wcuf_order_id=<?php echo $order->get_id();?>"><?php esc_html_e('Download all as zip', 'woocommerce-files-upload'); ?></a>
									</p>
								<?php endif; ?>
							</p>
						</li>
					  <?php endforeach;?>
					</ul>
					<a class="button button-primary wcuf_primary_button" target="_blank" href="<?php echo admin_url( "?wcuf_page=uploads_details_sheet&wcuf_order_id={$order->get_id()}" ); ?>"><?php esc_html_e('Uploads details sheet', 'woocommerce-files-upload') ?></a>
					<?php endif; ?>
				</div>
			</div>
		</div>
		<?php 
	}
	
}
?>