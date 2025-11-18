<?php 
//https://github.com/kunalvarma05/dropbox-php-sdk

require WCUF_PLUGIN_ABS_PATH.'/classes/vendor/dropbox/vendor/autoload.php';
use Kunnu\Dropbox\Dropbox;
use Kunnu\Dropbox\DropboxApp;
use Kunnu\Dropbox\DropboxFile;
use Kunnu\Dropbox\Authentication;
use Kunnu\Dropbox\Exceptions;
use Kunnu\Dropbox\Models\AccessToken;

class WCUF_DropBox
{
	var $app;
	var $dropbox;
	var $file_info_data = array();
	static $dropbox_filepath_prefix = 'dropbox:'; 
	var $current_token = "";
	public function __construct()
	{
		$this->auth2();
	}
	private function auth1()
	{
		global $wcuf_option_model;
		$cloud_settings = $wcuf_option_model->get_cloud_settings();
		$this->app = new DropboxApp("mor95d73uit1o5w", "9fscabceaue78b9", $cloud_settings['dropbox_auth_key']);
		$this->dropbox = new Dropbox($this->app);
	}
	private function auth2()
	{
		global $wcuf_option_model, $wcuf_option_model;
		$cloud_settings = $wcuf_option_model->get_cloud_settings();
		
		$this->app = new DropboxApp("mor95d73uit1o5w", "9fscabceaue78b9");
		$this->dropbox = new Dropbox($this->app);
		$token_data = $wcuf_option_model->get_dropbox_token_data();
		$now = date('Y-m-d H:i:s');
		
		if(!$token_data || $now > $token_data['expiring_datetime'])
		{
			
			$authHelper = $this->dropbox->getAuthHelper();
			//old modified method: $token = $authHelper->getAccessToken($cloud_settings['dropbox_auth_key'], null, null, Kunnu\Dropbox\Authentication\DropboxAuthHelper::GRANT_TYPE_REFRESH_TOKEN);
			
			$tmp_token =  array(
								'access_token' => "",
								'token_type'   => "",
								'bearer'	   => "",
								'uid'		   => "",
								'account_id'   => "",
								'team_id'	   => "",
								'expires_in'   => "",
								'refresh_token' => $cloud_settings['dropbox_auth_key']
							) ;
			
			$token = $authHelper->getRefreshedAccessToken(new AccessToken($tmp_token));
			//wcuf_write_log($token);
			
			$this->current_token = $token->getToken();
			$wcuf_option_model->update_dropbox_token_data($this->current_token ,$token->getExpiryTime());
		}
		else 
			$this->current_token = $token_data['token'];
		
		$this->dropbox->setAccessToken($this->current_token);
	}
	//can trow error
	public function upload_file($file_path, $file_name)
	{
		global $wcuf_file_model;
		$this->file_info_data = array();
		$dropboxFile = new DropboxFile($file_path); 
		$blog_name = get_bloginfo('name');
		$blog_name = $blog_name ? "/".$wcuf_file_model->normalizeStringForFolderName($blog_name) : "";
		$file = $this->dropbox->upload($dropboxFile, $blog_name.$file_name, ['autorename' => true]);  //file.pdf

		//$file is Models\FileMetadata.php type
		if(is_object($file))
		{
			$this->file_info_data['name'] = $file->getName();
			$this->file_info_data['id'] = $file->getId();
			$this->file_info_data['size'] = $file->getSize();
			$this->file_info_data['path_lower'] = $file->getPathLower();
			$this->file_info_data['path_display'] = $file->getPathDisplay();
			$this->file_info_data['media_info'] = $file->getMediaInfo();
		}
				
		return $this->file_info_data;
	}
	public function getTemporaryLink($file_path, $remove_prefix = false)
	{
		$file_path = $remove_prefix ? str_replace(WCUF_DropBox::$dropbox_filepath_prefix, "", $file_path) : $file_path;
		$temporaryLink = $this->dropbox->getTemporaryLink($file_path);
		return $temporaryLink->getLink();
	}
	public function download($file_path, $remove_prefix = false)
	{
		$file_path = $remove_prefix ? str_replace(WCUF_DropBox::$dropbox_filepath_prefix, "", $file_path) : $file_path;
		return $this->dropbox->download($file_path);
	}
	public function delete_file($file_path, $remove_prefix = false)
	{
		$file_path = $remove_prefix ? str_replace(WCUF_DropBox::$dropbox_filepath_prefix, "", $file_path) : $file_path;
		$this->dropbox->delete($file_path);
	}
	//use the one defined in the Globals.php
	public static function is_dropbox_file_path($file_path)
	{
		if(!is_string($file_path))
			return false;
		return strpos($file_path, WCUF_DropBox::$dropbox_filepath_prefix) !== false ? true : false;
	}
	public function render_thumb($image_path)
	{
		//Available sizes: 'thumb', 'small', 'medium', 'large', 'huge'
		$size = 'large'; //Default size

		//Available formats: 'jpeg', 'png'
		$format = $this->get_file_extension($image_path); //Default format
		if($format == false)
			return false;
		
		$image_path = str_replace( WCUF_DropBox::$dropbox_filepath_prefix,"", $image_path);
		$file = $this->dropbox->getThumbnail($image_path, $size, $format);

		//Get File Contents
		$contents = $file->getContents();
		
		//Save File Contents to Disk
		//file_put_contents(__DIR__ . "/my-logo.jpg", $contents);
		switch($format)
			{
					default: 
					case "jpeg":
						header('Content-Type: image/jpeg');
						echo $contents ;
						break;
					case "png":
						header('Content-Type: image/png');
						echo $contents ;
						break;
			} 
			
	}
	private function get_file_extension($file_name) 
	{
		$index = strrchr($file_name,'.');
		$ext = $index != false  ? substr($index,1) : false;
		$ext = $ext != false ? strtolower($ext) : $ext;
		
		if($ext == 'jpg' || $ext == 'jpeg')
			$ext = 'jpeg';
		$ext = $ext != 'jpeg' && $ext != 'png' ? false : $ext;
		
		return $ext;
	}
}
?>