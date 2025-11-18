<?php 
$content .= "<strong>".esc_html__('Uploaded files', 'woocommerce-files-upload')."</strong> <br />";
$content .= esc_html__('You can directly download by clicking on following links: ', 'woocommerce-files-upload');
foreach($data_to_embed as $current_data)
{
	$content .= "<br /> ";
	$content .= '<table>';
	$counter = 0;
	$file_data = $current_data['file_info'];
	if(isset($file_data['url']) && is_array($file_data['url']))
		foreach($file_data['url'] as $file_url)
		{
			if(isset($file_data['title']) && isset($file_data['file_name'][$counter]))
				$content .='<tr><a href="'. $file_url.'">'.$file_data['title'].": ".$file_data['file_name'][$counter].'</a> ';
			else
				$content .='<tr><a href="'. $file_url.'">'.$file_data['title'].'</a> ';
			
			if(!$file_data['disable_quantity_selector'] && isset($file_data['quantity'][$counter]) )
				$content .= esc_html__('(Quantity: ', 'woocommerce-files-upload').$file_data['quantity'][$counter].')';
			
			$content .= '<br/><br/></tr>';
			
			$counter++;
		}
	if(isset($file_data['feedback']) && $file_data['feedback'] != '')
	{
		$content .= '<tr><strong>'.esc_html__('User feedback: ', 'woocommerce-files-upload').'</strong>';
		$content .= "<br /> ";
		$content .= $file_data['feedback'];
		$content .= "</tr>";
		$content .= "<tr><br/></tr>";
	}
	
	
	$content .= '</table>';
	if($wcuf_upload_field_model->can_be_zip_file_created_upload_field_content($current_data['order_meta']))
		$content .= '<br/><a href="'.get_site_url().'?wcuf_create_zip_for_field='.$current_data['order_meta']['id'].'&wcuf_order_id='.$order_id.'" a>'.esc_html__('Download as zip', 'woocommerce-files-upload').'</a>';
}
//Output
if($data_to_embed)
	echo $content;
?>