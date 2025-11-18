<?php 
class WCUF_CleanerPage
{
	function __construct()
	{
		
	}
	public function render_page()
	{
		global $wcuf_order_model;
		
		wp_enqueue_style( 'wcuf-admin-cleaner-page-picker', wcuf_PLUGIN_PATH.'/css/vendor/pickdatetime/classic.css');
		wp_enqueue_style( 'wcuf-admin-cleaner-page-pickerdate', wcuf_PLUGIN_PATH.'/css/vendor/pickdatetime/classic.date.css');
		wp_enqueue_style( 'wcuf-admin-common', wcuf_PLUGIN_PATH.'/css/wcuf-common.css');
		wp_enqueue_style( 'wcuf-admin-cleaner-page', wcuf_PLUGIN_PATH.'/css/wcuf-admin-cleaner-page.css');
				
		wp_enqueue_script( 'wcuf-admin-cleaner-page-picker', wcuf_PLUGIN_PATH.'/js/vendor/pickdatetime/picker.js', array('jquery') );
		wp_enqueue_script( 'wcuf-admin-cleaner-page-pickerdate', wcuf_PLUGIN_PATH.'/js/vendor/pickdatetime/picker.date.js', array('jquery') );
		wp_register_script( 'wcuf-admin-cleaner-page', wcuf_PLUGIN_PATH.'/js/wcuf-admin-cleaner-page.js', array('jquery') );
		$js_options = array(
			'order_statuses_error' => esc_html__( 'Please select at least one order status!', 'woocommerce-files-upload' ),
			'date_error' => esc_html__( 'Date field cannot be empty!', 'woocommerce-files-upload' ),
			'order_detected_msg' => esc_html__( 'Order to process: ', 'woocommerce-files-upload' ),
			'done_msg' => esc_html__( 'Done!', 'woocommerce-files-upload' )
		);
		wp_localize_script( 'wcuf-admin-cleaner-page', 'wcuf', $js_options );
		wp_enqueue_script( 'wcuf-admin-cleaner-page' );
		
		?>
		<?php if ($_SERVER['REQUEST_METHOD'] == 'POST'): ?>
			<div class="notice notice-success is-dismissible">
				 <p><?php esc_html_e('Saved successfully!', 'woocommerce-files-upload'); ?></p>
			</div>
		<?php endif; ?>
		<div class="white-box">
			<h2 class="wcuf_section_title wcuf_no_margin_top"><?php esc_html_e('Cleaner', 'woocommerce-files-upload');?></h3>
					<p><?php esc_html_e("This tool allows you to delete uploaded files associated with orders older than a given date and belonging to the chosen statuses.", 'woocommerce-files-upload');?></p>
					
					<div id="wcuf_settings">
						<h3><?php esc_html_e('Order statuses', 'woocommerce-files-upload');?></h3>
						<p><?php esc_html_e("Select which order statuses has to be considered", 'woocommerce-files-upload');?></p>
						<div class="wcuf_option_group">
						<?php $wc_statuses = $wcuf_order_model->get_available_order_statuses(); 
							foreach($wc_statuses as $wc_status_code => $status_name): ?>
							<div class="wcuf_checkbox_container">
								<input type="checkbox" class="wcuf_order_status wcuf_option_checbox_field" checked="checked" value="<?php echo $wc_status_code;?>"><?php echo $status_name; ?></input>
							</div>	
							<?php endforeach;?>
						</div>
						
						<h3><?php esc_html_e('Date', 'woocommerce-files-upload');?></h3>
						<p><?php esc_html_e("The tool will consider orders older than the selected date. Selected date will be included.", 'woocommerce-files-upload');?></p>
						<div class="wcuf_option_group">
						<input type="text" id="wcuf_start_date" class="wcuf_date_selector"></input>
						</div>
					</div>
					
					<div id="wcuf_progess_display">
						<h3><?php esc_html_e('Processing', 'woocommerce-files-upload');?></h3>
						<div id="progress-bar-container">
							<div id="progress-bar-background">
								<div id="progress-bar"><div id="percentage-text"></div>
								</div>																
							</div>
							<div id="notice-box"></div>				
						</div>	
					</diV>
					
				<p class="submit">
					<button class="button-primary" id="wcuf_start_process" ><?php esc_attr_e('Start', 'woocommerce-files-upload'); ?></button>
					<button class="button-primary" id="wcuf_reload_process" ><?php esc_attr_e('Clean more', 'woocommerce-files-upload'); ?></button>
				</p>
			<!-- </form>-->		
		</div>
		<?php
	}
}
?>