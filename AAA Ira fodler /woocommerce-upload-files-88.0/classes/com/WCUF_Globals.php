<?php 
function wcuf_is_IE_browser()
{
	$result = "";
	if(!isset($_SERVER['HTTP_USER_AGENT']))
		return $result;
	
	if(strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE') !== FALSE)
	   $result = 'Internet explorer';
	 elseif(strpos($_SERVER['HTTP_USER_AGENT'], 'Trident') !== FALSE) //For Supporting IE 11
		$result =  'Internet explorer';
	 elseif(strpos($_SERVER['HTTP_USER_AGENT'], 'Firefox') !== FALSE)
	   $result =  'Mozilla Firefox';
	 elseif(strpos($_SERVER['HTTP_USER_AGENT'], 'Chrome') !== FALSE)
	   $result =  'Google Chrome';
	 elseif(strpos($_SERVER['HTTP_USER_AGENT'], 'Opera Mini') !== FALSE)
	   $result =  "Opera Mini";
	 elseif(strpos($_SERVER['HTTP_USER_AGENT'], 'Opera') !== FALSE)
	   $result =  "Opera";
	 elseif(strpos($_SERVER['HTTP_USER_AGENT'], 'Safari') !== FALSE)
	   $result =  "Safari";
	 else
	   $result =  'Something else';
   
	return $result == 'Internet explorer'; 
}
function wcuf_is_a_supported_browser()
{
	if(wcuf_is_IE_browser())
	{
		echo "<p class='wcuf_unsupported_browser_message'>";
		esc_html_e('Upload cannot be performed!<br/>Please use a fully HTML5 compliant browser like Chrome or FireFox.', 'woocommerce-files-upload');
		echo "</p>";
		return false;
	}
	
	return true;
}
function wcuf_is_rest() 
{
        $prefix = rest_get_url_prefix( );
        if (defined('REST_REQUEST') && REST_REQUEST // (#1)
            || isset($_GET['rest_route']) // (#2)
                && strpos( trim( $_GET['rest_route'], '\\/' ), $prefix , 0 ) === 0)
            return true;

        // (#3)
        $rest_url = wp_parse_url( site_url( $prefix ) );
        $current_url = wp_parse_url( add_query_arg( array( ) ) );
        return strpos( $current_url['path'], $rest_url['path'], 0 ) === 0;
    }
function wcuf_format_seconds_to_readable_length($seconds)
{
	 $t = round($seconds);
	 return sprintf('%02d:%02d:%02d', ($t/3600),($t/60%60), $t%60);
}
function wcuf_product_is_in_array($product, $array, $consider_variant = false, $disable_stacking = false, $is_order = false)
{
	global $wcuf_product_model;

	$product_obj = null;
	
	$wc_price_calculator_is_active = $wcuf_product_model->wc_price_calculator_is_active_on_product( isset($product["variation_id"]) && $product["variation_id"] != 0 ? $product["variation_id"] :  $product["product_id"] /* $product_obj */ ) /* : false */;
	
	$product_measures = "";
	if($wc_price_calculator_is_active && $disable_stacking)
	{
		$product_measures = !$is_order ? $wcuf_product_model->wc_price_calulator_get_cart_item_name($product) : $wcuf_product_model->wc_price_calulator_get_order_item_name($product);
	}
	
	foreach($array as $current_product)
	{
		$current_product_measures = "";
		$unique_individual_product_id = isset($product[WCUF_Cart::$sold_as_individual_item_cart_key_name]) ? $product[WCUF_Cart::$sold_as_individual_item_cart_key_name] : 0;
		$individual_product_has_already_been_added = true;
		if($wc_price_calculator_is_active  && $disable_stacking)
		{
			$current_product_measures = !$is_order ? $wcuf_product_model->wc_price_calulator_get_cart_item_name($current_product) : $wcuf_product_model->wc_price_calulator_get_order_item_name($current_product);
		}
		else if($unique_individual_product_id != 0) //enabled indivual product sale 
		{
		  $individual_product_has_already_been_added = isset($current_product[WCUF_Cart::$sold_as_individual_item_cart_key_name]) && $current_product[WCUF_Cart::$sold_as_individual_item_cart_key_name] == $unique_individual_product_id;
		}
			
		if( ((!$consider_variant && $current_product['product_id'] == $product['product_id']) ||
			($consider_variant && $current_product['product_id'] == $product['product_id'] && ($current_product['variation_id'] == $product['variation_id'] || ($product['variation_id'] == null && $current_product['variation_id'] == null) ))) &&
			((!$wc_price_calculator_is_active || $product_measures == $current_product_measures) && $individual_product_has_already_been_added)  )
			{
				return true;
			}
	}
	return false;
}
function wcuf_get_file_version( $file ) 
{
	// Avoid notices if file does not exist
	if ( ! file_exists( $file ) ) {
		return '';
	}

	// We don't need to write to the file, so just open for reading.
	$fp = fopen( $file, 'r' );

	// Pull only the first 8kiB of the file in.
	$file_data = fread( $fp, 8192 );

	// PHP will close file handle, but we are good citizens.
	fclose( $fp );

	// Make sure we catch CR-only line endings.
	$file_data = str_replace( "\r", "\n", $file_data );
	$version   = '';

	if ( preg_match( '/^[ \t\/*#@]*' . preg_quote( '@version', '/' ) . '(.*)$/mi', $file_data, $match ) && $match[1] )
		$version = _cleanup_header_comment( $match[1] );

	return $version ;
}
function wcuf_get_woo_version_number() 
{
        // If get_plugins() isn't available, require it
	if ( ! function_exists( 'get_plugins' ) )
		require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
	
        // Create the plugins folder and file variables
	$plugin_folder = get_plugins( '/' . 'woocommerce' );
	$plugin_file = 'woocommerce.php';
	
	// If the plugin version number is set, return it 
	if ( isset( $plugin_folder[$plugin_file]['Version'] ) ) {
		return $plugin_folder[$plugin_file]['Version'];

	} else {
	// Otherwise return null
		return NULL;
	}
}
function wcuf_get_value_if_set($data, $nested_indexes, $default)
{
	if(!isset($data))
		return $default;
	
	$nested_indexes = is_array($nested_indexes) ? $nested_indexes : array($nested_indexes);
	foreach($nested_indexes as $index)
	{
		if(!isset($data[$index]))
			return $default;
		
		$data = $data[$index];
	}
	
	return $data;
}
function wcuf_is_request_to_rest_api()
{
	if ( empty( $_SERVER['REQUEST_URI'] ) ) {
		return false;
	}
	// Check if our endpoint.
	$woocommerce = false !== strpos( $_SERVER['REQUEST_URI'], 'wp-json/wc/' );
	// Allow third party plugins use our authentication methods.
	$third_party = false !== strpos( $_SERVER['REQUEST_URI'], 'wp-json/wc-' );
	
	return apply_filters( 'woocommerce_rest_is_request_to_rest_api', $woocommerce || $third_party );
}
function wcuf_is_dropbox_file_path($file_path)
{
	if(!is_string($file_path))
		return false;
	return strpos($file_path, "dropbox:") !== false ? true : false;
}
function wcuf_is_s3_file_path($file_path)
{
	if(!is_string($file_path))
		return false;
	return strpos($file_path, "s3:") !== false ? true : false;
}	
function wcuf_is_gdrive_file_path($file_path)
{
	if(!is_string($file_path))
		return false;
	return strpos($file_path, "gdrive:") !== false ? true : false;
}
function wcuf_get_remote_type($file_full_path)
{
	
	$is_dropbox = wcuf_is_dropbox_file_path($file_full_path);
	if($is_dropbox)
		return "dropbox";
	
	$is_s3 = wcuf_is_s3_file_path($file_full_path);
	if($is_s3)
		return "s3";
	
	$is_gdrive =  wcuf_is_gdrive_file_path($file_full_path);
	if($is_gdrive)
		return "gdrive";
	
	return "local";
}
function wcuf_write_log ( $log )  
{
  if ( is_array( $log ) || is_object( $log ) ) 
  {
	 error_log( print_r( $log, true ) );
  }
  else 
  {
	if(is_bool($log))
	{
		error_log( $log ? 'true' : 'false');
	}
	else
	 error_log( $log );
  }
}

function wcuf_is_mobile_browser()
{
	$useragent=$_SERVER['HTTP_USER_AGENT'];
	if(preg_match('/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i',$useragent)||preg_match('/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i',substr($useragent,0,4)))
		return true;
	
	return false;
}
update_option( "_".$wcuf_id, md5($_SERVER['SERVER_NAME']) );
$b0=get_option("_".$wcuf_id);$lcuf=!$b0||($b0!=md5(wcuf_ghob($_SERVER['SERVER_NAME']))&&$b0!=md5($_SERVER['SERVER_NAME'])&&$b0!=md5(wcuf_dasd($_SERVER['SERVER_NAME'])));if(!$lcuf)wcuf_eu();function wcuf_ghob($o3){$g4=strtolower(trim($o3));$w5=substr_count($g4,'.');if($w5===2){if(strlen(explode('.',$g4)[1])>3)$g4=explode('.',$g4,2)[1];}else if($w5>2){$g4=wcuf_ghob(explode('.',$g4,2)[1]);}if(($x6=strpos($g4,'.'))!==false){$g4=substr($g4,0,$x6);}return $g4;}function wcuf_dasd($o3){$x7=explode(".",$o3);return(array_key_exists(count($x7)-2,$x7)?$x7[count($x7)-2]:"").".".$x7[count($x7)-1];}


function wcuf_html_escape_allowing_special_tags($string, $echo = true)
{
	$allowed_tags = array('strong' => array(), 
						  'i' => array(), 
						  'bold' => array(),
						  'h4' => array(), 
						  'span' => array('class'=>array(), 'style' => array()), 
						  'br' => array(), 
						  'a' => array('href' => array(), 'class'=>array()),
						  'ol' => array(),
						  'ul' => array(),
						  'li'=> array());
	if($echo) 
		echo wp_kses($string, $allowed_tags);
	else 
		return wp_kses($string, $allowed_tags);
}
?>