<?php 
require WCUF_PLUGIN_ABS_PATH.'/classes/vendor/google/vendor/autoload.php';

class WCUF_GDrive
{
	var $gdrive_client;
	var $gdrive_service;
	var $current_token;
	static $gdrive_filepath_prefix = 'gdrive:'; 
	public function __construct()
	{
		$this->auth();
	}
	private function auth()
	{
		global $wcuf_option_model;
		$cloud_settings = $wcuf_option_model->get_cloud_settings();
		$token_data = $wcuf_option_model->get_gdrive_token_data();
		
		if(empty($cloud_settings['gdrive_json_auth_file']) || empty($cloud_settings["gdrive_auth_code"]))
			throw new Exception('Google Drive: auth data is not set');
		
		
		$filedir = get_attached_file( $cloud_settings['gdrive_json_auth_file']['id'] );
		
		//Client init
		$this->gdrive_client = new Google\Client();
		$json=file_get_contents($filedir);
		$json=preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $json); //Remove non printable characters
		$config = json_decode($json, true);
		$this->gdrive_client->setAuthConfig($config);
		$this->gdrive_client->setApplicationName("WooCommerce Upload Files");
		$this->gdrive_client->setAccessType('offline');
		$this->gdrive_client->addScope(Google\Service\Drive::DRIVE);
		$this->gdrive_client->addScope(Google\Service\Drive::DRIVE_APPDATA);
		
		$token_data = $token_data == false || $token_data["auth_code"] != $cloud_settings["gdrive_auth_code"] ? false : $token_data; //Account has been changed;
		
		if($token_data)
		{
			$this->gdrive_client->setAccessToken($token_data["access_token"]); 
			$access_token =$this->gdrive_client->getAccessToken();
		}
		else
		{
			$access_token = $this->gdrive_client->fetchAccessTokenWithAuthCode($cloud_settings["gdrive_auth_code"]);
		}
		
		if(isset($access_token['error']))
			throw new Exception('Google Drive: auth data error. Error description: '.$access_token['error_description']);
		
		//Token update management
		if( $this->gdrive_client->isAccessTokenExpired())
		{
			$new_access_token = $this->gdrive_client->fetchAccessTokenWithRefreshToken( $token_data["refresh_token"]);
			if(!isset($new_access_token['error']))
				$wcuf_option_model->update_gdrive_token_data($new_access_token, $token_data["refresh_token"], $cloud_settings["gdrive_auth_code"]); 
		}
		else
		{
			if(isset($access_token['refresh_token'])) //It happens only the first time. Refresh token (usually) is sent only after the first login
				$wcuf_option_model->update_gdrive_token_data($access_token , $access_token['refresh_token'], $cloud_settings["gdrive_auth_code"]);
		}
		
		$this->gdrive_service = new Google\Service\Drive($this->gdrive_client);
	}
	//use the one defined in the Globals.php
	public static function is_gdrive_file_path($file_path)
	{
		if(!is_string($file_path))
			return false;
		return strpos($file_path, WCUF_Gdrive::$gdrive_filepath_prefix) !== false ? true : false;
	}
	private function get_folder_by_name_and_parent($folder_name, $folder_id = "root")
	{
		$params = [ 'pageSize' => 1000,
				  'fields'=>'nextPageToken, files(id, name, parents)',
				];//files(contentHints/thumbnail,fileExtension,iconLink,id,name,size,thumbnailLink,webContentLink,webViewLink,mimeType,parents)
		if( $folder_id != "root") 
			$params['q'] = "'{$folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false";
		else
			$params['q'] = "mimeType='application/vnd.google-apps.folder' and trashed=false";
		$this->gdrive_client->setDefer(false);
		$res = $this->gdrive_service->files->listFiles($params); 
		return $res;
	}
	public function upload_file($file_local_path, $file_name, $folder)
	{
		global $wcuf_option_model;
		$cloud_settings = $wcuf_option_model->get_cloud_settings();
		$cloud_settings["dir_name"] = $cloud_settings['gdrive_root_folder_name']; //
		
		if(empty($cloud_settings['gdrive_root_folder_name']))
			throw new Exception('Google Drive - Folder name is not set');
		
		$folder = $cloud_settings["dir_name"]."/".$folder;
		$sub_folders = explode("/", $folder);
		$folderId = '';
		//Folder management: create if not existing
		$parent_folder_id = "root";
		foreach($sub_folders as $sub_folder)
			if($sub_folder)
			{
				$found = false;
				$res = $this->get_folder_by_name_and_parent($sub_folder, $parent_folder_id);
				foreach($res->getFiles() as $current_file)
				{
					if($current_file->getName() == $sub_folder)
					{
						
						$found = true;
						$folderId = $current_file->getId();
						//parent -> $current_file->getParents()[0];
					}
					if($found)
						break;
				}
				
				if(!$found)
				{
					//When the folder of the folder name is NOT existing, the folder is created by the folder name and the folder ID of the created folder is returned.
					$file = new Google_Service_Drive_DriveFile();
					$file->setName($sub_folder);
					$file->setParents($parent_folder_id == "root" ? 'appDataFolder' : array($folderId));
					$file->setMimeType('application/vnd.google-apps.folder');
					$createdFolder = $this->gdrive_service->files->create($file);
					$folderId = $createdFolder->getId();
					//Permissions
					$permission = new Google_Service_Drive_Permission(array(
					'type' => 'anyone',
					'role' => "reader",
					'additionalRoles' => [],
					'withLink' => true,
					'value' =>'default' 
						  ));
					
					$this->gdrive_service->permissions->create($folderId, $permission, array('fields' => 'id','supportsTeamDrives'=>true));
					
					
				}
				
				
				//next
				$parent_folder_id = $folderId;
			}
		
		if(empty($folderId))
		{
			wcuf_write_log("Google Drive - Could not locate the folder");
			throw new Exception('Google Drive - Could not locate the folder');
		}
		
		//File upload process
		$createdFile = $this->upload_big_file($file_local_path, $file_name, $folderId);
		
		//Simple file upload, useful for small files 
		/* $file = new Google_Service_Drive_DriveFile();
		$file->setName($file_name);
		if($folderId)
			$file->setParents(array($folderId));
		$data = file_get_contents($file_local_path);
		$createdFile = $this->gdrive_service->files->create($file, array(
			'data' => $data,
			'uploadType' => 'multipart'
		)); */
		return $createdFile;
		
	}
	private function upload_big_file($file_local_path, $file_name, $folder_id)
	{
		$file = new Google_Service_Drive_DriveFile();
		$file->setName($file_name);
		if($folder_id)
			$file->setParents(array($folder_id));
		
		$chunkSizeBytes = 1 * 1024 * 1024;

		// Call the API with the media upload, defer so it doesn't immediately return.
		$this->gdrive_client->setDefer(true);
		$request = $this->gdrive_service->files->create($file);

		// Create a media file upload to represent our upload process.
		$media = new Google_Http_MediaFileUpload(
			$this->gdrive_client,
			$request,
			mime_content_type($file_local_path),
			null,
			true,
			$chunkSizeBytes
		);
		$media->setFileSize(filesize($file_local_path));

		// Upload the various chunks. $status will be false until the process is
		// complete.
		$status = false;
		$handle = fopen($file_local_path, "rb");
		while (!$status && !feof($handle)) 
		{
			// read until you get $chunkSizeBytes from $file_path
			// fread will never return more than 8192 bytes if the stream is read
			// buffered and it does not represent a plain file
			// An example of a read buffered file is when reading from a URL
			$chunk = $this->readVideoChunk($handle, $chunkSizeBytes);
			$status = $media->nextChunk($chunk);
		}

		// The final value of $status will be the data from the API for the object
		// that has been uploaded.
		$result = false;
		if ($status != false) {
			$result = $status;
		}

		fclose($handle);
		return $result;
	}
	private function readVideoChunk($handle, $chunkSize)
	{
		$byteCount = 0;
		$giantChunk = "";
		while (!feof($handle)) {
			// fread will never return more than 8192 bytes if the stream is read
			// buffered and it does not represent a plain file
			$chunk = fread($handle, 8192);
			$byteCount += strlen($chunk);
			$giantChunk .= $chunk;
			if ($byteCount >= $chunkSize) {
				return $giantChunk;
			}
		}
		return $giantChunk;
	}
	public function delete_file($file_id, $remove_prefix = false)
	{
		$file_id = $remove_prefix ? str_replace(WCUF_GDrive::$gdrive_filepath_prefix, "", $file_id) : $file_id;
		$this->gdrive_service->files->delete($file_id);
	}
	
}
?>