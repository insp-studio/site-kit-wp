<?php
/**
 * Class Google\Site_Kit\Core\AI_Insights\AI_Insights_API_Key
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\AI_Insights;

use Google\Site_Kit\Core\Storage\Encrypted_Options;

/**
 * Class for managing the AI Insights API key.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class AI_Insights_API_Key {

	/**
	 * The option name for the API key.
	 */
	const OPTION = 'googlesitekit_ai_insights_api_key';

	/**
	 * Encrypted options instance.
	 *
	 * @since n.e.x.t
	 * @var Encrypted_Options
	 */
	private $encrypted_options;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Encrypted_Options $encrypted_options Encrypted options instance.
	 */
	public function __construct( Encrypted_Options $encrypted_options ) {
		$this->encrypted_options = $encrypted_options;
	}

	/**
	 * Checks whether a non-empty API key is stored.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if a non-empty API key is stored, false otherwise.
	 */
	public function has() {
		return $this->encrypted_options->has( self::OPTION ) && '' !== $this->get();
	}

	/**
	 * Gets the stored API key.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The stored API key, or an empty string if unavailable.
	 */
	public function get() {
		$api_key = $this->encrypted_options->get( self::OPTION );

		return is_string( $api_key ) ? $api_key : '';
	}

	/**
	 * Sets or deletes the API key.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $api_key API key to store.
	 * @return bool True on success, false on failure.
	 */
	public function set( $api_key ) {
		$api_key = trim( $api_key );

		if ( '' === $api_key ) {
			return $this->encrypted_options->delete( self::OPTION );
		}

		return $this->encrypted_options->set( self::OPTION, $api_key );
	}

	/**
	 * Gets a masked representation of the stored API key.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The masked API key.
	 */
	public function get_masked() {
		$api_key = $this->get();

		if ( '' === $api_key ) {
			return '';
		}

		if ( 4 >= strlen( $api_key ) ) {
			return str_repeat( '*', strlen( $api_key ) );
		}

		return str_repeat( '*', strlen( $api_key ) - 4 ) . substr( $api_key, -4 );
	}
}
