<?php 
$post_max_size = ini_get('post_max_size'); 
$upload_max_filesize = ini_get('upload_max_filesize');
$error_message = esc_html__("Please note you cannot upload files larger than {$upload_max_filesize}!<br>In case you are uploading multiple files, file sizes sum cannot be greater than {$post_max_size }!", "woocommerce-files-upload");
?>
<p style="color: red;">
<?php echo $error_message; ?>
</p> 