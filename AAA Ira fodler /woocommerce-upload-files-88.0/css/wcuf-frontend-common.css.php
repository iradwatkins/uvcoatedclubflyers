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
.wcuf_audio_control {
	max-width: 100%;
}
.wcuf_opacityblur 
{
  opacity: 0.6;
  filter: blur(3px);
  pointer-events: none;
}
.wcuf_cart_preview_feedback_container {
	display: block;
	word-wrap: break-word;
	max-width: 400px;
	margin-top: 10px;
	border: 1px solid #dedede;
	padding: 10px;
}
.wcuf_cart_preview_feedback_text 
{
	font-style: italic;
	font-size: 14px;
}
.wcuf_delete_button, .wcuf_upload_field_button, .wcuf_upload_multiple_files_button, .wcuf_upload_button,
.wcuf_crop_button, .wcuf_just_selected_multiple_files_delete_button, .wcuf_upload_multiple_files_mirror_button
{
	width: auto !important;
	margin-right: 3px !important;
}
.wcuf_mandatory_crop
{
	border: 1px solid red;
}
.wcuf_crop_button
{
	margin-top: 5px !important;
}
.wcuf_drag_and_drop_area_icon
{
	vertical-align: middle;
    pointer-events: none;
	width: 100% !important;
    height: 45px;
    fill: #bbb;
    display: inline-block;
    margin-bottom: 15px;
    margin-top: 10px;
}
.wcuf_dragover
{
	background-color: #f2f2f2;
}
.wcuf_file_uploads_container
{
	pointer-events: all;
}
.wcuf_upload_drag_and_drop_area 
{
  padding: 15px;
  border: 2px dashed #bbb;
  cursor: pointer;
  display: block;
  width: 100%;
  clear: both;
  margin-bottom: 30px;
}
.wcuf_drag_and_drop_area_description 
{
  text-align: center;
  color: #bbb;
  font-weight: bold;
}

.wcuf_total_single_line_container
{
	display: block;
	clear: both;
}
.wcuf_extra_costs_label
{
	font-weight: bold;
}
.wcuf_totals_container
{
	border: 1px #dedede solid;
	margin-bottom: 10px;
	display: block;
	clear: both;
	padding: 20px;
}
.wcuf_summany_box_totals_container
{
	clear: none;
	overflow: hidden;
	max-width: 300px;
	width: auto;
	background: #f5f5f5;
	padding: 20px;
	border-radius: 3px;
}
td img.wcuf_file_preview_list_item_image 
{
	float: left;
	margin-right: 5px;
	margin-bottom: 10px;
}
.wcuf_item_cart_image_previews
{
	display: block;
	clear: both;
	width: 100%;
	overflow: hidden;
}
.wcuf_cart_file_preview_name {
    display: block;
    clear: both;
	font-size: 12px;
	word-wrap: break-word;
	max-width: 100px;
	overflow: hidden;
}
.wcuf_cart_file_preview_quantity
{
	display: block;
    clear: both;
	font-size: 12px;
	word-wrap: break-word;
	max-width: 100px;
	overflow: hidden;
}
.wcuf_preview_quantity, .wcuf_preview_price, .wcuf_preview_feedback
{
	display: block;
	margin-left: 5px;
}
.wcuf_preview_quantity:not(:empty):before,  .wcuf_preview_price:not(:empty):before, .wcuf_preview_feedback:not(:empty):before
{
    content: "\2022  ";
}

.wcuf_cart_preview_container 
{
    display: inline-block;
    vertical-align: top;
	margin-right: 5px;
	margin-bottom: 10px;
}
.woocommerce-cart table.cart img.wcuf_file_preview_list_item_image
{
	/*height: <?php echo urldecode($style_options['image_preview_height']);?>px ;
	width: <?php echo urldecode($style_options['image_preview_width']);?>px; 
	width: 120px;
	height: 120px;*/
	
	display: block;
	clear: both;
}
.woocommerce-cart table.cart img.wcuf_file_preview_icon
{
	/* height: <?php echo urldecode($style_options['image_preview_height']);?>px ;
	width: <?php echo urldecode($style_options['image_preview_width']);?>px;*/
	width: 70px;
	height: 100px; 
	display: block;
	clear: both;
}
.woocommerce-cart table.cart audio
{
	/* height: <?php echo urldecode($style_options['image_preview_height']);?>px ;
	width: <?php echo urldecode($style_options['image_preview_width']);?>px; */
	width: 200px;
	display: block;
	clear: both;
}
.wcuf_file_preview_icon
{
	/* float: left; */
	margin-right: 3px;
	margin-bottom: 3px;
	/* height: <?php echo urldecode($style_options['image_preview_height']);?>px ; */
	width: <?php echo urldecode($style_options['image_preview_width']);?>px;
	display: block;
}
.wcuf_single_file_name_in_multiple_list
{
	font-weight:bold;
	font-size: 14px;
	word-wrap: break-word; 
}
/* .wcuf_single_file_name_in_multiple_list {
    text-overflow: ellipsis;
    overflow : hidden;
    white-space: nowrap;
}

.wcuf_single_file_name_in_multiple_list:hover {
    text-overflow: clip;
    white-space: normal;
    word-break: break-all;
} */

.wcuf_summary_file_list_block 
{
    display: inline-block;
   /*  margin-right: 20px; */
	/*border: 1px #dedede solid;*/
	padding: 15px;
	margin-bottom: 10px; 
}
.wcuf_summary_file_list_block_new_line
{
	width:100%;
	height:10px;
	display:block;
	clear:both;
}

.wcuf_media_control
{
	width:100%;
}
button.button.delete_button
{
	margin-bottom: 3px;
}
.wcuf_already_uploaded_data_container h4
{
	margin-bottom: 0px;
}
.wcuf_already_uploaded_data_container
{
	display:block;
	clear:both;
	margin-top: 20px;
	margin-bottom: 20px;
	overflow: hidden;
	padding: 10px;
	border: 1px #dedede solid;

}
ol.wcuf_file_preview_list
{
	/* list-style: decimal;*/ 
	list-style: none;
	/* margin: 0px 0px 10px 15px; */
	margin:0px;
	display: block;
	clear: both;
	overflow: hidden;
}
.wcuf_preview_file_title
{
	display: block;
	font-weight: bold;
	font-size: 14px;
	margin-bottom: 3px;
	word-wrap: break-word;
	word-break: break-all;
	padding-right: 10px;
}
.wcuf_required_upload_add_to_cart_warning_message
{
	font-style:italic;
	margin-bottom: 15px;
	clear:both;
}
a.button.download_small_button 
{
   font-size: 13px;
   padding: 6px;
   margin-top: 2px;
  /*  display: inline-block; */
  float: left !important;
  clear: both;
}
img.wcuf_file_preview_list_item_image {
    height: auto;
    max-width: 100%;
    display: block;
	margin-top: 5px;
}
button.button.wcuf_upload_field_button {
  margin-bottom: 3px !important;
}
#wcuf_crop_upload_image_for_rotating_status_box
{
	display:none;
}
#wcuf_crop_rotating_upload_status_message
{
	display:block;
	clear:both;
	margin-top:5px;
}
#wcuf_crop_container_actions 
{
	margin-top: 15px;
	/* centering */
	margin: auto;
	width: 50%;
}
#wcuf_crop_container
{
	
}
#wcuf_rotate_left_svg, #wcuf_rotate_left_svg, #wcuf_zoom_in_svg, #wcuf_zoom_out_svg
{
  width: 12px;
  height: 12px;
  fill: white;
}
#wcuf_image_to_crop
{
	height: 75vh; /* vh -> Viewport height*/
	width: 75vw;
}
.wcuf_clearfix:after {
clear: both;
content: " ";
display: block;
font-size: 0;
height: 0;
visibility: hidden;
}
#wcuf_cropper_popup {
	background: #fff none repeat scroll 0 0;
	margin: 40px auto;
	width: 100%;
	height: 100%;
	padding: 20px 30px;
	position: relative;
	text-align: center;
	color: black;
}
@media screen and (max-width:768px) 
{
	#wcuf_cropper_popup 
	{
		top: -30px;
		text-align: left;
		overflow: hidden;
	}
	/* #wcuf_crop_container_actions 
	{
		margin-top: 0px;
		width: 600px;
	} */
	.wcuf_crop_button 
	{
		margin-top: 5px !important;
		font-size: 12px !important;
		float:left;
		margin-left: 2px !important;
	}
}
#wcuf_alert_popup
{
	background: #fff none repeat scroll 0 0;
    margin: 40px auto;
    max-width: 700px;
    padding: 20px 30px;
    position: relative;
    text-align: center;
	color:black;
	overflow: hidden;
}
#wcuf_close_popup_alert, #wcuf_leave_page
{
	margin-top: 20px;
	/* padding: 3px 15px 3px 15px; */
}
#wcuf_alert_popup_title, #wcuf_cropper_popup_title
 {
  text-align: left;
  border-bottom: 1px solid #dedede;
  padding-bottom: 3px;
}
.wcuf_single_image_preview
{
  margin-right: 3px;
}
.wcuf_quantity_per_file_container
{
	display: block;
	clear:both;
    margin: 20px 0 20px 5px;
}
input[type="number"].wcuf_quantity_per_file_input
{
	width: 60px; 
	padding: 0px;
	margin-left: 5px;
	text-align: center;
	border:none;
	background-color: #eeeeee;
}
.wcuf_single_file_name_container
{
	display:block;
	clear:both;
	/* margin-top: 10px; */
}
button.button.wcuf_just_selected_multiple_files_delete_button, .wcuf_just_selected_multiple_files_delete_button, 
.woocommerce.single.single-product .entry-summary form button.button.wcuf_just_selected_multiple_files_delete_button,
button.button.wcuf_upload_multiple_files_mirror_button , .wcuf_upload_multiple_files_mirror_button , 
.woocommerce.single.single-product .entry-summary form button.button.wcuf_upload_multiple_files_mirror_button
{
	margin-bottom: 3px;
}
.wcuf_multiple_files_actions_button_container
{
   display: none;
}
.wcuf_delete_single_file_in_multiple_list.wcuf_delete_file_icon,
.wcuf_delete_single_file_stored_on_server.wcuf_delete_file_icon
{
	background:url('../img/delete-icon-resized.png');
	height:16px;
	width: 16px;
	display: inline-block;
	margin-left: 5px;
	cursor: pointer;
	display:inline-block; 
	vertical-align:middle;
	margin-top: -5px;
}
.wpuef_text_field_description
{
	display:block;
	margin: 0px 0 5px 0;
}
audio::-internal-media-controls-download-button {
    display:none;
}

audio::-webkit-media-controls-enclosure {
    overflow:hidden;
}

audio::-webkit-media-controls-panel {
    width: calc(100% + 30px); /* Adjust as needed */
}

li.wcuf_file_preview_list_item
{
	/* float: left; */
	/* margin-right: 10px;
	margin-bottom: 20px;
	width: 200px; */
		
	margin-right: 5px;
	margin-bottom: 5px;
	width: 240px;
	vertical-align: top;
	display: inline-block;
	overflow: hidden;
	
	/* border: 1px dashed #dedede; */
	background: #f9f9f9;
	border-radius: 3px;
	padding: 10px;
	
}
.wcuf_file_preview_list_item /* , .wcuf_file_preview_list_item * */
{
	/* display: block; */ /* This remove the numerics */
	/* clear: both; */
	/* float:left; */
}
li.wcuf_file_preview_list_item
{
	/* never used */
	/* vertical aligned */
	/* float: left;
    display: inline-block;
    vertical-align:middle;
    height: <?php echo urldecode($style_options['image_preview_height'])+70;?>px;
	width: <?php echo urldecode($style_options['image_preview_width'])+70;?>px;
    margin-right: 20px; */
	
	/* new */
	margin-top: 10px;
	display:block;
	/* clear:both;  */
	
}
li.wcuf_file_preview_list_item button {
	margin-bottom: 3px !important;
	margin-right: 3px !important;
}
#wcuf_summary_uploaded_files li.wcuf_file_preview_list_item
{
	/* width: 150px; 
	height: 160px;*/
	clear:none;
	overflow: hidden;
	/* margin: 0px 40px 50px 0px; */
	max-width: 300px;
	width: auto;
	background: #f5f5f5;
	padding: 20px;
	border-radius: 3px;
}
/* multiple image preview list sorted horizontally */
.wcuf_single_file_in_multiple_list
{
	/* float: left; */
	vertical-align: top;
	display: inline-block;
	overflow: hidden;
	/* margin-right: 30px;
	margin-bottom: 10px;
	max-width: 200px; */
	margin-right: 10px;
	margin-bottom: 0px;
	width: 240px;
	background: #f9f9f9;
	border-radius: 3px;
	padding: 10px;
	margin-top: 10px;
}

.wcuf_file_name 
{
	overflow: hidden;
}
button.wcuf_single_crop_button
{
	display: block;
	margin-top: 5px !important;
}
button.wcuf_single_crop_button:before
{
	content: "" !important;
}
.wcuf_feedback_textarea:required
{
	border: 1px solid red;
}
.wcuf_update_feedback_text_container 
{
	margin-bottom: 5px;
}
.wcuf_update_feedback_loader 
{
	display: none;
}