<?php
class WCUF_OrderstableAddon
{
	public function __construct()
	{
		
		//HPOS 
		add_action( 'woocommerce_shop_order_list_table_custom_column', array($this, 'manage_upload_counter_column'),10, 2 ); 
		add_filter( 'woocommerce_shop_order_list_table_columns', array($this, 'add_upload_counter_column'), 15 ); 
		
		add_action('admin_footer', array( &$this,'add_bulk_delete_uploads_action')); 
		add_action('handle_bulk_actions-woocommerce_page_wc-orders', array( &$this,'handle_delete_uploads_bulk_action'), 10, 3); 
		add_action('woocommerce_order_list_table_restrict_manage_orders', array( &$this,'add_uploads_select_box_filter'), 10, 2); 
		add_filter('woocommerce_order_list_table_prepare_items_query_args', array( &$this,'filter_order_list_query'), 10, 2); 
		//****
		add_action( 'manage_shop_order_posts_custom_column', array($this, 'manage_upload_counter_column'), 10, 2 );      //Same for HPOS
		add_filter( 'manage_edit-shop_order_columns', array($this, 'add_upload_counter_column'),15 ); 				     //Same for HPOS
		add_action('restrict_manage_posts', array( &$this,'add_uploads_select_box_filter'));    						 //Slightly modified for HPOS
		add_filter('parse_query',array( &$this,'filter_query_by_uploads')); 											 //For HPOS managed by filter_order_list_query
		add_action('admin_footer-edit.php', array( &$this,'add_bulk_delete_uploads_action'));   						 //Same for HPOS
		add_action('load-edit.php', array( &$this,'delete_uploads_bulk_action'));				 						 //For HPOS managed by handle_delete_uploads_bulk_action()
		add_action('admin_notices', array( &$this,'delete_uploads_admin_notices')); 			 						 //Slightly modified for HPOS
	}
	
 
	function add_bulk_delete_uploads_action() 
	{
	  global $post_type;
	  
	  if($post_type == 'shop_order' || wcuf_get_value_if_set($_GET,'page', false) == 'wc-orders') 
	  {
		?>
		<script type="text/javascript">
		  jQuery(document).ready(function() {
			jQuery('<option>').val('wcuf_delete_uploads').text('<?php esc_html_e('Delete uploads', 'woocommerce-files-upload')?>').appendTo("select[name='action']");
			jQuery('<option>').val('wcuf_delete_uploads').text('<?php esc_html_e('Delete uploads', 'woocommerce-files-upload')?>').appendTo("select[name='action2']");
		  });
		</script>
		<?php
	  }
	}
    //HPOS
	function handle_delete_uploads_bulk_action($redirect_to, $action, $ids) 
	{
	  global $wcuf_file_model;
	  
	  switch($action) 
	  {
		// 3. Perform the action
		case 'wcuf_delete_uploads':
		  $deleted = 0;
		  $order_ids =  is_array($ids) ? $ids : array();
		  foreach( $order_ids as $order_id ) 
		  {
			$wcuf_file_model->delete_all_order_uploads($order_id);
			$deleted++;
		  }
		 
		  $redirect_to .= "&wcuf_deleted={$deleted}&ids=". join(',', $order_ids);
		break;
		default: return;
	  }
	  
	 
	  return $redirect_to;
	  
	}
	function delete_uploads_bulk_action() 
	{
	  
	  global $wcuf_file_model, $wp;
	  // 1. get the action
	  $wp_list_table = _get_list_table('WP_Posts_List_Table');
	  $action = $wp_list_table->current_action();
	  switch($action) 
	  {
		// 3. Perform the action
		case 'wcuf_delete_uploads':
		  $deleted = 0;
		  $post_ids =  is_string($_GET['post']) ? explode(",",$_GET['post']) : $_GET['post'];
		  foreach( $post_ids as $order_id ) 
		  {
			$wcuf_file_model->delete_all_order_uploads($order_id);
			$deleted++;
		  }
		 
		  $sendback = add_query_arg( array('wcuf_deleted' => $deleted, 'post_type'=>'shop_order', 'ids' => join(',', $post_ids) ), $wp->request);
		 
		break;
		default: return;
	  }
	 
	  wp_redirect($sendback);
	 
	  exit();
	}
	 
 
	function delete_uploads_admin_notices() 
	{
	  global $post_type, $pagenow;
	  
	 
	  if( (($pagenow == 'edit.php' && $post_type == 'shop_order') || /* HPOS*/ wcuf_get_value_if_set($_REQUEST,'page',false) == 'wc-orders'  ) &&
		 isset($_REQUEST['wcuf_deleted']) && (int) $_REQUEST['wcuf_deleted']) 
		 {
		   $message = sprintf( _n( 'Order uploads deleted.', '%s orders uploads deleted.', $_REQUEST['wcuf_deleted'] ), number_format_i18n( $_REQUEST['wcuf_deleted'] ) );
		   echo '<div class="updated"><p>'.$message.'</p></div>';
	     }
	}
	public function manage_upload_counter_column( $column, $order_id ) 
	{
		global $wcuf_upload_field_model;
		$order_id = is_object($order_id) ? $order_id->get_id() : $order_id;
		if ( $column == 'wcuf-upload-counter' ) 
		{
			echo $wcuf_upload_field_model->get_num_uploaded_files($order_id);
			
		}
		if ( $column == 'wcuf-details-sheet' ) 
		{
			?>
			<a class="button button-primary wcuf_primary_button" target="_blank" href="<?php echo admin_url( "?wcuf_page=uploads_details_sheet&wcuf_order_id={$order_id}" ); ?>"><?php esc_html_e('View', 'woocommerce-files-upload') ?></a>
			<?php
		}
		
		
	}
	
	function sort_columns( $columns)
	{
		 $columns['wcuf-upload-counter'] = 'wcuf-upload-counter';
		 $columns['wcuf-details-sheet'] = 'wcuf-details-sheet';
		return $columns;
	}
	public function add_upload_counter_column($columns)
	 {
		
	   //add column
	   $columns['wcuf-upload-counter'] = esc_html__('Uploads', 'woocommerce-files-upload'); 
	   $columns['wcuf-details-sheet'] = esc_html__('Details sheet', 'woocommerce-files-upload'); 

	   return $columns;
	}
	//Modified to make it compatible with HPOS
	public function add_uploads_select_box_filter($order_type = "shop_order", $which = "top")
	{
		global $typenow, $wp_query; 
		$current_page = $typenow ? $typenow : $order_type;
		if ($current_page=='shop_order') 
		{
			$selected = isset($_GET['wcuf_filter_by_uploads']) && $_GET['wcuf_filter_by_uploads'] ? $_GET['wcuf_filter_by_uploads']:"none";
			 ?>
			<select name="wcuf_filter_by_uploads" >
				<option value="all" <?php if($selected == "all") echo 'selected="selected"';?>><?php esc_html_e('Orders with and without uploads', 'woocommerce-files-upload') ?></option>
				<option value="uploads-only" <?php if($selected == "uploads-only") echo 'selected="selected"';?>><?php esc_html_e('Orders with uploads', 'woocommerce-files-upload') ?></option>
			</select>
			<?php
		}
	}
	//HPOS
	function filter_order_list_query($query) 
	{
		global $wcuf_upload_field_model;
		if(wcuf_get_value_if_set($_GET,'wcuf_filter_by_uploads', false) == 'uploads-only' && wcuf_get_value_if_set($query, 'type', false) == 'shop_order')
		{
			$meta_names = $wcuf_upload_field_model->get_meta_names();
			 $conditions = array('relation' => 'OR');
			  foreach($meta_names as $meta_name)
			  {
				  $conditions[] = array(
					'key' => $meta_name,
					'compare' => 'NOT NULL'
				  ); 
			  }
			  
			$query['meta_query'][] = $conditions;
		}
		return $query;
	}
	function filter_query_by_uploads($query) 
	{
		global $pagenow, $wcuf_upload_field_model;
		$meta_names = $wcuf_upload_field_model->get_meta_names();
		$qv = &$query->query_vars;
		
		if ($pagenow=='edit.php' && 
		    isset($qv['post_type']) && $qv['post_type']=='shop_order' && isset($_GET['wcuf_filter_by_uploads']) && $_GET['wcuf_filter_by_uploads'] == 'uploads-only') 
		{
			
			   $counter = 0;
			  $conditions = array('relation' => 'OR');
			  foreach($meta_names as $meta_name)
			  {
				  $conditions[] = array(
					'key' => $meta_name,
					'compare' => 'NOT NULL'
				  ); 
			  }
			  $qv['meta_query'][] = $conditions;
		}
		
	}
}
?>