<?php
/**
 * Class Google\Site_Kit\Core\AI_Insights\AI_Insights
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\AI_Insights;

use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Main class for AI Insights.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class AI_Insights {

	/**
	 * AI Insights settings instance.
	 *
	 * @since n.e.x.t
	 * @var AI_Insights_Settings
	 */
	private $settings;

	/**
	 * AI Insights API key instance.
	 *
	 * @since n.e.x.t
	 * @var AI_Insights_API_Key
	 */
	private $api_key;

	/**
	 * Insights generator instance.
	 *
	 * @since n.e.x.t
	 * @var Insights_Generator
	 */
	private $generator;

	/**
	 * REST controller instance.
	 *
	 * @since n.e.x.t
	 * @var REST_AI_Insights_Controller
	 */
	private $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Options $options Options instance.
	 */
	public function __construct( Options $options ) {
		$this->settings        = new AI_Insights_Settings( $options );
		$this->api_key         = new AI_Insights_API_Key( new Encrypted_Options( $options ) );
		$this->generator       = new Insights_Generator( $this->api_key );
		$this->rest_controller = new REST_AI_Insights_Controller( $this->settings, $this->api_key, $this->generator );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->rest_controller->register();
	}
}
