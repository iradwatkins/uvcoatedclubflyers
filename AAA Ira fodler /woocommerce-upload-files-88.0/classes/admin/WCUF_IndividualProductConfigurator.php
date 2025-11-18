<?php 
class WCUF_IndividualProductConfigurator
{
	static $page_id = "upload-files-configurator_page_acf-options-products-addable-multiple-times-to-cart";
	public function __construct()
	{
		$this->init_options_menu();
		add_action('wp_loaded', array(&$this,'after_saving_options')); //if performed on save, when generating assets data has not been saved. In this way the assets are generated on page reload
	}
	function init_options_menu()
	{
		if( function_exists('acf_add_options_page') ) 
		{
			 acf_add_options_sub_page(array(
				'page_title' 	=> 'Products addable multiple times to cart',
				'menu_title'	=> 'Products addable multiple times to cart',
				'parent_slug'	=> 'woocommerce-files-upload-menu',
			));
			
			
			
			add_action( 'current_screen', array(&$this, 'cl_set_global_options_pages') );
		}
	}
	function after_saving_options($post_id = 0)
	{
		if( isset($_GET['page']) && $_GET['page'] == 'acf-options-products-addable-multiple-times-to-cart')
			{
		
				global $wcuf_asset_model;
				$wcuf_asset_model->generate_assets();
			}
	}
	/**
	 * Force ACF to use only the default language on some options pages
	 */
	function cl_set_global_options_pages($current_screen) 
	{
	  if(!is_admin())
		  return;
	  
	
	  
	  $page_ids = array(
		WCUF_IndividualProductConfigurator::$page_id 
	  );
	 
	  if (in_array($current_screen->id, $page_ids)) 
	  {
		global $wcuf_wpml_helper;
		$wcuf_wpml_helper->switch_to_default_language();
		add_filter('acf/settings/current_language', array(&$this, 'cl_acf_set_language'), 100);
	  }
	}
	

	function cl_acf_set_language() 
	{
	  return acf_get_setting('default_language');
	}
}
?>