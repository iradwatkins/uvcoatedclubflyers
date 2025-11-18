<?php
class WCUF_UploadFieldsConfiguratorPage
{
	public static  $WCUF_current_lang;
	public function __construct()
	{
		
	}
	public static function force_dequeue_scripts($enqueue_styles)
	{
		if ( class_exists( 'woocommerce' ) && isset($_GET['page']) && $_GET['page'] == 'woocommerce-files-upload') 
		{
			global $wp_scripts,$wcuf_option_model;
			if(!$wcuf_option_model->configurator_page_force_load_js_scripts())
				$wp_scripts->queue = array();
			WCUF_UploadFieldsConfiguratorPage::enqueue_scripts();
		} 
	}
	public static function enqueue_scripts()
	{
		if ( class_exists( 'woocommerce' ) && isset($_GET['page']) && $_GET['page'] == 'woocommerce-files-upload') 
		{
			
			 global $wcuf_option_model;
			
			$general_options = $wcuf_option_model->get_all_options(); 
			wp_enqueue_style( 'select2.css', wcuf_PLUGIN_PATH.'/css/select2.min.css' ); 
			wp_enqueue_style( 'wcuf-common', wcuf_PLUGIN_PATH.'/css/wcuf-common.css' ); 
			wp_enqueue_style( 'wcuf-backend', wcuf_PLUGIN_PATH.'/css/wcuf-backend.css' );
			wp_enqueue_style( 'wcuf-toggle', wcuf_PLUGIN_PATH.'/css/vendor/toggle.css' );
			wp_enqueue_style( 'wcuf-upload-configurator-page-tabs', wcuf_PLUGIN_PATH.'/css/wcuf-admin-upload-configurator-page-tabs.css' );
			wp_enqueue_style( 'wp-color-picker' );
			
			
			wp_enqueue_script( 'jquery' );		
			wp_enqueue_script( 'selectWoo' );
			wp_enqueue_script( 'jquery-ui-core' );
			wp_enqueue_script( 'jquery-ui-sortable' );
			wp_enqueue_script( 'common' );
			wp_enqueue_script( 'utils' );
			wp_enqueue_script( 'wp-color-picker');
			wp_enqueue_script( 'wcuf-autocomplete-product-and-categories', wcuf_PLUGIN_PATH.'/js/wcuf-admin-product_and_categories-autocomplete.js', array('jquery'),false,false );			
			wp_register_script( 'wcuf-admin-upload-configurator-page-tabs', wcuf_PLUGIN_PATH.'/js/wcuf-admin-upload-configurator-page-tabs.js', array('jquery'),false,false );			
			if($general_options['show_warning_alert_on_configurator'] == 'yes')
				wp_enqueue_script( 'wcuf-admin-menu-debug', wcuf_PLUGIN_PATH.'/js/wcuf-debug-alert.js', array('jquery'),false,false );
			
			//js paramenters
			$js_options = array(
				'missing_required_value' => esc_html__( 'Please fill all the required fields (the ones marked with a red asterisk) before switching tab.', 'woocommerce-files-upload' )
			);
			wp_localize_script( 'wcuf-admin-upload-configurator-page-tabs', 'wcuf_options', $js_options );
			wp_enqueue_script( 'wcuf-admin-upload-configurator-page-tabs' );
			
		}
	}
	public static function WCUF_switch_to_default_lang()
	{
		if(defined("ICL_LANGUAGE_CODE") && ICL_LANGUAGE_CODE != null)
		{
			global $sitepress;
			WCUF_UploadFieldsConfiguratorPage::$WCUF_current_lang = ICL_LANGUAGE_CODE;
			$sitepress->switch_lang($sitepress->get_default_language());
		}
	}
	public static function WCUF_restore_current_lang()
	{
		if(defined("ICL_LANGUAGE_CODE") && ICL_LANGUAGE_CODE != null)
		{
			global $sitepress;
			$sitepress->switch_lang(WCUF_UploadFieldsConfiguratorPage::$WCUF_current_lang);
		}
	}
	
	private function update_settings()
	{
		global $wcuf_option_model;
		$wcuf_file_meta = isset($_POST['wcuf_file_meta']) ? $_POST['wcuf_file_meta'] : null;
			return $wcuf_option_model->save_bulk_options($wcuf_file_meta);
		
		return null;
	}
	
	public function render_page()
	{
		global $wcuf_option_model, $wcuf_product_model, $wcuf_customer_model, $wcuf_html_helper;
		if (isset($_POST['wcuf_file_meta']) || isset($_POST['wcuf_is_submit']) )
			$file_fields_meta = $this->update_settings();
		else
			$file_fields_meta = $wcuf_option_model->get_fields_meta_data();
		
		wp_register_script( 'wcuf-admin-menu', wcuf_PLUGIN_PATH.'/js/wcuf-admin-upload-fields-configuration-page.js', array('jquery'),false,false );
		
		//vars
		$last_id = $wcuf_option_model->get_option( 'wcuf_last_file_id');
		$last_id = !$last_id ? 0 : $last_id++;
		$variables = array(
			'last_id' => $last_id,
			'confirm_delete_message' => esc_html__('Are you sure you want to delete the field?', 'woocommerce-files-upload'),
			'security' => wp_create_nonce('wcuf_upload_field_configuration_page'),
			'loading_text' => esc_html__('Processing request, please wait...', 'woocommerce-files-upload')
		);
		wp_localize_script( 'wcuf-admin-menu', 'wcuf', $variables );	
		wp_enqueue_script( 'wcuf-admin-menu');	
		
		?>
		<div id="icon-themes" class="icon32"><br></div> 
		<h2><?php esc_html_e('Uploads options', 'woocommerce-files-upload');?></h2>
		<h3></h3>
		<?php if ($_SERVER['REQUEST_METHOD'] == 'POST') 
				echo '<div id="message" class="wcuf_updated"><p>' . esc_html__('Saved successfully.', 'woocommerce-files-upload') . '</p></div>'; ?>
		<div class="wrap">
		
			<form action="" method="post"  style="padding-left:20px">
			<input type="hidden" name="wcuf_is_submit" value="true"></input>
			<button class="add_field_button button-primary"><?php esc_html_e('Add new Upload Field', 'woocommerce-files-upload');?></button>
				<img class="wcuf_preloader_image" src="<?php echo wcuf_PLUGIN_PATH.'/img/preloader.gif' ?>" ></img>
				<ul class="input_fields_wrap wcuf_sortable">
				<?php echo $wcuf_html_helper->upload_field_configurator_template($file_fields_meta, 0 ); ?>
				</ul>
				<button class="add_field_button button-primary"><?php esc_html_e('Add new Upload Field', 'woocommerce-files-upload');?></button>
				<img class="wcuf_preloader_image" src="<?php echo wcuf_PLUGIN_PATH.'/img/preloader.gif' ?>" ></img>
				
				<p class="submit">
					<input name="Submit" type="submit" class="button-primary" value="<?php esc_attr_e('Save Changes', 'woocommerce-files-upload'); ?>" />
				</p>
			</form>
		</div>
		<?php
	}
}
?>