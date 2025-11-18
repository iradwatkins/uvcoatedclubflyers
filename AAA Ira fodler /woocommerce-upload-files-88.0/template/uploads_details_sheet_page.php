<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
table {
	font-family: arial, sans-serif;
	border-collapse: collapse;
	width: 100%;
}

th {
		background: black;
		color: white;
}
td, th {
	border: none;
	text-align: left;
	padding: 8px;
}

tr:nth-child(even) {
	background-color: #dddddd;
}
.half_left_container
{
	margin-top: 20px;
	margin-bottom: 20px;
	width: 40%;
	border-top: 2px #dedede solid;
	float:left;
	font-size: 20px;
}
.half_right_container
{
	margin-top: 20px;
	margin-bottom: 20px;
	margin-left: 15%;
	border-top: 2px #dedede solid;
	float:left;
	font-size: 20px;
	width: 45%;
}
h3
{
	text-transform: uppercase;
}
#total_row
{
	background-color: #ffff;
}
#delivery_row, .total_content_column
{
	background-color: #ffff;
	border-top: 3px #b6b6b6 solid;
}
#delivery_row td
{
	padding-top: 50px;
	padding-bottom: 50px; 
}
.wcuf_image_preview_container
{
	display: inline-block;
	margin-right: 5px;
	margin-bottom: 5px
}
.wcuf_image_preview_text, .wcuf_file_name_text, .wcuf_file_quantity_text , .wcuf_feedback_text
{
	/* float: left; */
	display: block;
	clear: both;
	text-align: left;
	margin-bottom: 5px;
}

.wcuf_non_image_element
{
	margin-bottom: 10px;
}
.wcuf_non_image_list
{
	margin-top: 50px;
}
.details_column
{
	
}
@page {
  size: A4;
  margin: 0;
}

		
</style>
</head>
<body>

<div class="half_left_container">
<h3><?php 	echo esc_html__('Ships to', 'woocommerce-files-upload'); ?></h3>
<p>
<?php echo $wc_order->get_formatted_shipping_address(); ?>
</p>
</div>
<div class="half_right_container">
<h3><?php 	echo esc_html__('Order', 'woocommerce-files-upload'); ?></h3>
<p>
<?php 
	$date = $wc_order->get_date_created();
	echo esc_html__('ID: ', 'woocommerce-files-upload').$wc_order->get_id()."<br/>";
	echo  esc_html__('Placed on: ', 'woocommerce-files-upload').$date->date_i18n(get_option('date_format')." ".get_option('time_format'))."<br/>"; 
	echo esc_html__('Delivery option: ', 'woocommerce-files-upload').$wc_order->get_shipping_method()."<br/>";  
	echo esc_html__('Notes: ', 'woocommerce-files-upload').$wc_order->get_customer_note()."<br/>"; 
?>
</p>
<h3><?php 	echo esc_html__('Bills to', 'woocommerce-files-upload'); ?></h3>
<p>
<?php 
	echo $wc_order->get_formatted_billing_address()."<br/>"; 
	echo $wc_order->get_billing_email()."<br/>"; 
	echo $wc_order->get_billing_phone()."<br/>"; 
?>
</p>
</div>

<table>
  <tr>
	<th><?php esc_html_e('SKU', 'woocommerce-files-upload') ?></th>
	<th><?php esc_html_e('Quantity', 'woocommerce-files-upload') ?></th>
	<th class="details_column"><?php esc_html_e('Details', 'woocommerce-files-upload') ?></th>
	<th><?php esc_html_e('Unit Price', 'woocommerce-files-upload'); echo " (".$currency_symbol.")";?></th>
	<th><?php esc_html_e('Net subtotal', 'woocommerce-files-upload'); echo " (".$currency_symbol.")"; ?></th>
	<th><?php esc_html_e('Tax', 'woocommerce-files-upload'); echo " (".$currency_symbol.")"; ?></th>
  </tr>
  <?php foreach ($wc_order->get_items() as $key => $item): 
	if(!is_a($item, 'WC_Order_Item_Product'))
		continue;
	$wc_item_product = $item->get_product();
	
	if(!isset($wc_item_product) || is_bool($wc_item_product))
		continue;
	
	$current_product_uploads = array();
	foreach($uploaded_files_metadata as $upload_field_id => $file_meta)
	{
		$product_id = $wc_item_product->is_type('variation') ? $wc_item_product->get_parent_id() : $wc_item_product->get_id();
		$variation_id = $wc_item_product->is_type('variation') ? $wc_item_product->get_id() : 0;
		$unique_id = $wcuf_order_model->read_order_item_meta($item,'_wcuf_sold_as_individual_unique_key');
		$item_id_data = array('product_id' => $product_id , 'variant_id'=> $variation_id , 'unique_product_id'=> $unique_id  );
		
		$ids = $wcuf_file_model->get_product_ids_and_field_id_by_file_id("order_".$upload_field_id);		
		$is_the_uploaded_assocaited_to_the_product = $wcuf_product_model->is_the_same_product($item_id_data, $ids);
		
		if($is_the_uploaded_assocaited_to_the_product)
		{
			$current_product_uploads[$upload_field_id] = $file_meta;
			$product_specific_uploads[$upload_field_id] = $upload_field_id;
		}
			
	}
	?>
  <tr>
	<td><?php echo $wc_item_product->get_sku(); ?></td>
	<td><?php echo $item->get_quantity(); ?></td>
	<td><p><?php echo $item->get_name()."<br/>";
		foreach($item->get_formatted_meta_data() as $metadata_id => $metadata):
			echo strip_tags($metadata->display_key.": ".$metadata->display_value)."<br/>";
		endforeach;
		?></p>
		<!-- Uploaded files -->
		<?php 
			$non_images_uploads = array();			
			foreach($current_product_uploads as $current_product_upload_id =>  $upload)
			{
				//wcuf_var_dump($upload);
				
				//Image preview
				$non_images_uploads[$current_product_upload_id] = array();
				$upload['url'] = $wcuf_upload_field_model->get_secure_urls($order_id, $current_product_upload_id, $current_product_uploads);	
				foreach((array)$upload['url'] as $index => $upload_url)
				{
					$file_abs_path = $upload['absolute_path'][$index];
					$feedback = wcuf_get_value_if_set($upload, 'user_feedback', "");
					$preview_html = $wcuf_media_model->get_media_preview_html($upload, $upload['original_filename'][$index], false, $wc_order->get_id(), $index, false, array('preview_type' => 'cart_product_preview'));	
					if($wcuf_media_model->is_image($file_abs_path))
					{
						//For full image replace $preview_html with <img class='wcuf_image_preview' src='{$upload_url}&wcuf_is_preview=true'  width='120' />
						echo "<div class='wcuf_image_preview_container'>
									{$preview_html}
									<span class='wcuf_image_preview_text'>".esc_html__('Quantity: ','woocommerce-files-upload').$upload['quantity'][$index]."</span>";
							if($display_feedback)
									echo "<span class='wcuf_feedback_text'>".esc_html__('Feedback: ','woocommerce-files-upload').$feedback."</span>";
						echo	 "</div>";
					}
					else 
					{
						$non_images_uploads[$current_product_upload_id][$index] =  array('name'=> $upload['original_filename'][$index], 
																						 'feedback' => $feedback,
																						 'quantity' => $upload['quantity'][$index]);
					}
				}
			}
			
			//Non images preview
			if(!empty($non_images_uploads))
			{
				echo "<ol class='wcuf_non_image_list'>";
				foreach($non_images_uploads as  $file_current_data)
					foreach($file_current_data as  $file_data)
					{
						echo "<li class='wcuf_non_image_element'>
									<span class='wcuf_file_name_text'>".$file_data['name']."</span>
									<span class='wcuf_file_quantity_text'>".esc_html__('Quantity: ', 'woocommerce-files-upload').$file_data['quantity']."</span>";
						if($file_data['feedback'] != "")
								echo "<span class='wcuf_feedback_text'>".esc_html__('Feedback: ','woocommerce-files-upload').$file_data['feedback']."</span>";			
						echo	"</li>";
					}
				echo "</ol>";
			}
		?>
	</td>
	<td><?php echo $item->get_subtotal()/$item->get_quantity(); ?></td>
	<td><?php echo $item->get_subtotal(); ?></td>
	<td><?php echo $item->get_subtotal_tax(); ?></td>
  </tr>
  <?php endforeach; ?>
  <!-- Delivery -->
  <tr id="delivery_row">
	  <td><strong><?php esc_html_e('Delivery', 'woocommerce-files-upload') ?></strong></td>
	  <td></td>
	  <td><?php echo $wc_order->get_shipping_method(); ?></td>
	  <td></td>
	  <td><?php echo $wc_order->get_shipping_total(); ?></td>
	  <td><?php echo $wc_order->get_shipping_tax(); ?></td>
  </tr>
  <!-- Total -->
  <tr id="total_row">
	  <td></td>
	  <td></td>
	  <td></td>
	  <td></td>
	  <td class="total_content_column"><strong><?php esc_html_e('Totals', 'woocommerce-files-upload'); echo " (".$currency_symbol.")" ?></strong></td>
	  <td class="total_content_column"><p>
			<?php echo esc_html__('Subtotal : ', 'woocommerce-files-upload').wc_price($wc_order->get_total() - $wc_order->get_total_tax()); ?><br>
			<?php echo esc_html__('Tax: ', 'woocommerce-files-upload').$wc_order->get_total_tax(); ?><br>
			<?php echo esc_html__('Total: ', 'woocommerce-files-upload').$wc_order->get_total(); ?><br>
	  </p></td>
  </tr>
</table>

<div class="half_left_container">
<?php 
	//Order specific uploads
	$non_images_uploads = array();
	$was_the_title_rendered = false;
	$title_html = "<h3>".esc_html__('Order uploads', 'woocommerce-files-upload')."</h3>";
	foreach($uploaded_files_metadata as $upload_field_id => $file_meta)
		{
			if(in_array($upload_field_id, $product_specific_uploads))
				continue;
			
			if(!$was_the_title_rendered )
			{
				$was_the_title_rendered = true;
				echo $title_html;
			}
			//Image preview
			$non_images_uploads[$upload_field_id] = array();
			foreach($file_meta['url'] as $index => $upload_url)
			{
				$feedback = wcuf_get_value_if_set($file_meta, 'user_feedback', "");
				$file_abs_path = $file_meta['absolute_path'][$index];
				$preview_html = $wcuf_media_model->get_media_preview_html($file_meta, $file_meta['original_filename'][$index], false, $wc_order->get_id(), $index, false, array('preview_type' => 'cart_product_preview'));
				if($wcuf_media_model->is_image($file_abs_path))
				{
					//For full image replace $preview_html with <img class='wcuf_image_preview' src='{$upload_url}&wcuf_is_preview=true'  width='120' />
					echo "<div class='wcuf_image_preview_container'>
								{$preview_html}
								<span class='wcuf_image_preview_text'>".esc_html__('Quantity: ','woocommerce-files-upload').$file_meta['quantity'][$index]."</span>";
							if($display_feedback)
									echo "<span class='wcuf_feedback_text'>".esc_html__('Feedback: ','woocommerce-files-upload').$feedback."</span>";
					echo	  "</div>";
				}
				else 
					$non_images_uploads[$upload_field_id][$index] =  array('name'=> $file_meta['original_filename'][$index],
																		   'feedback' => $feedback,
																		   'quantity' => $file_meta['quantity'][$index]);
			}
		}
		
		//Non images preview
		if(!empty($non_images_uploads))
		{
			if(!$was_the_title_rendered )
			{
				$was_the_title_rendered = true;
				echo $title_html;
			}
			
			echo "<ol class='wcuf_non_image_list'>";
			foreach($non_images_uploads as $file_current_data)
					foreach($file_current_data as $file_data)
					{
						echo "<li class='wcuf_non_image_element'>
									<span class='wcuf_file_name_text'>".$file_data['name']."</span>
									<span class='wcuf_file_quantity_text'>".esc_html__('Quantity: ', 'woocommerce-files-upload').$file_data['quantity']."</span>";					
						if($file_data['feedback'] != "")
							echo "<span class='wcuf_feedback_text'>".esc_html__('Feedback: ','woocommerce-files-upload').$file_data['feedback']."</span>";			
						echo	"</li>";
					}
			echo "</ol>";
		}
?>
</div>
<div class="half_right_container">
<h3><?php 	echo esc_html__('Notes for the customer', 'woocommerce-files-upload'); ?></h3>
<p>
	<?php if($wc_order->get_customer_order_notes())
			foreach($wc_order->get_customer_order_notes() as $note)
				echo get_comment_text($note->comment_ID); 
		  else 
			echo esc_html__('N/A', 'woocommerce-files-upload'); 
	?>
</p>
</div>


</body>
</html>
