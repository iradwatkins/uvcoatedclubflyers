<?php
/* error_reporting(0);
ini_set('display_errors', 0);

$parse_uri = explode( 'wp-content', $_SERVER['SCRIPT_FILENAME'] );
require_once( $parse_uri[0] . 'wp-load.php' ); */

global $wcuf_option_model;
$style_options = $wcuf_option_model->get_style_options();

/*** set the content type header ***/
/* header("Content-type: text/css"); */
?>
.wcuf_upload_fields_row_element 
{
 margin-bottom: 25px;
 /* background: #FbFbFb; */
  padding: 15px;
  overflow: hidden;
}
.wcuf_single_upload_field_container 
{
  /* padding: 10px 15px 15px 15px; */
  border: 1px #dedede solid;
  margin-bottom: 10px;
  margin-top: 3px;
  display: block;
  clear:both;   
}
.wcuf_multiple_file_progress_container
{
	display:none;
	margin-bottom: 5px;
}
.wcuf_bar
{
	background-color: grey;
    display: block;
    height: 10px;
    width: 100%;
	border-radius: 3px;
}
.wcuf_upload_status_box
{
	display:none;
	width:90%;
}
.wcuf_required_label:after { content:" *";  color:red;}
.woocommerce.single.single-product .entry-summary form button.button.wcuf_upload_field_button::before, 
.woocommerce.single.single-product .entry-summary form button.button.delete_button::before,
.woocommerce.single.single-product .entry-summary form button.button.wcuf_upload_multiple_files_button::before,
.woocommerce.single.single-product .entry-summary form button.button.wcuf_remove_button_extra_content::before,
.woocommerce.single.single-product .entry-summary form button.button.wcuf_just_selected_multiple_files_delete_button::before,
.woocommerce.single.single-product .entry-summary form button.button.wcuf_upload_multiple_files_mirror_button::before
{
  content:none
}
.woocommerce.single.single-product .entry-summary form button.button.wcuf_upload_multiple_files_button
{
	width: auto;
}
.wcuf_deleting_message
{
	display:none;
}
.wcuf_spacer
{
	display:block; height:2px;
	width:100%;
	clear: both;
}
.wcuf_spacer2
{
	display:block; 
	height:5px;
	width:100%;
	clear: both;
}
.wcuf_spacer3
{
	display:block; height:0px;
	width:100%;
	clear: both;
}
.wcuf_spacer4
{
	display:block; height:50px;
	width:100%;
	clear: both;
}

.wcuf_field_hidden
{
	display:none;
}
input[type="file"].wcuf_file_input
{
	/* display:none; */
	opacity:0;
	position:absolute;
	z-index: -10;
	width: 10px;
}
.button.wcuf_upload_field_button {
	  width: auto !important;
}
.wcuf_product_ajax_container
{
	width: 100%;
}
.wcuf_file_uploads_container{ min-width:300px }
	
.wcuf_file_uploads_container strong {
  display: block;
  clear:both;
}
button.button.wcuf_upload_multiple_files_button,.woocommerce.single.single-product .entry-summary form button.button.wcuf_upload_multiple_files_button, 
.wcuf_file_uploads_container .button.wcuf_upload_multiple_files_button,
#top form.cart .button.wcuf_upload_multiple_files_button
{
	display:none;
}
.wcuf_multiple_files_list
{
	margin-top: 3px;
	display:block;
}

.wcuf_file_name
{
	display:none;
	clear:left;
	margin-top: 15px;
	margin-bottom: 5px;
	padding: 0px 10px 5px 10px;
	border: 1px #dedede solid;
}
.wcuf_file_preview_list_item
{
	margin-bottom: 5px;
}
.wcuf_summary_uploaded_files_list_spacer
{
	display:block;
	clear:both;
	height:20px;
}
#wcuf_summary_uploaded_files
{
	margin-bottom:40px;
}
.wcuf_disclaimer_checkbox
{
	 margin-right: 5px;
    top: 3px;
    vertical-align: bottom;
	position: relative;
}
.wcuf_disclaimer_label
{
	display:block;
	clear:both;
	margin: 10px 0px 10px 0px;
}
.wcuf_upload_field_title
{
	color: <?php echo urldecode($style_options['css_upload_field_title_color']); //$_GET ?> !important;
	<?php $css_upload_field_title_font_size = urldecode($style_options['css_upload_field_title_font_size']);
		  echo $css_upload_field_title_font_size == 'inherit' ? "" : "font-size: ".$css_upload_field_title_font_size.'px  !important;';?>
}
.wcuf_feedback_textarea
{
	<?php if($style_options['css_feedback_text_area_height'] != 0): ?>
		height: <?php echo $style_options['css_feedback_text_area_height'];?>px;
	<?php endif; ?>
	<?php if($style_options['css_feedback_text_area_width'] != 0): ?>
		width: <?php echo $style_options['css_feedback_text_area_width'];?>px;
	<?php endif; ?>
	margin-top: <?php echo $style_options['css_feedback_text_area_margin_top'];?>px;
	margin-bottom: <?php echo $style_options['css_feedback_text_area_margin_bottom'];?>px;
}
.wcuf_max_size_notice
{
	margin-top: <?php echo $style_options['css_notice_text_margin_top'];?>px;
	margin-bottom: <?php echo $style_options['css_notice_text_margin_bottom'];?>px;
}