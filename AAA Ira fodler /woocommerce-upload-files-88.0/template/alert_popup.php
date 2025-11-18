<a id="wcuf_show_popup_button" style="display:none;" href="#wcuf_alert_popup"></a> 
<div id="wcuf_alert_popup" class="mfp-hide" style="display:none;">
	<h4 id="wcuf_alert_popup_title"><?php esc_html_e('Warning', 'woocommerce-files-upload'); ?></h4>
	<div id="wcuf_alert_popup_content"></div>
	<?php if($all_options['allow_user_to_leave_page_in_case_of_required_field']=='no'): ?>
		<button class="button" id="wcuf_close_popup_alert" class="mfp-close"><?php esc_html_e('OK', 'woocommerce-files-upload'); ?></button>
	<?php else: ?>
		<button class="button" id="wcuf_leave_page" class="mfp-close"><?php esc_html_e('OK', 'woocommerce-files-upload'); ?></button>
	<?php endif; ?>
</div>