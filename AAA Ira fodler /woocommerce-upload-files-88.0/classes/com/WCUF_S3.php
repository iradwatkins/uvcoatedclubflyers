<?php 
require WCUF_PLUGIN_ABS_PATH.'/classes/vendor/amazon/vendor/autoload.php';
use Aws\S3\MultipartUploader;
use Aws\S3\S3Client;

class WCUF_S3
{
	var $s3_client;
	var $bucket_name;
	static $s3_filepath_prefix = 's3:'; 
	public function __construct()
	{
		global $wcuf_option_model;
		$cloud_settings = $wcuf_option_model->get_cloud_settings();
		$this->bucket_name = $cloud_settings['s3_bucket_name'];
		try
		{
			$this->s3_client = new S3Client([				 //https://docs.aws.amazon.com/aws-sdk-php/v3/api/class-Aws.AwsClient.html
				'version' => 'latest',
				'region'  => $cloud_settings['s3_region'], //zone list: https://docs.aws.amazon.com/general/latest/gr/rande.html
				 'credentials' => [  	 				   //create: https://console.aws.amazon.com/iam/home?#/users ---> permissions: AmazonS3FullAccess 
						'key'    => $cloud_settings['s3_access_key_id'],
						'secret' => $cloud_settings['s3_secret_access_key']
					]
			]);
		}
		catch(Error $e)
		{
			
			wcuf_write_log("S3 error on creating the connector: ".$e->getMessage());
			throw new Exception();
		}
	}
	//use the one defined in the Globals.php
	public static function is_s3_file_path($file_path)
	{
		if(!is_string($file_path))
			return false;
		return strpos($file_path, WCUF_S3::$s3_filepath_prefix) !== false ? true : false;
	}
	public function upload_file($filename, $params = array())
	{
		try 
		{
			$file = fopen($filename, 'r');
			$partNumber = 1;
			$bucket = $this->bucket_name;
			$key =  ltrim($params['key'], '/').basename($filename);
			$uploadId = rand(123,9999999);
			/* 
				** doc: https://docs.aws.amazon.com/aws-sdk-php/v3/api/class-Aws.S3.MultipartUploader.html
				** adv: https://docs.aws.amazon.com/AmazonS3/latest/dev/LLuploadFilePHP.html
			*/
			$uploader = new MultipartUploader($this->s3_client, $filename, [
					'bucket' => $bucket,
					'key'    => $key, //naming guide: https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html
					
				]);
			$result = $uploader->upload();
		} 
		catch (Exception  $e)  //MultipartUploadException
		{
			
			wcuf_write_log("S3 upload process of {$filename} failed. Error:".$e->getMessage());
			throw $e;
		}
		return $result;
	}
	public function delete_file($file_path, $remove_prefix = false)
	{
		$file_path = $remove_prefix ? str_replace(WCUF_S3::$s3_filepath_prefix, "", $file_path) : $file_path;
		$result = $this->s3_client->deleteObject([ //https://docs.aws.amazon.com/aws-sdk-php/v3/api/api-s3-2006-03-01.html#deleteobject
			'Bucket' => $this->bucket_name,
			'Key' 	 => $file_path
			]);		
			
		return $result;
	}
	public function get_file($file_path)
	{
		$cmd = $this->s3_client->getCommand('GetObject', [
				'Bucket' => $this->bucket_name,
				'Key'    => $file_path
			]);

		//The period of availability
		$request = $this->s3_client->createPresignedRequest($cmd, '+20 minutes');

		//Get the pre-signed URL
		$signedUrl = (string) $request->getUri();
			
		return $signedUrl;
	}
	
}
?>