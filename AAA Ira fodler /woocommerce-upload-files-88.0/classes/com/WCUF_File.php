<?php
class WCUF_File
{
	var $current_order;
	var $email_sender;
	var $file_zip_name = 'multiple_files.zip';
	var $dropbox;
	var $to_remove_from_file_name = array(".php", "../", "./",  ".jsp", ".vbs", ".exe", ".bat", ".php5", ".pht", ".phtml", 
										  ".shtml", ".asa", ".cer", ".asax", ".swf", ".xap", ";", ".asp", ".aspx", 
										  "*", "<", ">", "::");
	var $saving_on_session = false;
	public function __construct()
	{
		add_action( 'before_delete_post', array( &$this, 'delete_all_order_uploads' ), 10 );
		//Ajax
		add_action( 'wp_ajax_upload_file_during_checkout_or_product_page', array( &$this, 'ajax_save_file_on_session' ));
		add_action( 'wp_ajax_nopriv_upload_file_during_checkout_or_product_page', array( &$this, 'ajax_save_file_on_session' ));
		
		add_action( 'wp_ajax_save_uploaded_files_on_order_detail_page', array( &$this, 'ajax_save_file_uploaded_from_order_detail_page' ));
		add_action( 'wp_ajax_nopriv_save_uploaded_files_on_order_detail_page', array( &$this, 'ajax_save_file_uploaded_from_order_detail_page' ));
		
		add_action( 'wp_ajax_upload_file_on_order_detail_page', array( &$this, 'ajax_upload_file_on_order_detail_page' ));
		add_action( 'wp_ajax_nopriv_upload_file_on_order_detail_page', array( &$this, 'ajax_upload_file_on_order_detail_page' ));
		
		add_action( 'wp_ajax_wcuf_update_feedback_text', array( &$this, 'ajax_update_feedback_text' ));
		add_action( 'wp_ajax_nopriv_wcuf_update_feedback_text', array( &$this, 'ajax_update_feedback_text' ));
		
		add_action( 'wp_ajax_wcuf_file_chunk_upload', array( &$this, 'ajax_manage_file_chunk_upload' ));
		add_action( 'wp_ajax_nopriv_wcuf_file_chunk_upload', array( &$this, 'ajax_manage_file_chunk_upload' ));
		
		add_action( 'wp_ajax_delete_file_on_order_detail_page', array( &$this, 'ajax_delete_file_on_order_detail_page' ));
		add_action( 'wp_ajax_nopriv_delete_file_on_order_detail_page', array( &$this, 'ajax_delete_file_on_order_detail_page' ));
		
		add_action( 'wp_ajax_delete_file_during_checkout_or_product_page', array( &$this, 'ajax_delete_file_from_session' ));
		add_action( 'wp_ajax_nopriv_delete_file_during_checkout_or_product_page', array( &$this, 'ajax_delete_file_from_session' ));
		
		add_action( 'wp_ajax_delete_single_file_on_order_detail_page', array( &$this, 'ajax_delete_single_file_from_order' ));
		add_action( 'wp_ajax_nopriv_delete_single_file_on_order_detail_page', array( &$this, 'ajax_delete_single_file_from_order' ));
		
		add_action( 'wp_ajax_delete_single_file_during_checkout_or_product_page', array( &$this, 'ajax_delete_single_file_from_session' ));
		add_action( 'wp_ajax_nopriv_delete_single_file_during_checkout_or_product_page', array( &$this, 'ajax_delete_single_file_from_session' ));
		
		
		//These are file request performed via Admin side
		add_action('init', array( &$this, 'get_file_in_zip' ));
		add_action('init', array( &$this, 'process_drobpox_temp_link_request' ), 99, 1); 
		
		add_action('init', array( &$this, 'process_s3_temp_link_request' ), 99, 1); 
		add_action('init', array( &$this, 'process_gdrive_auth_code_link_generation' )); 
		add_action('init', array( &$this, 'zip_upload_field_files_and_download' )); 
		add_action('init', array( &$this, 'process_secure_link_request' )); 

	}
	public static function return_bytes($val) 
	{
		$val = trim($val);
		$last = strtolower($val[strlen($val)-1]);
		$val = intval (substr($val, 0, -1));
		
		switch($last) {
			// The 'G' modifier is available since PHP 5.1.0
			case 'g':
				//$val *= 1024;
				$val *= 1024;
			case 'm':
				$val *= 1;
				break;
			case 'k':
				$val = 1;
		}
		
		return $val;
	}
	function process_secure_link_request()
	{
		if(!isset($_GET['wcuf_order_id']) || !isset($_GET['wcuf_upload_id']) || !isset($_GET['wcuf_index']))
			return;
		
		global $wcuf_upload_field_model, $wcuf_option_model;
		$order_id = $_GET['wcuf_order_id'];
		$upload_id = $_GET['wcuf_upload_id'];
		$index = $_GET['wcuf_index'];
		
		$wc_order = wc_get_order($order_id );
		$secure_links = $wcuf_option_model->get_all_options('secure_links', false);
		$generate_static_preview = $wcuf_option_model->get_all_options('generate_static_preview', false);
		if($secure_links && $wc_order && $wc_order->get_customer_id() && $wc_order->get_customer_id() != get_current_user_id() && !current_user_can( 'manage_woocommerce' ))
			exit;
		
		$uploaded_files_metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);
		$file_to_serve = $uploaded_files_metadata[$upload_id]['absolute_path'][$index];
		
		if($uploaded_files_metadata[$upload_id]['source'][$index] == 'local')
			$this->output_file($uploaded_files_metadata[$upload_id]['absolute_path'][$index], $wcuf_option_model);
		else 
		{
			$url = $uploaded_files_metadata[$upload_id]['url'][$index];
			//special case for gdrive preview
			if(isset($_GET['gdrive_html_preview']))
			{
				$url = str_replace("https://drive.google.com/open?id=", "https://drive.google.com/thumbnail?id=", $url);
			}
			wp_redirect($url);
		}
		
		
		
		exit;
	}
	function process_drobpox_temp_link_request()
	{
		if(!isset($_GET['dropbox_get_item_link']))
			return;
		
		global $wcuf_dropbox_model;
		
		if(!$wcuf_dropbox_model)
			$wcuf_dropbox_model = wcuf_init_dropbox();
		
		$file_path = $_GET['dropbox_get_item_link'];
		$dropbox = $wcuf_dropbox_model;
		wp_redirect( $dropbox->getTemporaryLink($file_path) );
		exit;
	}
	function process_gdrive_auth_code_link_generation()
	{
		if(!isset($_GET['gdrive_generate_oauth_link']))
			return;
		
		global $wcuf_option_model, $wcuf_customer_model;
		$cloud_settings = $wcuf_option_model->get_cloud_settings();
		
		if(!$cloud_settings['gdrive_json_auth_file'] || !$wcuf_customer_model->is_shop_manager())
			return;
		
		$filedir = get_attached_file( $cloud_settings['gdrive_json_auth_file']['id'] );
		$json = file_get_contents($filedir);
		wp_redirect("https://vanquishplugins.com/wcuf/gdrive_auth/index.php?auth=".urlencode($json)); 
	}
	function process_s3_temp_link_request()
	{
		if(!isset($_GET['s3_get_item']))
			return;
		
		global $wcuf_s3_model;
		
		if(!isset($wcuf_s3_model))
			$wcuf_s3_model = wcuf_init_s3();
		
		$file_path = $_GET['s3_get_item'];
		
		wp_redirect($wcuf_s3_model->get_file($file_path));
		exit;
	}
	function zip_upload_field_files_and_download() 
	{
		$create_single_zip_file_for_order = false;
		if(isset($_GET['wcuf_create_single_zip_for_order']))
		{
			$create_single_zip_file_for_order = true;
		}
		else if(!isset($_GET['wcuf_create_zip_for_field']) || !isset($_GET['wcuf_order_id']) || !class_exists('ZipArchive'))
			return;
		
		$user = wp_get_current_user();
		$allowed_roles = array('shop_manager', 'administrator');
		if(!is_user_logged_in() || (!array_intersect($allowed_roles, $user->roles ) && !current_user_can( 'manage_woocommerce' )))
		{
			esc_html_e('You are not authorized', 'woocommerce-files-upload');
			return;
		}
		
		global $wcuf_upload_field_model;
		
		$order_id = !$create_single_zip_file_for_order ? $_GET['wcuf_order_id'] : $_GET['wcuf_create_single_zip_for_order'];
		$file_meta = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);
			
		if(!$create_single_zip_file_for_order)
		{
			if(!isset($file_meta[$_GET['wcuf_create_zip_for_field']]))
				return;
		
			$files_to_zip = $wcuf_upload_field_model->can_be_zip_file_created_upload_field_content($file_meta[$_GET['wcuf_create_zip_for_field']]);
		}
		else
		{
			$files_to_zip = array();
			foreach($file_meta as $index => $data)
			{
				$result = $wcuf_upload_field_model->can_be_zip_file_created_upload_field_content($file_meta[$index]);
				//wcuf_var_dump($result);
				$files_to_zip = !empty($result) ? array_merge($files_to_zip, $result) : $files_to_zip;
			}
		}
		
		$zip = new ZipArchive();
		$filename = @tempnam("tmp", "zip");
		if (empty($files_to_zip) || $zip->open($filename, ZipArchive::OVERWRITE)!==TRUE) {
			return;
		}
		
		$bypass = apply_filters('wcuf_create_zip_file', false, $zip, $files_to_zip);
		if(!$bypass)
		{
			foreach($files_to_zip as $index => $file_data)
			{
				$file_name = apply_filters('wcuf_zipping_file', $file_data['name'], $file_data, $index);
				$zip->addFile($file_data['path'], $file_name); // $file_data['name']
			}	
			$zip->close();		
		}	
		$zip = $bypass;
		header('Content-Type: application/zip');
		header('Content-Length: ' . filesize($filename));
		header('Content-Disposition: attachment; filename="'.$order_id.'_wcuf_files.zip"');
		
		//File read
		$handle = fopen($filename, 'rb'); 
		$buffer = ''; 
		while (!feof($handle)) 
		{ 
			$buffer = fread($handle, 4096); 
			echo $buffer; 
			@ob_flush(); 
			flush(); 
		} 
		fclose($handle); 
		  
		unlink($filename); 
		die();
	}
	//OLD METHOND: no longer used after 18.6
	//Used ONLY in Admin order details page, when are generated links to uploaded files. In case of dropbox ZIP this method is prevented to be used.
	public function get_file_in_zip() 
	{
		if(!isset($_GET['wcuf_zip_name']) || !isset($_GET['wcuf_single_file_name']) || !isset($_GET['wcuf_order_id']))
			return;
		
		$user = wp_get_current_user();
		$allowed_roles = array('shop_manager', 'administrator');
		if(!is_user_logged_in() || (!array_intersect($allowed_roles, $user->roles ) && !current_user_can( 'manage_woocommerce' )))
		{
			esc_html_e('You are not authorized', 'woocommerce-files-upload');
			return;
		}
		
		$path = $_GET['wcuf_zip_name'];
		$single_file_name = $_GET['wcuf_single_file_name'];
		$temp_dir = $this->get_temp_dir_path($_GET['wcuf_order_id']);
		
		$z = new ZipArchive();
		if ($z->open($temp_dir.$path)) {
			$file_string = $z->getFromName($single_file_name);			
			$z->close();	
			header("Content-length: ".strlen($file_string));
			header("Content-disposition: attachment; filename=".$single_file_name.";" );
			header('Content-Transfer-Encoding: chunked');
			header('Expires: 0');
			header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
			header('Pragma: public');
			header('Content-Description: File Transfer');
			header('Content-Type: application/force-download');
			echo $file_string;
		}
		else
		{
			esc_html_e('Error opening the file', 'woocommerce-files-upload');
			return;
		}
		wp_die();
	}
	/* When a secure link is used, it means that:
		1) the file is accessed admin side. The file is then served as it is. 
		2) File is previewed by the WCUF_Media.php -> get_media() method defined in there.
	*/
	public function output_file($path)
	{
		global $wcuf_option_model;
		$disable_force_download_on_admin_order_page =  $wcuf_option_model->get_all_options('disable_force_download_on_admin_order_page');
		
		$size = filesize($path); 
		$fileName = basename($path);
		
		$preview_method = 'standard_method';
		$mime = mime_content_type($path);
	
		
		header("Content-length: ".$size);
		header('Expires: 0');
		header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
		header('Pragma: public');
		
		
		if(!$disable_force_download_on_admin_order_page)
		{
			header("Content-disposition: attachment; filename=".$fileName.";" );
			header('Content-Transfer-Encoding: chunked');
			header("Content-type: application/octet-stream");
			header("Content-Type: application/download");
			header('Content-Description: File Transfer');
			header('Content-Type: application/force-download');
		}
		else 
		{
			header("Content-disposition: filename=".$fileName.";" );
			header("Content-type: ".$mime);
		}
		
		if($preview_method == 'standard_method')
			readfile($path);
		
		else
		{
			if ($fd = fopen ($path, "r")) 
			{

				set_time_limit(0);
				ini_set('memory_limit', '1024M');
				ob_clean();
				flush();
				
				while(!feof($fd)) 
				{
					echo fread($fd, 1024);
					flush();
				}   
				ob_end_flush();
			 fclose($fd);
			} 
		}
		exit(); 
	}
	private function create_empty_file($path)
	{
		$file = fopen($path, 'w'); 
		if($file)
			fclose($file); 
	}
	private function create_folder($folder_name)
	{
		$upload_dir = wp_upload_dir();
		$base_path = $upload_dir['basedir']."/wcuf/";
		 
		if (!file_exists($base_path)) 
			mkdir($base_path, 0775, true);
		
		if( !file_exists ($base_path.'/index.html'))
			$this->create_empty_file ($base_path.'/index.html');
		
		if (!file_exists($base_path.$folder_name)) 
			mkdir($base_path.$folder_name, 0775, true);
		
		if( !file_exists ($base_path.$folder_name.'/index.html'))
			$this->create_empty_file  ($base_path.$folder_name.'/index.html');
		
		return $base_path.$folder_name;
	}
	function ajax_delete_file_on_order_detail_page()
	{
		global $wcuf_upload_field_model;
		if(!isset($_POST) || !isset($_POST['is_temp']) || !isset($_POST['order_id']) || $_POST['order_id'] == 0)
			return;
		
		if($_POST['is_temp'] == 'no')
		{
			global $wcuf_option_model;
			$file_order_metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($_POST['order_id']);
			$this->delete_file($_POST['id'], $file_order_metadata, $_POST['order_id']);
		}
		else
		{
			$this->ajax_delete_file_from_session(true);
		}
		wp_die();
	}
	function ajax_delete_file_from_session($is_order_detail_page = false)
	{
		global $wcuf_session_model,$wcuf_cart_model ;
		$wcuf_upload_unique_name = isset($_POST['id']) ? $_POST['id']:null;
		$extra_options = array("skip_delete_file" => wcuf_get_value_if_set($_POST, 'tm_extra_product_edit', false) == 'true');
		if(isset($wcuf_upload_unique_name))
		{
			$wcuf_session_model->remove_item_data($wcuf_upload_unique_name, $is_order_detail_page, $extra_options);
		}
		wp_die();
	}
	function ajax_delete_single_file_from_order()
	{
		global $wcuf_order_model;
		$single_file_id = isset($_POST['id']) ? $_POST['id'] : null;
		$order_id = isset($_POST['order_id']) ? $_POST['order_id'] : null;
		$field_id = isset($_POST['field_id']) && $_POST['field_id'] >= 0 ? $_POST['field_id'] : null;
		if($single_file_id != null && $order_id != null && $field_id != null)
		{
			$wcuf_order_model->remove_single_file_form_order_uploaded_data($order_id, $field_id, $single_file_id);
		}
		wp_die();
	}
	function ajax_delete_single_file_from_session()
	{
		global $wcuf_session_model;
		$single_file_id = isset($_POST['id']) ? $_POST['id'] : null;
		$field_id = isset($_POST['field_id']) && $_POST['field_id'] >= 0 ? $_POST['field_id'] : null;
		$extra_options = array("skip_delete_file" => wcuf_get_value_if_set($_POST, 'tm_extra_product_edit',false)  == 'true');
		if($single_file_id != null && $field_id != null)
		{
			$wcuf_session_model->remove_upload_field_subitem($field_id, $single_file_id, $extra_options);
		}
		wp_die();
	}
	//Called when on Order details / Thank you page upload are saved
	function ajax_save_file_uploaded_from_order_detail_page()
	{
		global $wcuf_option_model, $wcuf_session_model,$wcuf_upload_field_model, $wcuf_option_model;
		$temp_uploads = $wcuf_session_model->get_item_data(null,null,true);
		if(!isset($_POST) || $_POST['order_id'] == 0)
			return;
		
		$order_id = $_POST['order_id'];
		
		if(!empty($temp_uploads))
		{
			$order = wc_get_order($order_id);
			
			if($order->get_user_id() && $order->get_user_id() != get_current_user_id())
				wp_die();
			
			$status_change_options = $wcuf_option_model->get_order_status_change_options();
			$file_fields_groups =  $wcuf_option_model->get_fields_meta_data();
			$file_order_metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id); //$wcuf_option_model->get_order_uploaded_files_meta_data($order_id);
			$file_order_metadata = $this->upload_files($order, $file_order_metadata, $file_fields_groups, $temp_uploads);
			
					
			if($status_change_options["order_details_page_change_order_status"] != false && 
			   $status_change_options["status_to_assign"] != false && 
			   (empty($status_change_options["current_status_to_consider"]) || in_array($order->get_status(),  $status_change_options["current_status_to_consider"]))
			  )
			{
				$order->set_status($status_change_options["status_to_assign"]);
				$order->save();
			}
		}
		$wcuf_session_model->remove_item_data(null, true);
		wp_die();
	}
	function is_saving_on_session()
	{
		if($this->saving_on_session)
			return true;
		
		if(isset($_POST['action']) && ($_POST['action'] == 'wcuf_file_chunk_upload' || 
									   $_POST['action'] == 'upload_file_during_checkout_or_product_page' || 
									   $_POST['action'] == 'save_uploaded_files_on_order_detail_page' || 
									   $_POST['action'] == 'reload_upload_fields' || 
									   $_POST['action'] == 'upload_file_on_order_detail_page'))
									   {
										  return true;
									   }
		
		return false;
	}
	function ajax_upload_file_on_order_detail_page()
	{
		$this->saving_on_session = true;
		$this->ajax_save_file_on_session(true);
	}
	private function any_upload_error_due_to_bad_server_paramenter()
	{
		if(empty($_FILES)  && isset($_SERVER['REQUEST_METHOD']) && strtolower($_SERVER['REQUEST_METHOD']) == 'post')
		{ 
			return true;
		}
		return false;
	}
	function check_if_there_was_uploading_errors()
	{
		if(empty($_FILES) && isset($_POST['action']) && $_POST['action'] == 'upload_file_on_order_detail_page')
		{
			include WCUF_PLUGIN_ABS_PATH.'/template/upload_error_due_to_bad_server_php_settings.php';
			wp_die();
		}
	}
	function ajax_manage_file_chunk_upload()
	{
		global $wcuf_session_model ;
		
		if(!isset($_POST['wcuf_upload_field_name']) || !isset($_FILES['wcuf_file_chunk']) || !wp_verify_nonce( wcuf_get_value_if_set($_POST, 'wcuf_security', ""), 'wcuf_security_upload' ))
			wp_die();
		
		$this->saving_on_session = true;
		$buffer = 5242880; //1048576; //1mb
		$target_path = $this->get_temp_dir_path();
		$tmp_name = $_FILES['wcuf_file_chunk']['tmp_name'];
		$size = $_FILES['wcuf_file_chunk']['size'];
		$current_chunk_num = $_POST['wcuf_current_chunk_num'];
		//validation
		$file_name = str_replace($this->to_remove_from_file_name, "",$_POST['wcuf_file_name']);
		$session_id =  str_replace($this->to_remove_from_file_name, "", $_POST['wcuf_current_upload_session_id']);
		$upload_field_name = str_replace($this->to_remove_from_file_name, "", $_POST['wcuf_upload_field_name']);
		
		if($file_name != $_POST['wcuf_file_name'] || $session_id != $_POST['wcuf_current_upload_session_id'] || $upload_field_name != $_POST['wcuf_upload_field_name'])
			wp_die();
		
		
		$validate = wp_check_filetype( $file_name );
		if ( $validate['type'] == false || $file_name != $_POST['wcuf_file_name']) 
		{
			wcuf_write_log(__("File type is not allowed, Validation error:", "woocommerce-files-upload"));
			wcuf_write_log($validate);
			wp_die(__("File type is not allowed.", "woocommerce-files-upload"));
		}
		
		//
		$tmp_file_name = $session_id."_".$file_name;
		$wcuf_is_last_chunk = $_POST['wcuf_is_last_chunk'] == 'true' ? true : false;
	
		$com = fopen($target_path.$tmp_file_name, "ab");
		$in = fopen($tmp_name, "rb");
			if ( $in ) 
				while ( $buff = fread( $in, $buffer ) ) 
				   fwrite($com, $buff);
				 
			fclose($in);
		fclose($com);
		
		if($wcuf_is_last_chunk && file_exists($target_path.$tmp_file_name))
		{
			$validate = wp_check_filetype_and_ext($target_path.$tmp_file_name, $_POST['wcuf_file_name'] );
			$real_filename = $validate['proper_filename'] !== false ? $validate['proper_filename'] : $_POST['wcuf_file_name'];
		
			if( $validate['type'] == false)
			{
				unlink($target_path.$tmp_file_name);
				wcuf_write_log(__("Final upload check: file not allowed. Deleting it. Validation errors: ", "woocommerce-files-upload"));
				wcuf_write_log($validate);
				wp_die();
			}
			//Further check, if the file passed the wp_check(), the plugin still checks if any unwanted character is present in the original and sanatized name
			foreach($this->to_remove_from_file_name as $needle)
			{
				$pos = strpos($real_filename, $needle);
				$pos2 = strpos($file_name, $needle); 
				//if in both names (the one posted and the one sanatized) there was a bad character, the upload process deletes the file
				if ($pos !== false || $pos2 !== false)  
				{
					unlink($target_path.$tmp_file_name);
					wcuf_write_log(__("Final upload check: file not allowed. Deleting it", "woocommerce-files-upload"));
					wp_die();
				}
			}
				
		}
		wp_die();
	}
	function ajax_update_feedback_text()
	{
		global $wcuf_session_model, $wcuf_upload_field_model;
		
		if(!isset($_POST['unique_key']) || !isset($_POST['is_order_details_page']) )
			wp_die();
			
		$unique_key =  str_replace($this->to_remove_from_file_name, "",$_POST['unique_key']);
		$feedback =  isset($_POST['feedback']) ? str_replace($this->to_remove_from_file_name, "", $_POST['feedback']) : "";
		$is_oder_details_page =  $_POST['is_order_details_page'] === 'true';
		
		if(!$is_oder_details_page)
			$wcuf_session_model->update_feedback($unique_key, $feedback);
		else
		{
			if(!isset($_POST['order_id']))
				wp_die();
				
			$order_id =  $_POST['order_id'];
			$metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);
			$metadata[$unique_key]['user_feedback'] = $feedback;
			$wcuf_upload_field_model->save_uploaded_files_meta_data_to_order($order_id, $metadata);
		}
			
		wp_die();
	}
	function ajax_save_file_on_session($is_order_detail_page = false)
	{
		if(!isset($_POST))
		{
			wp_die();
		}
		
		global $wcuf_session_model,$wcuf_cart_model, $wcuf_media_model;
		
		/*Format 
		//$_POST
		array(1) {
			  ["action"]=>
			  string(27) "upload_file_during_checkout"
			   ["title"]=>
			  string(16) "test (Product 1)"
			  ["detect_pdf"]=>
				string(5) "false"
			  ["user_feedback"]=>
			  string(9) "undefined"
			  ["order_id"]=>
			  string(1) "0"
			  ["wcuf_wpml_language"]=>
			  string(4) "none"
			  ["multiple"]=>
			  string(3) "yes"
			  ["quantity_0"]=>
			  string(1) "1"
			  ["quantity_1"]=>
			  string(1) "1"
			}
		//$_FILES
		array(1) {
		  ["wcufuploadedfile_58"]=>
		  array(5) {
			["name"]=>
			string(15) "Snake_River.jpg"
			["type"]=>
			string(10) "image/jpeg"
			["tmp_name"]=>
			string(26) "/var/zpanel/temp/php7XJBgQ"
			["error"]=>
			int(0)
			["size"]=>
			int(5245329)
		  }
			}
		*/
		$unique_key = "";
		$num_files = 0;
		$upload_field_name = $_POST['title'];
		$getID3 = new getID3();
		$ID3_info = array();
		
		$filename = array();
		$file_names = array();
		$file_quantity = array();
		$number_of_pages = array();
		$is_pdf = array();
		
		$wcuf_upload_unique_name =  str_replace($this->to_remove_from_file_name, "",$_POST['upload_field_name']);
		$chunked_file_path = $this->get_temp_dir_path(). str_replace($this->to_remove_from_file_name, "",$_POST['file_session_id']."_".$_POST['file_name']);
		if(!file_exists($chunked_file_path)) //For example, deleted by  the validation process during the chunkupload
			wp_die();
			
		$data = array('tmp_name' => $chunked_file_path, 'name' =>$_POST['file_name'], 'type' => $this->mime_content_type($chunked_file_path));
		
		
		//new zip file managment
		$filename[] = $data['tmp_name'];
		//end new
		if($unique_key == "")
			$unique_key = $wcuf_upload_unique_name;
		$file_names[$num_files] =  $data['name'];
		$curr_quantity = isset($_POST['quantity_'.$num_files]) ? $_POST['quantity_'.$num_files] : 1;
		$detect_pdf = isset($_POST['detect_pdf']) && $data['type'] == 'application/pdf' ? $_POST['detect_pdf'] : 'false';
		$disable_cart_quantity_as_num_of_files = isset($_POST['disable_cart_quantity_as_num_of_files']) ? $_POST['disable_cart_quantity_as_num_of_files'] : 'false';
		$detected_number_of_pages = /* $detect_pdf == 'true' ? */ $wcuf_media_model->pdf_count_pages($data['tmp_name'])/*  : 1 */;
		$file_quantity[$num_files] =  $detect_pdf == 'true' ?  $detected_number_of_pages : $curr_quantity;
		
		$number_of_pages[$num_files] = $detected_number_of_pages;
		$is_pdf[$num_files] = $detect_pdf == 'true';
		//ID3 Info
		try{
			$file_id3 = $getID3->analyze($data['tmp_name']);
			//playtime_seconds
			//playtime_string
			
			if( (isset($file_id3['video']) || isset($file_id3['audio'])) && isset($file_id3['playtime_string']) )
				$ID3_info[$num_files] = array( 'file_name' => $data['name'],
									'index' => $num_files,
									'quantity' => $file_quantity[$num_files] ,
									'type' => isset($file_id3['video']) ? 'video' : 'audio',
									'playtime_seconds' => isset($file_id3['playtime_seconds']) ? $file_id3['playtime_seconds'] : 'none',
									'playtime_string' => isset($file_id3['playtime_string']) ? $file_id3['playtime_string'] : 'none');		
		}catch(Exception $e){}
		$num_files++;
		
		$data = array('upload_field_id'=> $unique_key, 
					  'tmp_name' => $filename, 
					  'name'=>$file_names, 
					  'quantity' => $file_quantity,
					  'number_of_pages' => $number_of_pages, 
					  'is_pdf' => $is_pdf, 
					  'disable_cart_quantity_as_num_of_files' => $disable_cart_quantity_as_num_of_files,
					  'crop_metadata' => [json_decode(stripslashes(wcuf_get_value_if_set($_POST, 'crop_metadata', "")), true)]
					 /*  No need to pass approval data via ajax, they will be computed according to current settings
					  'enable_approval' => wcuf_get_value_if_set($_POST, 'enable_approval', "false"),
					  'disable_approval_per_single_file' => wcuf_get_value_if_set($_POST, 'disable_approval_per_single_file', "false") */
					  );	
					  
		$data = apply_filters('wcuf_saving_session_data_after_upload', $data, $_POST);
		$wcuf_session_model->set_item_data($unique_key, $data, false, $is_order_detail_page, $num_files, $ID3_info);
		
		wp_die();
	}
	public function get_product_ids_and_field_id_by_file_id($temp_upload_id)
	{
		global $wcuf_upload_field_model;
		list($fieldname, $field_id_and_product_id) = explode("_", $temp_upload_id );
		$ids = explode("-", $field_id_and_product_id ); //0 => $field_id, 1 => $product_id, 2 => $variation_id, 3 => file title hash (only if 2 exists)
													    //													    3 can be the wcuf_unique id (it will have a prefix "idsai"). If so 2 always exists (it will be 0 for no variable products)
		 
		$variant_id = isset($ids[3]) || (isset($ids[2]) && is_numeric($ids[2])) ? $ids[2] : 0;
		$unique_product_name_hash = isset($ids[3]) ? $ids[3] : "";
		if(isset($ids[2]) && !is_numeric($ids[2]))
			$unique_product_name_hash = $ids[2];
		$is_sold_individually =  $wcuf_upload_field_model->is_individual_id_string($unique_product_name_hash);
		$unique_product_name_hash = $is_sold_individually ?  $wcuf_upload_field_model->get_individual_id_from_string($unique_product_name_hash) : $is_sold_individually;
																														//This can be the hash for WC Product measure products or the Unique id in case products are sold as "individual" (in this case it will have "idsai" prefix)
		return array('field_id' => $ids[0], 'product_id' => isset($ids[1]) ? $ids[1] : null, 'variant_id'=>$variant_id, 'unique_product_id'=>$unique_product_name_hash, 'fieldname'=>$fieldname, 'is_sold_individually' => $is_sold_individually);
	}
	private function mime_content_type($filename) 
	{
		$type = wp_check_filetype($filename);
		
		return $type['type'];
	}
	public function get_temp_url()
	{
		$upload_dir = wp_upload_dir();
		return $upload_dir['baseurl']."/wcuf/tmp/";
	}
	public function get_temp_dir_path($order_id = null, $baseurl = false)
	{
		$upload_dir = wp_upload_dir();
		$temp_dir = !$baseurl ? $upload_dir['basedir']. '/wcuf/' : $upload_dir['baseurl']. '/wcuf/';
		$temp_dir .= isset($order_id) && $order_id !=0 ? $order_id.'/': 'tmp/';
		
		if(!$baseurl)
		{
			if (!file_exists($temp_dir)) 
					@mkdir($temp_dir, 0775, true);
			
			if( !file_exists ($temp_dir.'index.html'))
				//touch ($temp_dir.'index.html');
				$this->create_empty_file  ($temp_dir.'index.html');
		}
		return $temp_dir;
	}
	public function wcuf_override_upload_directory( $dir ) 
	{ 
		global $wcuf_order_model;
		return array(
			'path'   => $dir['basedir'] . '/wcuf/'.$wcuf_order_model->get_order_number_folder_name($this->current_order),
			'url'    => $dir['baseurl'] . '/wcuf/'.$wcuf_order_model->get_order_number_folder_name($this->current_order),
			'subdir' => '/wcuf/'.$wcuf_order_model->get_order_number_folder_name($this->current_order),
		) + $dir;
	}
	public function generate_unique_file_name($dir, $name)
	{
		global $wcuf_option_model;
		$ext = pathinfo($name, PATHINFO_EXTENSION);
		$file_name = pathinfo($name, PATHINFO_FILENAME);
		
		$random_name = $file_name."_".rand(0,100000).".".$ext;
		return  $wcuf_option_model->remove_file_name_prefix() == 'no' || $name == $this->file_zip_name ? $random_name : $name;
	}
	public function get_random_chunk_name()
	{
		$file_name = rand(0,100000);
		$dir = $this->get_chuck_upload_directory();
		
		while(!file_exists ($dir.$file_name))
			$file_name = rand(0,100000);
		
		return $file_name;
	}
	public function normalizeStringForFolderName ($str = '')
	{
		$str = strip_tags($str); 
		$str = preg_replace('/[\r\n\t ]+/', ' ', $str);
		$str = preg_replace('/[\"\*\/\:\<\>\?\'\|]+/', ' ', $str);
		$str = strtolower($str);
		$str = html_entity_decode( $str, ENT_QUOTES, "utf-8" );
		$str = htmlentities($str, ENT_QUOTES, "utf-8");
		$str = preg_replace("/(&)([a-z])([a-z]+;)/i", '$2', $str);
		$str = str_replace(' ', '-', $str);
		$str = rawurlencode($str);
		$str = str_replace('%', '-', $str);
		return $str;
	}
	public function manage_access_to_order_folder($order_id, $deny_access = true)
	{
		$upload_dir = wp_upload_dir();
		$upload_complete_dir = $upload_dir['basedir']. '/wcuf/'.$order_id.'/';
		if (!file_exists($upload_complete_dir)) //It means that is used a cloud service
				return;
			
		$htaccess = $upload_complete_dir.".htaccess";
		if($deny_access)
		{
			if(!file_exists($htaccess));
			{
				$f = fopen($htaccess, "a+");
				if(!$f)
					return;
				fwrite($f, "Deny from all");
				fclose($f);
			}
		}
		else 
		{
			if(file_exists($htaccess));
				@unlink ( $htaccess);
		}
	}
	public function upload_files($order,$file_order_metadata, $options, $temp_uploaded = null)
	{
		global $wcuf_option_model, $wcuf_upload_field_model, $wcuf_session_model, $wcuf_order_model, $wcuf_ftp_model, $wcuf_dropbox_model;
		$order_id = $wcuf_order_model->get_order_id($order) ;	
		$order_number_path = $wcuf_order_model->get_order_number_folder_name($order) ;	
		
		if(isset($_FILES) && isset($temp_uploaded)) //???????????????????
			$files_array = array_merge($_FILES, $temp_uploaded );
		else
			$files_array = isset($temp_uploaded) ? $temp_uploaded : $_FILES; //$temp_uploaded is the only used
	  
		 $upload_dir = wp_upload_dir();
		if (!file_exists($upload_dir['basedir']."/wcuf")) 
				mkdir($upload_dir['basedir']."/wcuf", 0775, true);
			
		 $links_to_notify_via_mail = array();
		 $links_to_attach_to_mail = array();
		 foreach($files_array as $fieldname_id => $file_data)
		 {
			list($fieldname, $id) = explode("_", $fieldname_id );
			$upload_field_ids = $this->get_product_ids_and_field_id_by_file_id($fieldname_id);
			$product_id_folder_name = isset($upload_field_ids['product_id']) ? $upload_field_ids['product_id']."-".$upload_field_ids['variant_id'] : "";
			
			if($upload_field_ids['is_sold_individually'])
				  $product_id_folder_name .= $product_id_folder_name != "" ? "-".$upload_field_ids['unique_product_id'] : $upload_field_ids['unique_product_id'];
			 
			$product_id_folder_name = apply_filters('wcuf_order_sub_folder_name', 
									  $product_id_folder_name, 
									  $upload_field_ids['product_id'], 
									  $upload_field_ids['variant_id'], 
									  $upload_field_ids['is_sold_individually'] ? $upload_field_ids['unique_product_id'] : false,
									  $order);		 
			//multiple file managment 
			$is_multiple_file_upload = isset($file_data['is_multiple_file_upload']) ? $file_data['is_multiple_file_upload'] : false; 
			$files_name = is_array($file_data["name"]) ? $file_data["name"] : array($file_data["name"]); //Double check, it would be no necessary
			$files_path = is_array($file_data["tmp_name"]) ? $file_data["tmp_name"] : array($file_data["tmp_name"]); //Double check, it would be no necessary
			 
			$movefiles = array();
			foreach($files_name as $file_name_counter => $file_name)
			{
			   if($file_name != '' && file_exists($files_path[$file_name_counter]))
				{
					$validate = wp_check_filetype( $file_name );
					if ( $validate['type'] == false ) 
							continue;
						
					$this->current_order = $order;
					$file_name 				= apply_filters('wcuf_file_name', $this->generate_unique_file_name('none', $file_name), $file_data, $file_name_counter, $upload_field_ids, $order_id);
					$folder_root_path		= '/wcuf/'.$order_number_path;
					$folder_path_new 		= $product_id_folder_name != "" ? 	$folder_root_path.'/'. $product_id_folder_name : $folder_root_path;
					$folder_path_new 		= apply_filters('wcuf_folder_path', $folder_path_new, $order_id, $product_id_folder_name );
					$file_path_new 			= $folder_path_new.'/'.$file_name;
					
					/* No need. The folder creation is recursive, see the next statement
					if (!file_exists($upload_dir['basedir']."/wcuf/".$order_number_path)) 
						mkdir($upload_dir['basedir']."/wcuf/".$order_number_path, 0775, true); */
					
					if (!file_exists($upload_dir['basedir'].$folder_path_new)) 
						mkdir($upload_dir['basedir'].$folder_path_new, 0775, true);
					
					$tmp_subfolder 		= explode("/",$folder_path_new);
					$tmp_subfolder_root = "";
					foreach($tmp_subfolder as $tmp_index => $tmp_value)
						if( file_exists ($upload_dir['basedir'].$tmp_subfolder_root.$tmp_value))
						{
							$this->create_empty_file ($upload_dir['basedir'].$tmp_subfolder_root.$tmp_value.'/index.html');
							$tmp_subfolder_root .= $tmp_value."/";
						}
					
					/* if( !file_exists ($upload_dir['basedir'].$folder_root_path.'/index.html'))
						$this->create_empty_file  ($upload_dir['basedir'].$folder_root_path.'/index.html'); */
					
					@rename($files_path[$file_name_counter], $upload_dir['basedir'] . $file_path_new ); //copies file to final destination
					$movefiles[$file_name_counter] = array('file'=> $upload_dir['basedir'] . $file_path_new ,
										'url' => $upload_dir['baseurl'] . $file_path_new ,
										'name' => $file_name,
										'product_id_folder_name'=> $product_id_folder_name );
										
					foreach((array)$file_data['ID3_info'] as $id3_key => $id3_info)
						if(isset($id3_info['index']) && $id3_info['index'] == $file_name_counter)
							$file_data['ID3_info'][$id3_key]['file_name_unique'] = $file_name;
					
					
					if( !file_exists ($upload_dir['basedir'].'/wcuf/index.html'))
						$this->create_empty_file  ($upload_dir['basedir'].'/wcuf/index.html');
					
					do_action('wcuf_upload_completed', $movefiles[$file_name_counter]['file'], $upload_field_ids, $order_id);
				} 
			}
			$cloud_settings = $wcuf_option_model->get_cloud_settings();	
			
			foreach($movefiles as $key => $movefile)
				if ( $movefile && !isset( $movefile['error'] ) ) 
				{
					$file_data = apply_filters('wcuf_before_copying_file_to_final_destination', $file_data, $movefile, $key, $order_id, $movefile['product_id_folder_name'] == "" ? '/'.$order_number_path."/" : '/'.$order_number_path."/".$movefile['product_id_folder_name']."/");
					
					//FTP
					if($cloud_settings['cloud_storage_service'] == 'ftp')
					{
						$folder_ids_path = $movefile['product_id_folder_name'] == "" ? '/'.$order_number_path."/" : '/'.$order_number_path."/".$movefile['product_id_folder_name']."/";
						$ftp_upload_result = $wcuf_ftp_model->upload_file($movefile['file'], $folder_ids_path. $movefile['name']);
						if($ftp_upload_result === false)
						{
							$movefiles[$key]['cloud_storage_service'] = 'local';
							$notification_email = new WCUF_Email();
							$notification_email->send_error_email_to_admin(wcuf_html_escape_allowing_special_tags(sprintf(___("During the file(s) upload process on FTP, your server was unable to connect to remote server for file: %s<br><br><strong>DON'T WORRY!</strong> files have been stored in the local <i>wp-content/wcuf</i> folder :)<br>You can normally manage the uploaded file(s) via the admin <a href='%s'>order edit page</a>.", 'woocommerce-files-upload'), $movefile['file'], get_edit_post_link($order_id) ), false)); 
						}
						else
						{
							$movefiles[$key]['file'] = $ftp_upload_result['path'];
							$movefiles[$key]['url'] = $ftp_upload_result['path'];
							$movefiles[$key]['cloud_storage_service'] = 'ftp';
						}
						
					}
					//Google Drive
					else if($cloud_settings['cloud_storage_service'] == 'gdrive')
					{
						try
						{
							if(!isset($gDrive))
								$gDrive = wcuf_init_gdrive();
							
							@set_time_limit(3000);
							$folder_ids_path = $movefile['product_id_folder_name'] == "" ? '/'.$order_number_path."/" : '/'.$order_number_path."/".$movefile['product_id_folder_name']."/";
							$folder_ids_path = apply_filters('wcuf_googledrive_folder_path', $folder_ids_path, $order_id, $movefile['product_id_folder_name'] == "" ? "" : $movefile['product_id_folder_name'], $file_data, $key);
							$result = $gDrive->upload_file($movefile['file'], $movefile['name'], $folder_ids_path);
							$gDrive_upload_error = empty($result) ? true : false;
							
						}
						catch(Error $e)
						{
							wcuf_write_log("Google drive - Error"); 
							wcuf_write_log($e->getMessage()); 
							wcuf_write_log($e->getTrace()); 
							$notification_email = new WCUF_Email();
							$notification_email->send_error_email_to_admin(wcuf_html_escape_allowing_special_tags(sprintf(__("During the connection to the Google Drive service.<br><br>Please check the <strong>Auth data</strong>.<br><br>Error for file:%s<br><br><strong>DON'T WORRY!</strong> files have been stored in the local <i>wp-content/wcuf</i> folder :)<br>You can normally manage the uploaded file(s) via the admin <a href='%s'>order edit page</a>.", 'woocommerce-files-upload'), $movefile['file'], get_edit_post_link($order_id) ),false)); 
							$gDrive_upload_error = true;
						}
						finally
						{
							
						}
						 if(!$gDrive_upload_error)
						{
							$this->delete_local_file($movefile['file']);
							$movefiles[$key]['file'] = WCUF_GDrive::$gdrive_filepath_prefix.$result->id; //used for image preview and delete the file
							$movefiles[$key]['url'] = "https://drive.google.com/open?id=".$result->id;
							$movefiles[$key]['cloud_storage_service'] = 'gdrive';
						}
						else 
							$movefiles[$key]['cloud_storage_service'] = 'local'; 
						
					}
					//Amazon S3
					else if($cloud_settings['cloud_storage_service'] == 's3')
					{
						try
						{
							if(!isset($s3))
								$s3 = wcuf_init_s3();
							
							@set_time_limit(3000);
							$folder_ids_path = $movefile['product_id_folder_name'] == "" ? '/'.$order_number_path."/" : '/'.$order_number_path."/".$movefile['product_id_folder_name']."/";
							$folder_ids_path = apply_filters('wcuf_s3_folder_path', $folder_ids_path, $order_id, $movefile['product_id_folder_name'] == "" ? "" : $movefile['product_id_folder_name'], $file_data, $key);
							$result = $s3->upload_file($movefile['file'], ['key' => $folder_ids_path]);
							$s3_upload_error = empty($result) ? true : false;
						}
						catch(Error $e)
						{
							wcuf_write_log("Amazon S3 - Exception"); 
							wcuf_write_log($e->getMessage()); 
							$s3_upload_error = true;
							
							
							$notification_email = new WCUF_Email();
							$notification_email->send_error_email_to_admin(wcuf_html_escape_allowing_special_tags(sprintf(__("During the connection to the S3 service.<br><br>Please check the <strong>Access key id</strong>, the <strong>Secret access key id</strong> and the <strong>Bucket region</strong><br><br>Error for file:%s<br><br><strong>DON'T WORRY!</strong> files have been stored in the local <i>wp-content/wcuf</i> folder :)<br>You can normally manage the uploaded file(s) via the admin <a href='%s'>order edit page</a>.", 'woocommerce-files-upload'), $movefile['file'], get_edit_post_link($order_id) ), false)); 
							$s3_upload_error = true;
						}
						finally 
						{
							 
						}
						
						if(!$s3_upload_error)
						{
							$this->delete_local_file($movefile['file']);
							$movefiles[$key]['file'] = WCUF_S3::$s3_filepath_prefix.$result['Key']; //used for image preview and delete the file
							$movefiles[$key]['url'] = get_site_url()."?s3_get_item=".$result['Key']; //Direct URL: $result['ObjectURL'];
							$movefiles[$key]['cloud_storage_service'] = 's3';
						}
						else 
							$movefiles[$key]['cloud_storage_service'] = 'local';
						
					}
					//DropBox
					else if($cloud_settings['cloud_storage_service'] == 'dropbox') //locally || dropbox
					{
						$dropbox_upload_error = false;
						try
						{
							if(!$wcuf_dropbox_model)
								$wcuf_dropbox_model = wcuf_init_dropbox();
							
							$dropbox = $wcuf_dropbox_model;
							
							@set_time_limit(3000);
							$dropbox_file_name = $movefile['name'];
							$folder_ids_path = $movefile['product_id_folder_name'] == "" ? '/'.$order_number_path."/" : '/'.$order_number_path."/".$movefile['product_id_folder_name']."/";
							$folder_ids_path = apply_filters('wcuf_dropbox_folder_path', $folder_ids_path, $order_id, $movefile['product_id_folder_name'] == "" ? "" : $movefile['product_id_folder_name'], $file_data, $key);
							
							$file_metadata = $dropbox->upload_file($movefile['file'], $folder_ids_path.$dropbox_file_name);
							$dropbox_upload_error = empty($file_metadata) ? true : false;
						}
						catch(Exception $e)
						{
							$notification_email = new WCUF_Email();
							$notification_email->send_error_email_to_admin(wcuf_html_escape_allowing_special_tags(sprintf(__("During the file(s) upload process on Dropbox, the plugin got this error:<br><br>%s<br><br>For file:%s<br><br><strong>DON'T WORRY!</strong> files have been stored in the local <i>wp-content/wcuf</i> folder :)<br>You can normally manage the uploaded file(s) via the admin <a href='%s'>order edit page</a>.", 'woocommerce-files-upload'), $e->getMessage(), $movefile['file'], get_edit_post_link($order_id) ), false)); 
							$dropbox_upload_error = true;
						}
						if(!$dropbox_upload_error)
						{
							$this->delete_local_file($movefile['file']);
							$movefiles[$key]['file'] = WCUF_DropBox::$dropbox_filepath_prefix.$file_metadata['path_lower']; //used for image preview and delete the file
							$movefiles[$key]['url'] = get_site_url()."?dropbox_get_item_link=".urlencode($file_metadata['path_lower']);
							$movefiles[$key]['cloud_storage_service'] = 'dropbox';
						}
						else 
							$movefiles[$key]['cloud_storage_service'] = 'local';
					}
					//End DropBox
				}
						
				$posted_user_feedback = isset($_POST['wcuf'][$id]['user_feedback']) ? $_POST['wcuf'][$id]['user_feedback'] : "";
				
				//file ref
				foreach($movefiles as $file_index => $movefile)
				{
					//new method 
					$file_data['absolute_path'][$file_index] = $movefile['file'];
					$file_data['url'][$file_index] = $movefile['url']; 
					$file_data['original_filename'][$file_index] = $movefile['name'];
					$file_data['source'][$file_index] = isset($movefile['cloud_storage_service']) ? $movefile['cloud_storage_service'] : 'local';
				}
				$file_data = apply_filters('wcuf_before_saving_uploaded_files_metadata_on_order_metadata', $file_data);
				$file_order_metadata[$id]['id'] = $id;
				$file_order_metadata[$id]['title'] = !isset($_POST['wcuf'][$id]['title']) ? $file_data['title'] : $_POST['wcuf'][$id]['title'];
				$file_order_metadata[$id] = $wcuf_session_model->merge_item_data_arrays($file_order_metadata[$id], $file_data, true);
				
				$original_option_id = $id;
				$needle = strpos($original_option_id , "-");
				if($needle !== false)
					$original_option_id = substr($original_option_id, 0, $needle);
				foreach($options as $option)
				{
					if($option['id'] == $original_option_id && $option['notify_admin'] )
					{
						$recipients = $option['notifications_recipients'] != "" ? $option['notifications_recipients'] : get_option( 'admin_email' );
						if(!isset($links_to_notify_via_mail[$recipients]))
							$links_to_notify_via_mail[$recipients] = array('file_info' => array(), 'order_meta'=>$file_order_metadata[$id]);
						
						$file_urls = $wcuf_upload_field_model->get_secure_urls($order_id, $id, $file_order_metadata);
						array_push($links_to_notify_via_mail[$recipients]['file_info'], array('title' => $file_order_metadata[$id]['title'], 
																				 'file_name' => $file_order_metadata[$id]['original_filename'], 
																				 'url'=> $file_urls, 
																				 'source' => $file_order_metadata[$id]['source'], 
																				 'feedback' => $file_order_metadata[$id]['user_feedback'], 
																				 'quantity' => $file_order_metadata[$id]['quantity']));
					
						if($option['notify_attach_to_admin_email'])
						{
							if(!isset($links_to_attach_to_mail[$recipients]))
								$links_to_attach_to_mail[$recipients] = array();
							
							array_push($links_to_attach_to_mail[$recipients], array('paths' => $file_order_metadata[$id]['absolute_path'], 
																					'sources' => $file_order_metadata[$id]['source']));
						}						
					}
				}
		 }
		 //Notification via mail
		if(count($links_to_notify_via_mail) > 0)
		{
			global $wcuf_wpml_helper;
			$wcuf_wpml_helper->switch_to_admin_default_lang();
			$this->email_sender = new WCUF_Email();
			$this->email_sender->trigger($links_to_notify_via_mail, $order, $links_to_attach_to_mail );	
			$wcuf_wpml_helper->restore_from_admin_default_lang();
		}
		//Save upload fields data
		$wcuf_upload_field_model->save_uploaded_files_meta_data_to_order($order_id, $file_order_metadata);
		do_action( 'wcuf_upload_process_completed' , $order_id);
		return $file_order_metadata;
	}
	//NO LONGER USED
	public function upload_and_decode_files($order,$file_order_metadata, $options)
	{
		global $wcuf_upload_field_model;
		$order_id = $order->id ;	
		 $links_to_notify_via_mail = array();
		 $links_to_attach_to_mail = array();
		 foreach($_POST['wcuf-encoded-file'] as $id => $file_data)
		 {
			$this->current_order = $order;
			
			//decode data
			$upload_dir = wp_upload_dir();
			$upload_complete_dir = $upload_dir['basedir']. '/wcuf/'.$order->id.'/';
			if (!file_exists($upload_complete_dir)) 
					mkdir($upload_complete_dir, 0775, true);
				
			$unique_file_name = $this->generate_unique_file_name(null, $_POST['wcuf'][$id]['file_name']);
			$ifp = fopen($upload_complete_dir.$unique_file_name, "w"); 
			fwrite($ifp, base64_decode($file_data)); 
			fclose($ifp); 
		
			if( !file_exists ($upload_dir['basedir'].'/wcuf/index.html'))
				$this->create_empty_file  ($upload_dir['basedir'].'/wcuf/index.html');
				
			
			if( !file_exists ($upload_dir['basedir'].'/wcuf/'.$order_id.'/index.html'))
				$this->create_empty_file  ($upload_dir['basedir'].'/wcuf/'.$order_id.'/index.html');
			
			$file_order_metadata[$id]['absolute_path'] = $upload_complete_dir.$unique_file_name;
			$file_order_metadata[$id]['url'] = $upload_dir['baseurl'].'/wcuf/'.$order->id.'/'.$unique_file_name;
			$file_order_metadata[$id]['title'] = $_POST['wcuf'][$id]['title'];
			$file_order_metadata[$id]['id'] = $id;
			$original_option_id = $id;
			$needle = strpos($original_option_id , "-");
			if($needle !== false)
				$original_option_id = substr($original_option_id, 0, $needle);
			foreach($options as $option)
			{
				if($option['id'] == $original_option_id && $option['notify_admin'] )
				{
					$recipients = $option['notifications_recipients'] != "" ? $option['notifications_recipients'] : get_option( 'admin_email' );
					if(!isset($links_to_notify_via_mail[$recipients]))
						$links_to_notify_via_mail[$recipients] = array('file_info' => array(), 'order_meta'=>$file_order_metadata[$id]);
					
					array_push($links_to_notify_via_mail[$recipients]['file_info'], array('title' => $file_order_metadata[$id]['title'], 
																			  'url'=> $file_order_metadata[$id]['url'], 
																			  'quantity' => $file_order_metadata[$id]['quantity'],
																			  'id' => $id,
																			  'all_meta' =>$file_order_metadata[$id]));
				
					if($option['notify_attach_to_admin_email'])
					{
						if(!isset($links_to_attach_to_mail[$recipients]))
							$links_to_attach_to_mail[$recipients] = array();
						array_push($links_to_attach_to_mail[$recipients], $file_order_metadata[$id]['absolute_path'] );
					}
				}
			}
				 
			
		 }
		 //Notification via mail
		if(count($links_to_notify_via_mail) > 0)
		{
			$this->email_sender = new WCUF_Email();
			$this->email_sender->trigger($links_to_notify_via_mail, $order, $links_to_attach_to_mail );	
		}
		$wcuf_upload_field_model->save_uploaded_files_meta_data_to_order($order_id, $file_order_metadata);
		return $file_order_metadata;
	}
	public function create_tmp_file_data_from_order($order_meta)
	{
		$new_meta = array();
		foreach($order_meta as $key => $upload_field_meta)
		{
			$tmp_files = array();
			foreach($upload_field_meta['original_filename'] as $index => $original_filename)
			{
				$target_path = $this->get_temp_dir_path();
				$tmp_file_path = $target_path.$original_filename;
				copy($upload_field_meta['url'][$index], $tmp_file_path);
				$tmp_files[$index] = $tmp_file_path;
			}
			
			$results = $this->move_temp_file($tmp_files);
			
			$order_meta[$key]['tmp_name'] = array();
			$order_meta[$key]['file_temp_name'] = array();
			$order_meta[$key]['name'] = array();
			foreach($results as $index => $result)
			{
				$order_meta[$key]['tmp_name'][$index] = $result['absolute_path'];
				$order_meta[$key]['file_temp_name'][$index] = $result['file_temp_name'];
				$order_meta[$key]['name'][$index] = basename($result['absolute_path']);
			}
			
			//unuseful
			unset($order_meta[$key]['url']);
			unset($order_meta[$key]['original_filename']);
			unset($order_meta[$key]['absolute_path']);
			unset($order_meta[$key]['source']);
			unset($order_meta[$key]['id']);
			
			$new_meta[$order_meta[$key]['upload_field_id']] = $order_meta[$key];
		}
		
		return $new_meta;
	}
	public function move_temp_file($file_tmp_name)
	{
		$absolute_path = array();
		$file_tmp_name = !is_array($file_tmp_name) ? array($file_tmp_name) : $file_tmp_name;
		
		foreach($file_tmp_name as $index => $tmp_file)
		{
			$tmp_file = str_replace($this->to_remove_from_file_name, "", $tmp_file);
			$file_info = pathinfo($tmp_file);
			$ext = isset($file_info['extension']) && $file_info['extension'] != "" ? ".".$file_info['extension'] : "";
			$absolute_path_tmp = $this->create_temp_file_name($ext); 	
			$absolute_path[$index] = $absolute_path_tmp;
			if(move_uploaded_file($tmp_file, $absolute_path_tmp['absolute_path']) == false) //old method: file was moved from tmp server dir to wcuf tmp dir
			{
				if(file_exists($tmp_file))
					rename($tmp_file, $absolute_path_tmp['absolute_path']); //new method valid for chunked file upload
			}
			
		}
		return $absolute_path;
	}
	public function create_temp_file_name($ext = "")
	{
		$upload_dir = wp_upload_dir();
		$temp_dir = $upload_dir['basedir']. '/wcuf/tmp/';
		if (!file_exists($temp_dir)) 
				mkdir($temp_dir, 0775, true);
		if( !file_exists ($temp_dir.'index.html'))
			$this->create_empty_file  ($temp_dir.'index.html');
		
		$file_temp_name = rand(0,9999999).$ext;
		$absolute_path = $temp_dir.$file_temp_name;	
		return array('absolute_path'=>$absolute_path, 'file_temp_name'=>$file_temp_name);
	}
	//Wrong name: this method tmp files (files stored locally before the checkout has been performed) and specific files belonging to an order (order details page)
	public function delete_temp_file($path, $file_order_metadata = null, $field_id = null, $single_file_id = null)
	{
		global $wcuf_dropbox_model;
		$path = is_array($path) ? $path : array($path); //forcing an array but it never an array
		$dropbox = $s3 = $gdrive = null;
		
		foreach($path as $temp_path) //forced array but there is no need anymore
		{
			$remote_type = wcuf_get_remote_type($temp_path);
			if($remote_type == 'dropbox')
			{
				try{
					
					if(!$wcuf_dropbox_model)
						$wcuf_dropbox_model = wcuf_init_dropbox();
				
						$dropbox = $wcuf_dropbox_model;
					
					@$dropbox->delete_file($temp_path, true);
				}catch(Exception $e){};	
				
			}
			else if($remote_type == 's3')
			{
				try{
					if(!isset($s3))
						$s3 = wcuf_init_s3();
					
					$s3->delete_file($temp_path, true);
				}catch(Error $e){wcuf_write_log($e->getMessage());};	
			}
			else if($remote_type == 'gdrive')
			{
				try{
					if(!isset($gdrive))
						$gdrive = wcuf_init_gdrive();
					
					$gdrive->delete_file($temp_path, true);
					//support to custom addon
					$remote_cropped_file = wcuf_get_value_if_set($file_order_metadata, [$field_id, 'crop_remote_file', $single_file_id], false);
					if($remote_cropped_file)
					{
						$gdrive->delete_file($remote_cropped_file, true);
					}
				}catch(Error $e){wcuf_write_log($e->getMessage());};	
			}
			else
			{
				try{
					$this->delete_local_file($temp_path);
				}catch(Exception $e){};		
			}
		}
	}
	//Wrong name: this method deletes all the files of an upload field
	public function delete_file($id, $file_order_metadata, $order_id)
	{
		global $wcuf_upload_field_model, $wcuf_dropbox_model;
		$dropbox = $s3 = null;
		try
		{
			//multiple file managing
			$absolute_paths = is_array($file_order_metadata[$id]['absolute_path']) ? $file_order_metadata[$id]['absolute_path'] : array($file_order_metadata[$id]['absolute_path']);
			
			//DropBox and other remote services managment
			foreach($absolute_paths as $index => $absolute_path)
			{
				$remote_type = wcuf_get_remote_type($absolute_path);
				if($remote_type == 'dropbox')
				{
					if(!$wcuf_dropbox_model)
						$wcuf_dropbox_model = wcuf_init_dropbox();
					
						$dropbox = $wcuf_dropbox_model;
					try 
					{
						@$dropbox->delete_file($absolute_path, true);
					}catch(Exception $e){};
				}
				else if($remote_type == 's3')
				{
					try{
						if(!isset($s3))
							$s3 = wcuf_init_s3();
						
						$s3->delete_file($absolute_path, true);
					}catch(Error $e){wcuf_write_log($e->getMessage()); };	
				}
				else if($remote_type == 'gdrive')
				{
					try{
						if(!isset($gdrive))
							$gdrive = wcuf_init_gdrive();
						
						$gdrive->delete_file($absolute_path, true);
						
						//support to custom addon
						$remote_cropped_file = wcuf_get_value_if_set($file_order_metadata, [$id, 'crop_remote_file', $index], false);
						if($remote_cropped_file)
						{
							$gdrive->delete_file($remote_cropped_file, true);
						}
								
					}catch(Error $e){wcuf_write_log($e->getMessage());};	
				}
				else //local
					$this->delete_local_file($absolute_path);
			}
		}catch(Exception $e){};
		unset($file_order_metadata[$id]);
		$wcuf_upload_field_model->save_uploaded_files_meta_data_to_order($order_id, $file_order_metadata);
		return $file_order_metadata; 
	}	
	//This method is used ONLY to delete local files when moving them to DropBox
	public function delete_local_file($absolute_path)
	{
		global $wcuf_media_model;
		
		try{
			apply_filters('wcuf_before_deleting_local_file', $absolute_path);
			@unlink($absolute_path);
			@unlink($wcuf_media_model->get_preview_path($absolute_path)); //preview
		}catch(Exception $e){wcuf_write_log($e);};
	}
	public function delete_expired_sessions_files($max_time, $last_activity_time, $directory_override_path = "")
	{
		$upload_dir = wp_upload_dir();
		$temp_dir = $directory_override_path ? $directory_override_path."/" : $upload_dir['basedir']. '/wcuf/tmp/';
		if (!file_exists($temp_dir))
			return;
		
		$files = scandir($temp_dir);
		unset($files[array_search('.', $files, true)]);
		unset($files[array_search('..', $files, true)]);
	
		if(is_array($files) && count($files) > 0)
		{
			foreach ($files as $file) 
			{
				$file_time = @filemtime($temp_dir.$file);
				if(is_dir($temp_dir.$file))
				{
					$this->delete_expired_sessions_files($max_time, $last_activity_time,$temp_dir.$file); //there might be additional directories (like the custom "preview")
				}
				if (basename($file) != "index.html" && $file_time < time() - ($last_activity_time + $max_time)) //No need to multiply for 60, it is already done in the Options model. 86400:24h, 14400:4h, 10800:3h, 1800: 30 min 
				{
					try{						
						@unlink($temp_dir.$file);
					}catch(Exception $e){};
				}
			}
		}
	}
	public function start_delete_empty_order_directories()
	{
		$upload_dir = wp_upload_dir();
		$temp_dir = $upload_dir['basedir']. '/wcuf';
		$this->delete_empty_order_directory($temp_dir, true);
	}
	private function delete_empty_order_directory($temp_dir, $is_root = false)
	{
		$files = glob($temp_dir."/*");
		if(is_array($files))
		{
			$total_files = 0;
			foreach ($files as $file)
			{
				if(is_dir($file) && basename($file) == 'tmp')
					continue;
				
				if(is_dir( $file))
				{
					$total_files += $this->delete_empty_order_directory($file);
				}
				else
				{
					$total_files = basename($file) != "index.html" ? $total_files+1 : $total_files;
					
				} 
			}
			
			if($total_files == 0 && !$is_root)
			{
				$this->deleteDirectory($temp_dir);
				return 0;
			}
		}
		return $total_files;
		
	}
	private function deleteDirectory($dir) 
	{
		if (!file_exists($dir)) 
		{
			return true;
		}

		if (!is_dir($dir)) 
		{
			return unlink($dir);
		}

		foreach (scandir($dir) as $item) 
		{
			if ($item == '.' || $item == '..') 
			{
				continue;
			}

			if (!$this->deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) 
			{
				return false;
			}

		}

		return rmdir($dir);
	}
	
	public function delete_all_order_uploads($order_id)
	{
		global $wcuf_upload_field_model, $wcuf_dropbox_model ;
		$order = wc_get_order($order_id);
		$dropbox = $s3 = null;
		if (is_object($order))
		{
			$file_order_metadata = $wcuf_upload_field_model->get_uploaded_files_meta_data_by_order_id($order_id);//get_post_meta($order_id, '_wcst_uploaded_files_meta');
			foreach($file_order_metadata as $file_to_delete)
			{
				try
				{
					//multiple file managing
					$absolute_paths = is_array($file_to_delete['absolute_path']) ? $file_to_delete['absolute_path'] : array($file_to_delete['absolute_path']);
					//DropBox managment
					foreach($absolute_paths as $index => $absolute_path)
					{
						$remote_type = wcuf_get_remote_type($absolute_path);				
						if($remote_type == 'dropbox')
						{
							if(!$wcuf_dropbox_model)
								$wcuf_dropbox_model = wcuf_init_dropbox();
					
								$dropbox = $wcuf_dropbox_model;
							try{
								$dropbox->delete_file($absolute_path, true);
							}catch(Exception $e){};
						}
						else if($remote_type == 's3')
						{
							try{
								if(!isset($s3))
									$s3 = wcuf_init_s3();
								
								$s3->delete_file($absolute_path, true);
							}catch(Error $e){wcuf_write_log($e->getMessage());};	
						}
						else if($remote_type == 'gdrive')
						{
							try{
								if(!isset($gdrive))
									$gdrive = wcuf_init_gdrive();
								
								$gdrive->delete_file($absolute_path, true);
								
								//support to custom addon
								$remote_cropped_file = wcuf_get_value_if_set($file_to_delete, ['crop_remote_file', $index], false);
								if($remote_cropped_file)
								{
									$gdrive->delete_file($remote_cropped_file, true);
								}
									
							}catch(Error $e){wcuf_write_log($e->getMessage());};	
						}
						else //local
						{
							$this->delete_local_file($absolute_path);
						}
					}
				}catch(Exception $e){};
			}
			$wcuf_upload_field_model->delete_uploaded_files_meta_data_by_order_id($order_id);
		}
	}
}	
?>