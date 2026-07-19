<?php
/**
 * Class Google\Site_Kit\Core\AI_Insights\Insights_Generator
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\AI_Insights;

use WP_Error;

/**
 * Class for generating AI Insights.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Insights_Generator {

	/**
	 * OpenAI Chat Completions API URL.
	 */
	const API_URL = 'https://api.openai.com/v1/chat/completions';

	/**
	 * OpenAI model used to generate insights.
	 */
	const MODEL = 'gpt-5.1';

	/**
	 * Cache lifetime in seconds.
	 */
	const CACHE_TTL = 43200;

	/**
	 * Cache key prefix.
	 */
	const CACHE_KEY_PREFIX = 'googlesitekit_ai_insights_';

	/**
	 * AI Insights API key instance.
	 *
	 * @since n.e.x.t
	 * @var AI_Insights_API_Key
	 */
	private $api_key;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param AI_Insights_API_Key $api_key AI Insights API key instance.
	 */
	public function __construct( AI_Insights_API_Key $api_key ) {
		$this->api_key = $api_key;
	}

	/**
	 * Generates AI Insights from the supplied metrics.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $metrics          Aggregated Analytics and Search Console metrics.
	 * @param bool  $force_regenerate Optional. Whether to bypass the cache. Default false.
	 * @return array|WP_Error Generated insights or an error.
	 */
	public function generate( array $metrics, $force_regenerate = false ) {
		if ( ! $this->api_key->has() ) {
			return new WP_Error(
				'ai_insights_no_api_key',
				__( 'OpenAI APIキーが設定されていません。', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		$cache_key = self::CACHE_KEY_PREFIX . md5( wp_json_encode( $metrics ) );

		if ( ! $force_regenerate ) {
			$cached_result = get_transient( $cache_key );

			if ( is_array( $cached_result ) ) {
				$cached_result['cached'] = true;

				return $cached_result;
			}
		}

		$prompt   = $this->build_prompt( $metrics );
		$response = wp_remote_post(
			self::API_URL,
			array(
				'timeout' => 45,
				'headers' => array(
					'Authorization' => 'Bearer ' . $this->api_key->get(),
					'Content-Type'  => 'application/json',
				),
				'body'    => wp_json_encode(
					array(
						'model'           => self::MODEL,
						'max_tokens'      => 2048,
						'response_format' => array( 'type' => 'json_object' ),
						'messages'        => array(
							array(
								'role'    => 'system',
								'content' => $this->get_system_prompt(),
							),
							array(
								'role'    => 'user',
								'content' => $prompt,
							),
						),
					)
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'ai_insights_generation_failed',
				$response->get_error_message(),
				array( 'status' => 502 )
			);
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 > $response_code || 299 < $response_code ) {
			$message = __( 'OpenAI APIへのリクエストに失敗しました。', 'google-site-kit' );

			if (
				is_array( $response_body )
				&& ! empty( $response_body['error'] )
				&& is_array( $response_body['error'] )
				&& ! empty( $response_body['error']['message'] )
			) {
				$message = $response_body['error']['message'];
			}

			return new WP_Error(
				'ai_insights_generation_failed',
				$message,
				array( 'status' => 502 )
			);
		}

		$raw_text = '';
		if (
			isset( $response_body['choices'][0]['message']['content'] )
			&& is_string( $response_body['choices'][0]['message']['content'] )
		) {
			$raw_text = $response_body['choices'][0]['message']['content'];
		}

		$raw_text = preg_replace( '/^```(?:json)?\s*|\s*```$/i', '', trim( $raw_text ) );
		$decoded  = json_decode( trim( $raw_text ), true );

		if (
			! is_array( $decoded )
			|| ! array_key_exists( 'improvements', $decoded )
			|| ! array_key_exists( 'blogIdeas', $decoded )
			|| ! array_key_exists( 'summary', $decoded )
		) {
			return new WP_Error(
				'ai_insights_invalid_response',
				__( 'OpenAI APIから予期しない形式の応答を受け取りました。', 'google-site-kit' ),
				array( 'status' => 502 )
			);
		}

		$result = array(
			'improvements' => $decoded['improvements'],
			'blogIdeas'    => $decoded['blogIdeas'],
			'summary'      => $decoded['summary'],
			'generatedAt'  => time(),
			'cached'       => false,
		);

		set_transient( $cache_key, $result, self::CACHE_TTL );

		return $result;
	}

	/**
	 * Builds the user prompt from the supplied metrics.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $metrics Aggregated Analytics and Search Console metrics.
	 * @return string The user prompt.
	 */
	private function build_prompt( array $metrics ) {
		return '以下はWordPressサイトのGoogle AnalyticsおよびGoogle Search Consoleの直近期間データと、その前の比較期間データです。'
			. 'このデータをもとに、サイト改善提案とブログ記事アイデアを日本語で提案してください。'
			. "\n\n"
			. wp_json_encode( $metrics )
			. "\n\n"
			. $this->get_output_format_instructions();
	}

	/**
	 * Gets the system prompt.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The system prompt.
	 */
	private function get_system_prompt() {
		return 'あなたはSEOとコンテンツ戦略に精通したWebサイト改善コンサルタントです。'
			. '与えられたAnalyticsとSearch Consoleのデータを分析し、具体的で実行可能な改善提案とブログ記事アイデアを日本語で提示します。';
	}

	/**
	 * Gets the required output format instructions.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The output format instructions.
	 */
	private function get_output_format_instructions() {
		return <<<'TEXT'
以下のJSON形式のみで回答してください。
{
  "summary": { "headline": "...", "highlights": ["...", "..."] },
  "improvements": [ { "title": "...", "description": "...", "priority": "high|medium|low" } ],
  "blogIdeas": [ { "title": "...", "description": "...", "targetQuery": "..." } ]
}
前後に説明文やMarkdownのコードフェンスを含めないでください。
TEXT;
	}
}
