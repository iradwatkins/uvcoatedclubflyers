<?php 
class WCUF_Assets
{
	var $asset_version = 3.8;
	var $current_lang  = 'n/a';
	public function __construct()
	{
		add_action('wp_loaded', array($this, 'asset_files_check'), 99);
	}
	public function get_current_asset_lang()
	{
		return $this->current_lang;
	}
	public function asset_files_check()
	{
		
		global $wcuf_option_model, $wcuf_wpml_helper;
		$now = time();
		$last_asset_time = $wcuf_option_model->get_asset_time();
		$asset_version = $wcuf_option_model->get_asset_version();
		$timeout_duration = 3600; //1200: 60 min
		$current_locale = $wcuf_wpml_helper->get_current_locale();
		
		if(!file_exists(WCUF_PLUGIN_ABS_PATH.'/js/wcuf-frontend-cart-checkout-product-page'.'_'.$current_locale.'.js') || 
		   $asset_version != $this->asset_version)
		{
			$this->generate_assets();
			$wcuf_option_model->set_asset_time($now);
			$wcuf_option_model->set_asset_version($this->asset_version);
		}
	}
	public function generate_assets()
	{
		global $wcuf_wpml_helper;
		$langs = $wcuf_wpml_helper->get_available_locale();
		$current_locale = $wcuf_wpml_helper->get_current_locale();
		
		foreach($langs as $lang)
		{
			$wcuf_wpml_helper->switch_to_lang($lang);
			switch_to_locale($lang);
			load_textdomain( 'woocommerce-files-upload', WCUF_PLUGIN_ABS_PATH . '/languages/woocommerce-files-upload-' . $lang . '.mo' );
			$this->current_lang = substr($lang, 0,2);
			
			ob_start();
			include WCUF_PLUGIN_ABS_PATH.'/js/wcuf-frontend-cart-checkout-product-page.js.php';
			$data =  ob_get_contents();
			ob_end_clean(); 
			file_put_contents(WCUF_PLUGIN_ABS_PATH.'/js/wcuf-frontend-cart-checkout-product-page'.'_'.$lang.'.js', $data);
			
			ob_start();
			include WCUF_PLUGIN_ABS_PATH.'/js/wcuf-frontend-order-details-page.js.php';
			$data =  ob_get_contents();
			ob_end_clean(); 
			file_put_contents(WCUF_PLUGIN_ABS_PATH.'/js/wcuf-frontend-order-details-page'.'_'.$lang.'.js', $data);
		}
		//Restore defaults
		$wcuf_wpml_helper->switch_to_lang($current_locale);
		switch_to_locale($current_locale);
		
		ob_start();
		include WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-common.css.php';
		$data =  ob_get_contents();
		ob_end_clean(); 
		file_put_contents(WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-common.css', $data);
		
		ob_start();
		include WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-product-page.css.php';
		$data =  ob_get_contents();
		ob_end_clean(); 
		file_put_contents(WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-product-page.css', $data);
		
		ob_start();
		include WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-order-detail.css.php';
		$data =  ob_get_contents();
		ob_end_clean(); 
		file_put_contents(WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-order-detail.css', $data);
		
		ob_start();
		include WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-checkout.css.php';
		$data =  ob_get_contents();
		ob_end_clean(); 
		file_put_contents(WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-checkout.css', $data);
		
		ob_start();
		include WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-cart.css.php';
		$data =  ob_get_contents();
		ob_end_clean(); 
		file_put_contents(WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-cart.css', $data);
		
		ob_start();
		include WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-shortcode.css.php';
		$data =  ob_get_contents();
		ob_end_clean(); 
		file_put_contents(WCUF_PLUGIN_ABS_PATH.'/css/wcuf-frontend-shortcode.css', $data); 
		
	}
}
?>