<?php 
class WCUF_Ftp
{
	var $file_info_data = array();
	public function __construct()
	{
	}
	public function upload_file($file_path, $file_name)
	{
		$host = "";
		$port = 21;
		$ftp_user_name = "";
		$ftp_user_pass = "";
		$remote_path = "";
		$is_passive = true;
		
		if(!function_exists('ftp_connect'))
			return false;
		
		$conn_id = ftp_connect($host, $port);
		$login_result = ftp_login($conn_id, $ftp_user_name, $ftp_user_pass);
		ftp_pasv($conn_id, $is_passive);
		
		$remote_path = substr($remote_path, -1) == '/' ? rtrim($remote_path, '/') : $remote_path;
		$remote_path = substr($remote_path, 0) != '/' ? '/'.$remote_path : $remote_path;
		$remote_file_path = trim($remote_path) ? $remote_path.$file_name : $file_name;
		
		if (!$conn_id || !$login_result)
		{
			return false;
		}		 
		else if (ftp_put($conn_id, $remote_file_path, $file_path, FTP_BINARY)) 
		{
			$host = substr($host, -1) == '/' ? rtrim($host, '/') : $host;
			$this->file_info_data['path'] = $host."/".$remote_file_path;
		} 
		else 
		{
			return false;
		}
		ftp_close($conn_id);	
		
		return $this->file_info_data;
	}
	
	public function delete_file($file_path, $remove_prefix = false)
	{
		
	}
}
?>