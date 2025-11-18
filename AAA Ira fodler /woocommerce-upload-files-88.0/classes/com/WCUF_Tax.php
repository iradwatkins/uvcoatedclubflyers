<?php 
class WCUF_Tax
{
	function __construct()
	{
	}
	static function get_product_price_including_tax($product)
	{
		if(function_exists ('wc_get_price_including_tax'))
			return wc_get_price_including_tax($product);
			
		else return $product->get_price_including_tax();
	}
	static function get_product_price_excluding_tax($product)
	{
		if(function_exists ('wc_get_price_excluding_tax'))
			return wc_get_price_excluding_tax($product);
			
		else return $product->get_price_excluding_tax();
	}
	static function apply_tax_to_price($product, $price)
	{
		$base_price_ex_tax =  WCUF_Tax::get_product_price_excluding_tax($product);
		$base_price_inc_tax =  WCUF_Tax::get_product_price_including_tax($product);
			
		$perc = $base_price_inc_tax/$base_price_ex_tax;
		
		return $price * $perc;
	}
}
?>