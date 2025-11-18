<?php
/*
Plugin Name: WooCommerce Upload Files
Description: WCUF plugin allows your customers to attach files to their orders according to the purchased products.
Author: Lagudi Domenico
Text Domain: woocommerce-files-upload
Domain Path: /languages/
Version: 88.0

WC requires at least: 6.5.0
WC tested up to: 13.0.0


Copyright: WooCommerce Upload Files uses the ACF PRO plugin. ACF PRO files are not to be used or distributed outside of the WooCommerce Upload Files plugin.
*/


define('wcuf_PLUGIN_PATH', rtrim(plugin_dir_url(__FILE__), "/") ) ;
define('WCUF_PLUGIN_LANG_PATH', basename( dirname( __FILE__ ) ) . '/languages' ) ;
define('WCUF_PLUGIN_ABS_PATH', dirname( __FILE__ ) );

add_action( 'before_woocommerce_init', function() {
	if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
	}
} );


if ( !defined('WP_CLI') && ( in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) ||
					   (is_multisite() && array_key_exists( 'woocommerce/woocommerce.php', get_site_option('active_sitewide_plugins') ))
					 )	
	)
{
	$url = $_SERVER['REQUEST_URI'];
	
	//For some reasins the theme editor in some installtion won't work. This directive will prevent that.
	if(isset($_POST['action']) && $_POST['action'] == 'edit-theme-plugin-file')
		return;
	
	if(isset($_REQUEST ['context']) && $_REQUEST['context'] == 'edit') //rest api
		return;
		
	if(isset($_POST['action']) && strpos($_POST['action'], 'health-check') !== false) //health check
		return;
	
	if(isset($_REQUEST['is_admin'])) //Fixes and uncompability with Project Manager plugin
		return;
	
	$avoid_loading = apply_filters('wcuf_avoid_loading',false );
	if($avoid_loading)
		return;
	
	$wcuf_id = 11442983;
	$wcuf_name = "WooCommerce Upload Files";
	$wcuf_activator_slug = "wcuf-activator";
	
	include_once( "classes/com/vendor/getid3/getid3.php"); 
	include_once( "classes/com/WCUF_Acf.php"); 		
	include 'classes/com/WCUF_Globals.php';
	require_once('classes/vendor/vanquish/admin/ActivationPage.php');
	
	add_action('init', 'wcuf_init');
	add_action('admin_menu', 'wcuf_init_act');
	if(defined('DOING_AJAX') && DOING_AJAX)
			wcuf_init_act();
	
	add_action('admin_notices', 'wcuf_admin_notices' );
} 
function wcuf_plugin_can_be_loaded()
{
	$url = $_SERVER['REQUEST_URI'];
	if( strpos($url, '/post.php') !== false) //Avoids ACF plugin to be loaded in the "edit" pages (like admin product page) where it is not neede
	{
		$order_id = $_GET['post'];
		$post_type = get_post_type($order_id);
		if($post_type != 'shop_order')
			return false;

		return true;
	}
	
	return true;
	
}
function wcuf_admin_notices()
{
	global $lcuf, $wcuf_name, $wcuf_activator_slug;
	if($lcuf && (!isset($_GET['page']) || $_GET['page'] != $wcuf_activator_slug))
	{
		 ?>
		<div class="notice notice-success">
			<p><?php wcuf_html_escape_allowing_special_tags(sprintf(__( 'To complete the <span style="color:#96588a; font-weight:bold;">%s</span> plugin activation, you must verify your purchase license. Click <a href="%s">here</a> to verify it.', 'woocommerce-files-upload' ), $wcuf_name, get_admin_url()."admin.php?page=".$wcuf_activator_slug)); ?></p>
		</div>
		<?php
	}
}
function wcuf_init()
{
	global $wcuf_id, $wcuf_option_model;
	if(current_user_can('administrator') && isset($_GET['wcuf_reset_license']))
	{
		delete_option("_".$wcuf_id); 
		delete_option("_".$wcuf_id."_purchase_code"); 
	}
		
	
	load_plugin_textdomain('woocommerce-files-upload', false, basename( dirname( __FILE__ ) ) . '/languages' );
	
	//Cloud libraries: loaded on the fly to avoid to load them all
	/* $cloud_settings = $wcuf_option_model->get_cloud_settings();	
	switch($cloud_settings['cloud_storage_service'])
	{
		case 'gdrive':	if(!class_exists('WCUF_GDrive')) require_once('classes/com/WCUF_GDrive.php');
		break;
		case 's3': 		if(!class_exists('WCUF_S3')) require_once('classes/com/WCUF_S3.php');
		break;
		case 'dropbox': if(!class_exists('WCUF_DropBox')) require_once('classes/com/WCUF_DropBox.php');
		break;
	} */
}
function wcuf_init_dropbox()
{
	if(!class_exists('WCUF_DropBox')) require_once('classes/com/WCUF_DropBox.php');
	
	return new WCUF_DropBox();
}
function wcuf_init_s3()
{
	if(!class_exists('WCUF_S3')) require_once('classes/com/WCUF_S3.php');
	return new WCUF_S3();
}
function wcuf_init_gdrive()
{
	if(!class_exists('WCUF_GDrive')) require_once('classes/com/WCUF_GDrive.php');
	return new WCUF_GDrive();
}
function wcuf_init_act()
{
	global $wcuf_activator_slug, $wcuf_name, $wcuf_id;
	new WCUF\vendor\vanquish\admin\ActivationPage($wcuf_activator_slug, $wcuf_name, 'woocommerce-files-upload', $wcuf_id, wcuf_PLUGIN_PATH);
}

function wcuf_eu()
{
	add_action('admin_menu', 'wcuf_init_admin_panel');
	add_action( 'wp_print_scripts', 'wcuf_unregister_css_and_js' );
	
	global $wcuf_dc_multivendor_order_details_addon, $wcuf_upload_field_model, $wcuf_html_helper, $wcuf_db_model, $wcuf_file_model,
		   $wcuf_media_model, $wcuf_option_model, $wcuf_customer_model, $wcuf_price_calculator_measurement_helper, $wcuf_cart_model,
		   $wcuf_session_model, $wcuf_text_model, $wcuf_shortcodes, $wcuf_wpml_helper, $wcuf_product_model, $wcuf_order_model,
		   $wcuf_email_notifier_helper, $wcuf_option_page, $wcuf_woocommerce_addon, $wcuf_woocommerce_orderstable_addon, $wcuf_individual_product_configurator_page,
		   $wcuf_uploads_details_sheet_page, $wcuf_common_hooks_page, $wcuf_asset_model, $wcuf_ftp_model, $wcuf_time_model, $wcuf_dropbox_model, $wcuf_s3_model, $wcuf_gdrive_model;
			
	//com
	require_once('classes/vendor/vanquish/com/Updater.php'); 
	new WCUF\vendor\vanquish\com\Updater(); 
	if(!class_exists('WCUF_Email'))
			require_once('classes/com/WCUF_Email.php');
	if(!class_exists('WCUF_Assets'))
	{
		require_once('classes/com/WCUF_Assets.php');
		$wcuf_asset_model = new WCUF_Assets();
	} 
	if(!class_exists('WCUF_UploadField'))
	{
		require_once('classes/com/WCUF_UploadField.php');
		$wcuf_upload_field_model = new WCUF_UploadField();
	} 
	if(!class_exists('WCUF_Html'))
	{
		require_once('classes/com/WCUF_Html.php');
		$wcuf_html_helper = new WCUF_Html();
	} 
	if(!class_exists('WCUF_Cron'))
	{
		require_once('classes/com/WCUF_Cron.php');
		new WCUF_Cron();
	} 
	if(!class_exists('WCUF_DB'))
	{
		require_once('classes/com/WCUF_DB.php');
		$wcuf_db_model = new WCUF_DB();
	} 
	if(!class_exists('WCUF_Ftp'))
	{
		require_once('classes/com/WCUF_Ftp.php');
		$wcuf_ftp_model = new WCUF_Ftp();
	} 
	if(!class_exists('WCUF_File'))
	{
		require_once('classes/com/WCUF_File.php');
		$wcuf_file_model = new WCUF_File();
	} 
	if(!class_exists('WCUF_Media'))
	{
		require_once('classes/com/WCUF_Media.php');
		$wcuf_media_model = new WCUF_Media();
	} 
	if(!class_exists('WCUF_Option'))
	{
		require_once('classes/com/WCUF_Option.php');
		$wcuf_option_model = new WCUF_Option();
	}
	
	if(!class_exists('WCUF_Customer'))
	{
		require_once('classes/com/WCUF_Customer.php');
		$wcuf_customer_model = new WCUF_Customer();
	}
	if(!class_exists('WCUF_WCPriceCalculatorMeasurementHelper'))
	{
		require_once('classes/com/WCUF_WCPriceCalculatorMeasurementHelper.php');
		$wcuf_price_calculator_measurement_helper = new WCUF_WCPriceCalculatorMeasurementHelper();
	}
	if(!class_exists('WCUF_Cart'))
	{
		require_once('classes/com/WCUF_Cart.php');
		$wcuf_cart_model = new WCUF_Cart();
	}
	if(!class_exists('WCUF_Session'))
	{
		require_once('classes/com/WCUF_Session.php');
		$wcuf_session_model = new WCUF_Session();
	}
	if(!class_exists('WCUF_Text'))
	{
		require_once('classes/com/WCUF_Text.php');
		$wcuf_text_model = new WCUF_Text();
	}
	if(!class_exists('WCUF_Shortcode'))
	{
		require_once('classes/com/WCUF_Shortcode.php');
		$wcuf_shortcodes = new WCUF_Shortcode();
	}
	if(!class_exists('WCUF_Wpml'))
	{
		require_once('classes/com/WCUF_Wpml.php');
		$wcuf_wpml_helper = new WCUF_Wpml();
	}
	if(!class_exists('WCUF_Product'))
	{
		require_once('classes/com/WCUF_Product.php');
		$wcuf_product_model = new WCUF_Product();
	}
	if(!class_exists('WCUF_Order'))
	{
		require_once('classes/com/WCUF_Order.php');
		$wcuf_order_model = new WCUF_Order();
	}
	if(!class_exists('WCUF_EmailNotifier'))
	{
		require_once('classes/com/WCUF_EmailNotifier.php');
		$wcuf_email_notifier_helper = new WCUF_EmailNotifier();
	}
	if(!class_exists('WCUF_Time'))
	{
		require_once('classes/com/WCUF_Time.php');
		$wcuf_time_model = new WCUF_Time();
	}
	if(!class_exists('WCUF_Tax'))
	{
		require_once('classes/com/WCUF_Tax.php');
	}
	
	//admin
	if(!class_exists('WCUF_OptionPage'))
	{
		require_once('classes/admin/WCUF_OptionPage.php');
		$wcuf_option_page = new WCUF_OptionPage();
	}
	if(!class_exists('WCUF_UploadFieldsConfiguratorPage')) 
	{	
		require_once('classes/admin/WCUF_UploadFieldsConfiguratorPage.php');
	}
	if ( ! function_exists( 'wp_handle_upload' ) ) {
		require_once( ABSPATH . 'wp-admin/includes/file.php' );
	}
	if(!class_exists('WCUF_WooCommerceAddon'))
	{
		require_once('classes/admin/WCUF_OrderDetailAddon.php');
		$wcuf_woocommerce_addon = new WCUF_OrderDetailAddon();
	}
	if(!class_exists('WCUF_OrdersTableAddon'))
	{
		require_once('classes/admin/WCUF_OrdersTableAddon.php');
		$wcuf_woocommerce_orderstable_addon = new WCUF_OrdersTableAddon();
	}
	if(!class_exists('WCUF_TextConfiguratorPage'))
	{
		require_once('classes/admin/WCUF_TextConfiguratorPage.php');	
	}
	if(!class_exists('WCUF_IndividualProductConfigurator'))
	{
		require_once('classes/admin/WCUF_IndividualProductConfigurator.php');
		$wcuf_individual_product_configurator_page = new WCUF_IndividualProductConfigurator();
	}
	if(!class_exists('WCUF_UploadsDetailsSheetPage'))
	{
		require_once('classes/admin/WCUF_UploadsDetailsSheetPage.php');
		$wcuf_uploads_details_sheet_page = new WCUF_UploadsDetailsSheetPage();
	}
	if(!class_exists('WCUF_CleanerPage'))
	{
		require_once('classes/admin/WCUF_CleanerPage.php');
	}
	
	//frontend
	if(!class_exists('WCUF_OrderDetailsPage'))
	{
		require_once('classes/frontend/WCUF_OrderDetailsPage.php');
		//$wcuf_order_details_page_addon;
	}
	if(!class_exists('WCUF_CommonHooks'))
	{
		require_once('classes/frontend/WCUF_CommonHooks.php');
		$wcuf_common_hooks_page = new WCUF_CommonHooks();
	}
	if(!class_exists('WCUF_ProductPage'))
	{
		require_once('classes/frontend/WCUF_ProductPage.php');
		
	}	
	if(!class_exists('WCUF_CheckoutPage'))
	{
		require_once('classes/frontend/WCUF_CheckoutPage.php');
		
	}
	if(!class_exists('WCUF_CartPage'))
	{
		require_once('classes/frontend/WCUF_CartPage.php');
		
	}
	if(!class_exists('WCUF_MyAccountPage'))
	{
		require_once('classes/frontend/WCUF_MyAccountPage.php');
		
	}
	if(!class_exists('WCUF_DCMultivendorOrderDetailsPage'))
	{
		require_once('classes/frontend/WCUF_DCMultivendorOrderDetailsPage.php');
		
	}
	if(!class_exists('WCUF_DokanOrderDetailsPage'))
	{
		require_once('classes/frontend/WCUF_DokanOrderDetailsPage.php');
	}
	
	//ACF custom fields init: For some reasons, they are not properly initialized via the WCMCA_Acf.php component
	wcuf_acf_init();
	
	wcuf_plugin_loaded_init();
}
function wcuf_register_settings()
{ 
	
} 
function wcuf_plugin_loaded_init()
{
	global $wcuf_product_page_addon, $wcuf_checkout_addon, $wcuf_cart_addon, $wcuf_order_details_page_addon,$wcuf_my_account_addon;
	$wcuf_product_page_addon = new WCUF_ProductPage();
	$wcuf_checkout_addon = new WCUF_CheckoutPage();
	$wcuf_cart_addon = new WCUF_CartPage();
	$wcuf_my_account_addon = new WCUF_MyAccountPage();
	$wcuf_order_details_page_addon = new WCUF_OrderDetailsPage();
	$wcuf_text_configurator_page = new WCUF_TextConfiguratorPage();
	$wcuf_dc_multivendor_order_details_addon = new WCUF_DCMultivendorOrderDetailsPage();
	new WCUF_DokanOrderDetailsPage();
	 							
	wcuf_acf_init();
}
function wcuf_init_session()
{
	
}
function wcuf_unregister_css_and_js($enqueue_styles)
{
	WCUF_UploadFieldsConfiguratorPage::force_dequeue_scripts($enqueue_styles);
}


function wcuf_init_admin_panel()
{
	if(!current_user_can('manage_woocommerce'))
		return;
	
	$place = wcuf_get_free_menu_position(59 , .1);
	
	add_menu_page( esc_html__('Woocommerce Upload Files', 'woocommerce-files-upload'), esc_html__('Woocommerce Upload Files', 'woocommerce-files-upload'), 'manage_woocommerce', 'woocommerce-files-upload-menu', 'render_wcuf_option_page', 'dashicons-images-alt2', (string)$place);
	add_submenu_page('woocommerce-files-upload-menu', esc_html__('Upload field configurator','woocommerce-files-upload'), esc_html__('Upload field configurator','woocommerce-files-upload'), 'manage_woocommerce', 'woocommerce-files-upload', 'render_wcuf_option_page');
	add_submenu_page('woocommerce-files-upload-menu', esc_html__('Cleaner','woocommerce-files-upload'), esc_html__('Cleaner','woocommerce-files-upload'), 'manage_woocommerce', 'wcuf-cleaner-page', 'render_wcuf_cleaner_page');
	remove_submenu_page( 'woocommerce-files-upload-menu', 'woocommerce-files-upload-menu');
	
	add_filter('plugin_action_links_woocommerce-upload-files/upload-files.php', 'wcuf_manage_plugin_actions_links');
}
function wcuf_manage_plugin_actions_links($links)
{
	$url = esc_url( add_query_arg(
		'wcuf_reset_license',
		'true',
		get_admin_url()
	) );
	// Create the link.
	$settings_link = "<a href='$url' onclick='return confirm(\"".esc_html__('Are you sure?','woocommerce-files-upload')."\");'>" . esc_html__('Reset activation','woocommerce-files-upload') . '</a>';
	// Adds the link to the end of the array.
	array_push(
		$links,
		$settings_link
	);
	return $links;
}
function wcuf_get_free_menu_position($start, $increment = 0.1)
{
	foreach ($GLOBALS['menu'] as $key => $menu) {
		$menus_positions[] = $key;
	}
	
	if (!in_array($start, $menus_positions)) return $start;

	/* the position is already reserved find the closet one */
	while (in_array($start, $menus_positions)) {
		$start += $increment;
	}
	return $start;
}
function render_wcuf_cleaner_page()
{
	$page = new WCUF_CleanerPage();
	$page->render_page();
}
function render_wcuf_option_page()
{
	$page = new WCUF_UploadFieldsConfiguratorPage();
	$page->render_page();
}
function wcuf_var_dump($var)
{
	echo "<pre>";
	var_dump($var);
	echo "</pre>";
}
?>