<?php 
class WCUF_Text
{
	var $text_cache;
	public function __construct()
	{
	}
	public function get_cart_identifier_prefix()
	{
		$result = get_field('wcuf_cart_individual_item_identifier', 'option'); 	
		$result = $result != null ? $result : esc_html__("#","woocommerce-files-upload"); 	
		
		return $result;
	}
	public function get_button_texts($is_asset_creation_process = false)
	{
		global $wcuf_wpml_helper;
		$langs = $wcuf_wpml_helper->get_available_locale();
		
		if($this->text_cache != null && !$is_asset_creation_process)
			return $this->text_cache;
		
		$bad_chars = array('"', "'");
		
		if($is_asset_creation_process  && count($langs) > 1)
			add_filter('acf/settings/current_language',  array(&$this, 'cl_acf_set_language'), 100);
		
		$all_data['browse_button'] = get_field('wcuf_browse_button', 'option'); 		
		$all_data['browse_button'] = $all_data['browse_button'] != null ? $all_data['browse_button'] : esc_html__("Browse","woocommerce-files-upload"); 		
		
		$all_data['view_button_label'] = get_field('wcuf_view_button_label', 'option'); 		
		$all_data['view_button_label'] = $all_data['view_button_label'] != null ? $all_data['view_button_label'] : esc_html__("View","woocommerce-files-upload"); 		
		
		$all_data['add_files_button'] = get_field('wcuf_add_files_button', 'option'); 
		$all_data['add_files_button'] = $all_data['add_files_button'] != null ? $all_data['add_files_button'] : esc_html__("Add files","woocommerce-files-upload"); 
		
		$all_data['drag_and_drop_area_single_file_instruction'] = get_field('wcuf_drag_and_drop_area_single_file_instruction', 'option'); 
		$all_data['drag_and_drop_area_single_file_instruction'] = $all_data['drag_and_drop_area_single_file_instruction'] != null ? $all_data['drag_and_drop_area_single_file_instruction'] : esc_html__("Click to choose the file or drag it here","woocommerce-files-upload"); 
		
		$all_data['drag_and_drop_area_instruction'] = get_field('wcuf_drag_and_drop_area_instruction', 'option'); 
		$all_data['drag_and_drop_area_instruction'] = $all_data['drag_and_drop_area_instruction'] != null ? $all_data['drag_and_drop_area_instruction'] : esc_html__("Click to choose the files or drag them here","woocommerce-files-upload"); 
		
		$all_data['upload_selected_files_button'] = get_field('wcuf_upload_selected_files_button', 'option'); 
		$all_data['upload_selected_files_button'] = $all_data['upload_selected_files_button'] != null ? $all_data['upload_selected_files_button'] : esc_html__("Upload selected files","woocommerce-files-upload"); 
		
		$all_data['delete_file_button'] = get_field('wcuf_delete_file_button', 'option'); 
		$all_data['delete_file_button'] = $all_data['delete_file_button'] != null ? $all_data['delete_file_button'] : esc_html__("Delete uploaded file(s)","woocommerce-files-upload"); 
		
		$all_data['crop_and_upload_button'] = get_field('wcuf_crop_and_upload_button', 'option'); 
		$all_data['crop_and_upload_button'] = $all_data['crop_and_upload_button'] != null ? $all_data['crop_and_upload_button'] : esc_html__("Crop & Upload","woocommerce-files-upload"); 
		
		$all_data['crop_and_upload_multiple_files_button'] = get_field('wcuf_crop_and_upload_multiple_files_button', 'option'); 
		$all_data['crop_and_upload_multiple_files_button'] = $all_data['crop_and_upload_multiple_files_button'] != null ? $all_data['crop_and_upload_multiple_files_button'] : esc_html__("Crop & Save","woocommerce-files-upload"); 
		
		$all_data['zoom_in_crop_button'] = get_field('wcuf_zoom_in_crop_button', 'option'); 
		$all_data['zoom_in_crop_button'] = $all_data['zoom_in_crop_button'] != null ? $all_data['zoom_in_crop_button'] : "+"; 
		
		$all_data['zoom_out_crop_button'] = get_field('wcuf_zoom_out_crop_button', 'option'); 
		$all_data['zoom_out_crop_button'] = $all_data['zoom_out_crop_button'] != null ? $all_data['zoom_out_crop_button'] : "-"; 
		
		$all_data['rotate_left_button'] = get_field('wcuf_rotate_left_button', 'option'); 
		$all_data['rotate_left_button'] = $all_data['rotate_left_button'] != null ? $all_data['rotate_left_button'] : esc_html__("Rotate left", "woocommerce-files-upload"); 
		
		$all_data['rotate_right_button'] = get_field('wcuf_rotate_right_button', 'option'); 
		$all_data['rotate_right_button'] = $all_data['rotate_right_button'] != null ? $all_data['rotate_right_button'] : esc_html__("Rotate right","woocommerce-files-upload"); 
		
		
		$all_data['deleting_files_message'] = get_field('wcuf_deleting_files_message', 'option'); 
		$all_data['deleting_files_message'] = $all_data['deleting_files_message']  != null ? $all_data['deleting_files_message'] : esc_html__("Deleting file, please wait...", 'woocommerce-files-upload'); 
		
		$all_data['loading_upload_field_message'] = get_field('wcuf_processing_data_message', 'option'); 
		$all_data['loading_upload_field_message'] = $all_data['loading_upload_field_message']  != null ? $all_data['loading_upload_field_message'] : esc_html__("Loading, please wait...", 'woocommerce-files-upload'); 
		
		$all_data['save_in_progress_message'] = get_field('wcuf_save_in_progress_message', 'option'); 
		$all_data['save_in_progress_message'] = $all_data['save_in_progress_message']  != null ? $all_data['save_in_progress_message'] : esc_html__("Save in progress, please wait...", 'woocommerce-files-upload'); 
		//Total area
		$all_data['totals_area_title'] = get_field('wcuf_totals_area_title', 'option'); 
		$all_data['totals_area_title'] = $all_data['totals_area_title']  != null ? $all_data['totals_area_title'] : esc_html__("Totals", 'woocommerce-files-upload'); 
		
		$all_data['totals_num_files_label'] = get_field('wcuf_totals_num_files_label', 'option'); 
		$all_data['totals_num_files_label'] = $all_data['totals_num_files_label']  != null ? $all_data['totals_num_files_label'] : esc_html__("Number of uploaded files:", 'woocommerce-files-upload'); 
		
		$all_data['totals_extra_costs_label'] = get_field('wcuf_totals_extra_costs_label', 'option'); 
		$all_data['totals_extra_costs_label'] = $all_data['totals_extra_costs_label']  != null ? $all_data['totals_extra_costs_label'] : esc_html__("Extra costs:", 'woocommerce-files-upload'); 
		
		
		//Not used anymore
		$all_data['save_uploads_button'] = get_field('wcuf_save_uploads_button', 'option') ; 
		$all_data['save_uploads_button'] = $all_data['save_uploads_button']  != null ? $all_data['save_uploads_button']  : esc_html__('Save upload(s)', 'woocommerce-files-upload'); 
		
		$all_data['select_quantity_label'] = get_field('wcuf_select_quantity_label', 'option') ; 
		$all_data['select_quantity_label'] = $all_data['select_quantity_label'] != null ? $all_data['select_quantity_label'] : esc_html__('Select quantity:', 'woocommerce-files-upload'); 
		
		$all_data['incomplete_files_upload_message'] = get_field('wcuf_incomplete_files_upload_message', 'option'); 
		$all_data['incomplete_files_upload_message'] = $all_data['incomplete_files_upload_message']  != null ? $all_data['incomplete_files_upload_message'] : esc_html__("Your file upload is incomplete – click on the 'Upload selected files' button or remove the file(s)", 'woocommerce-files-upload'); 
		
		$all_data['required_upload_add_to_cart_warning_message'] = get_field('wcuf_required_upload_add_to_cart_warning_message', 'option'); 
		$all_data['required_upload_add_to_cart_warning_message'] = $all_data['required_upload_add_to_cart_warning_message']  != null ? $all_data['required_upload_add_to_cart_warning_message'] : esc_html__("Please upload all the required file(s). Once done you will be able to add the product to cart.", 'woocommerce-files-upload'); 
		
		$all_data['required_upload_add_to_cart_warning_popup_message'] = get_field('wcuf_required_upload_add_to_cart_warning_popup_message', 'option'); 
		$all_data['required_upload_add_to_cart_warning_popup_message'] = $all_data['required_upload_add_to_cart_warning_popup_message']  != null ? $all_data['required_upload_add_to_cart_warning_popup_message'] : esc_html__("Please upload all the required files before leaving the page", 'woocommerce-files-upload'); 
		
		//Not used anymore
		$all_data['order_page_save_uploaded_files_title'] = get_field('wcuf_order_page_save_uploaded_files_title', 'option'); 
		$all_data['order_page_save_uploaded_files_title'] = $all_data['order_page_save_uploaded_files_title']  != null ? $all_data['order_page_save_uploaded_files_title'] : esc_html__("When ready to save the uploaded file(s), click on the following button:", 'woocommerce-files-upload'); 
		
		$all_data['cart_individual_item_identifier'] = get_field('wcuf_cart_individual_item_identifier', 'option'); 	
		$all_data['cart_individual_item_identifier'] = $all_data['cart_individual_item_identifier'] != null ? $all_data['cart_individual_item_identifier'] : esc_html__("#","woocommerce-files-upload"); 	
		
		foreach($all_data as $key => $single_data)
		{
			if(!in_array($key, array('deleting_files_message','loading_upload_field_message','save_in_progress_message')))
				$all_data[$key] = str_replace($bad_chars, "", $single_data);
		}
		
		if(!$is_asset_creation_process)
			$this->text_cache = $all_data;
		
		if($is_asset_creation_process && count($langs) > 1)
			remove_filter('acf/settings/current_language', array(&$this,'cl_acf_set_language'), 100);
		
		return $all_data;
	}
	function cl_acf_set_language() 
	{
		global $wcuf_asset_model, $wcuf_wpml_helper;
		$lang = $wcuf_asset_model->get_current_asset_lang();
		return $lang;
	}
}
?>