<?php
/**
 * Class Google\Site_Kit\Core\AI_Insights\REST_AI_Insights_Controller
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\AI_Insights;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling AI Insights via REST API.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class REST_AI_Insights_Controller {

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
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param AI_Insights_Settings $settings  AI Insights settings instance.
	 * @param AI_Insights_API_Key  $api_key   AI Insights API key instance.
	 * @param Insights_Generator   $generator Insights generator instance.
	 */
	public function __construct(
		AI_Insights_Settings $settings,
		AI_Insights_API_Key $api_key,
		Insights_Generator $generator
	) {
		$this->settings  = $settings;
		$this->api_key   = $api_key;
		$this->generator = $generator;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since n.e.x.t
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_manage = function () {
			return current_user_can( Permissions::MANAGE_OPTIONS );
		};

		return array(
			new REST_Route(
				'core/site/data/ai-insights-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response(
								array(
									'enabled'      => $this->settings->is_enabled(),
									'hasApiKey'    => $this->api_key->has(),
									'apiKeyMasked' => $this->api_key->get_masked(),
								)
							);
						},
						'permission_callback' => $can_manage,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$data = $request['data']['settings'];

							if ( array_key_exists( 'enabled', $data ) ) {
								$this->settings->set( array( 'enabled' => (bool) $data['enabled'] ) );
							}

							if ( isset( $data['apiKey'] ) && is_string( $data['apiKey'] ) ) {
								$this->api_key->set( $data['apiKey'] );
							}

							return new WP_REST_Response(
								array(
									'enabled'      => $this->settings->is_enabled(),
									'hasApiKey'    => $this->api_key->has(),
									'apiKeyMasked' => $this->api_key->get_masked(),
								)
							);
						},
						'permission_callback' => $can_manage,
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'settings' => array(
										'type'                 => 'object',
										'required'             => true,
										'additionalProperties' => false,
										'properties'           => array(
											'enabled' => array(
												'type' => 'boolean',
											),
											'apiKey' => array(
												'type' => 'string',
											),
										),
									),
								),
							),
						),
					),
				)
			),
			new REST_Route(
				'core/site/data/ai-insights-generate',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$result = $this->generator->generate(
								$request['data']['metrics'],
								! empty( $request['data']['forceRegenerate'] )
							);

							if ( is_wp_error( $result ) ) {
								return $result;
							}

							return new WP_REST_Response( $result );
						},
						'permission_callback' => $can_manage,
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'metrics' => array(
										'type'     => 'object',
										'required' => true,
									),
									'forceRegenerate' => array(
										'type'    => 'boolean',
										'default' => false,
									),
								),
							),
						),
					),
				)
			),
		);
	}
}
