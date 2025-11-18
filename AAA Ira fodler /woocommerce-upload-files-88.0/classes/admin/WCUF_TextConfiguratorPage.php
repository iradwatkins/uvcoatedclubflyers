<?php 
class WCUF_TextConfiguratorPage
{
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
				'page_title' 	=> 'Texts',
				'menu_title'	=> 'Texts',
				'parent_slug'	=> 'woocommerce-files-upload-menu',
			));
			
		}
	}
	
	function after_saving_options($post_id = 0)
	{
		if( isset($_GET['page']) && $_GET['page'] == 'acf-options-texts')
			{
		
				global $wcuf_asset_model;
				$wcuf_asset_model->generate_assets();
			}
	}
}
?>