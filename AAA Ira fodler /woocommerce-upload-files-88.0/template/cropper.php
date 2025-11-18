<div id="wcuf_cropper_popup" class="mfp-hide" style="display:none;">
	<h4 id="wcuf_cropper_popup_title"><?php esc_html_e('Cropper', 'woocommerce-files-upload'); ?></h4>
	<div id="wcuf_cropper_popup_content"></div> 
	
	<div id="wcuf_crop_container" class="wcuf_clearfix">
		<img id="wcuf_image_to_crop"></img>
		<div id="wcuf_crop_container_actions" >
		<?php if(!$all_options['crop_disable_rotation_controller']): ?>
			<button class="button wcuf_crop_button  wcuf_crop_manipulation_button" data-action="rotate" data-param="-90">
				<svg xmlns="http://www.w3.org/2000/svg" id="wcuf_rotate_left_svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M48.5 224H40c-13.3 0-24-10.7-24-24V72c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2L98.6 96.6c87.6-86.5 228.7-86.2 315.8 1c87.5 87.5 87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3c-62.2-62.2-162.7-62.5-225.3-1L185 183c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8H48.5z"/></svg>
				</button>
			<button class="button wcuf_crop_button  wcuf_crop_manipulation_button" data-action="rotate" data-param="90">
				<svg xmlns="http://www.w3.org/2000/svg"  id="wcuf_rotate_left_svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z"/></svg>
			</button>
		<?php endif; ?>
		<?php if(!$all_options['crop_disable_zoom_controller']): ?>
			<button class="button wcuf_crop_button wcuf_crop_manipulation_button" data-action="zoom" data-param="0.2">
				<svg xmlns="http://www.w3.org/2000/svg"  id="wcuf_zoom_in_svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM184 296c0 13.3 10.7 24 24 24s24-10.7 24-24V232h64c13.3 0 24-10.7 24-24s-10.7-24-24-24H232V120c0-13.3-10.7-24-24-24s-24 10.7-24 24v64H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h64v64z"/></svg>
			</button>
			<button class="button wcuf_crop_button wcuf_crop_manipulation_button" data-action="zoom" data-param="-0.2">
				<svg xmlns="http://www.w3.org/2000/svg"  id="wcuf_zoom_out_svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM136 184c-13.3 0-24 10.7-24 24s10.7 24 24 24H280c13.3 0 24-10.7 24-24s-10.7-24-24-24H136z"/></svg>
			</button>
		<?php endif; ?>
			<button class="button wcuf_crop_button" id="wcuf_crop_landascape" data-mode="landscape"><?php esc_html_e('Landscape', 'woocommerce-files-upload'); ?></button>
			<button class="button wcuf_crop_button" id="wcuf_crop_portrait" data-mode="portrait"><?php esc_html_e('Portrait', 'woocommerce-files-upload'); ?></button>
			<button class="button wcuf_crop_button"  id="wcuf_crop_save_button"><?php echo $button_texts['crop_and_upload_multiple_files_button']; ?></button>
			<button class="button wcuf_crop_button"  id="wcuf_crop_cancel_button"><?php esc_html_e('Cancel', 'woocommerce-files-upload') ?></button>
		</div>
	</div>
	<div id="wcuf_crop_upload_image_for_rotating_status_box">
		<div class="wcuf_bar" id="wcuf_crop_remote_processing_upload_bar"></div >
		<div id="wcuf_crop_rotating_upload_percent">0%</div>
		<div id="wcuf_crop_rotating_upload_status_message"><?php esc_html_e('Please wait while the image is processed...','woocommerce-files-upload'); ?></div>
	</div>
	<div class="wcuf_status"  id="wcuf_crop_status"></div>
</div>