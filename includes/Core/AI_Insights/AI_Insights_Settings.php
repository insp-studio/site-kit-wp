<?php
/**
 * Class Google\Site_Kit\Core\AI_Insights\AI_Insights_Settings
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\AI_Insights;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for AI Insights settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class AI_Insights_Settings extends Setting {

	/**
	 * The option name for this setting.
	 */
	const OPTION = 'googlesitekit_ai_insights_settings';

	/**
	 * Returns the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type of the setting.
	 */
	public function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'enabled' => false,
		);
	}

	/**
	 * Gets the sanitize callback.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable The sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			$new_value = $this->get();

			if ( isset( $value['enabled'] ) ) {
				$new_value['enabled'] = (bool) $value['enabled'];
			}

			return $new_value;
		};
	}

	/**
	 * Checks whether AI Insights is enabled.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if AI Insights is enabled, false otherwise.
	 */
	public function is_enabled() {
		$settings = $this->get();

		return ! empty( $settings['enabled'] );
	}
}
