<?php 
class WCUF_WCPriceCalculatorMeasurementHelper
{
	public function __construct()
	{
	}
	public function is_active()
	{
		return class_exists('WC_Price_Calculator_Product');
	}
	public function display_product_data_in_cart( $data, $item ) {

		if ( isset( $item['pricing_item_meta_data'] ) ) {

			$display_data = $this->humanize_cart_item_data( $item, $item['pricing_item_meta_data'] );

			foreach ( $display_data as $name => $value ) {
				$data[] = array( 'name' => $name, 'display' => $value, 'hidden' => false );
			}
		}

		return $data;
	}
	private function humanize_cart_item_data( $item, $cart_item_data ) {

		$new_cart_item_data = array();

		// always need the actual parent product, not the useless variation product
		$product = isset( $item['variation_id'] ) && $item['variation_id'] ? wc_get_product( $item['product_id'] ) : $item['data'];

		$settings = new WC_Price_Calculator_Settings( $product );

		foreach ( $settings->get_calculator_measurements() as $measurement ) 
		{
			if ( isset( $cart_item_data[ $measurement->get_name() ] ) ) 
			{

				if ( count( $measurement->get_options() ) > 0 ) {
					foreach ( $measurement->get_options() as $value => $label ) {
						
					}
				}

				$label = $measurement->get_unit_label() ?
					sprintf( '%1$s (%2$s)', $measurement->get_label(), esc_html__( $measurement->get_unit_label(), 'woocommerce-measurement-price-calculator' ) ) :
					__( $measurement->get_label(), 'woocommerce-measurement-price-calculator' );

				$new_cart_item_data[ $label ] = $cart_item_data[ $measurement->get_name() ];
			}
		}

		// render the total measurement if this is a derived calculator (ie "Area (sq. ft.): 10" if the calculator is Area (LxW))
		if ( $settings->is_calculator_type_derived() && isset( $cart_item_data['_measurement_needed'] ) ) 
		{
			// get the product total measurement (ie area or volume)
			$product_measurement = WC_Price_Calculator_Product::get_product_measurement( $product, $settings );
			$product_measurement->set_unit( $cart_item_data['_measurement_needed_unit'] );
			$product_measurement->set_value( $cart_item_data['_measurement_needed'] );

			$total_amount_text = apply_filters(
				'wc_measurement_price_calculator_total_amount_text',
				$product_measurement->get_unit_label() ?
					sprintf( esc_html__( 'Total %1$s (%2$s)', 'woocommerce-measurement-price-calculator' ), $product_measurement->get_label(), esc_html__( $product_measurement->get_unit_label(), 'woocommerce-measurement-price-calculator' ) ) :
					sprintf( esc_html__( 'Total %s', 'woocommerce-measurement-price-calculator' ), $product_measurement->get_label() ),
				$item
			);
			$new_cart_item_data[ $total_amount_text ] = $product_measurement->get_value();
		}

		return $new_cart_item_data;
	}
}
?>