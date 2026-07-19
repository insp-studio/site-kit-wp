/**
 * SettingsAIInsights component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, Switch, TextField } from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { Cell, Row } from '@/js/material-components';

export default function SettingsAIInsights() {
	const [ apiKeyInput, setApiKeyInput ] = useState( '' );
	const [ enabledDraft, setEnabledDraft ] = useState( false );
	const hasSyncedEnabled = useRef( false );

	const { settings, isEnabled, hasApiKey, apiKeyMasked, isSaving } =
		useSelect( ( select ) => {
			const site = select( CORE_SITE );
			const aiInsightsSettings = site.getAIInsightsSettings();

			return {
				settings: aiInsightsSettings,
				isEnabled: site.isAIInsightsEnabled(),
				hasApiKey: site.hasAIInsightsAPIKey(),
				apiKeyMasked: site.getAIInsightsAPIKeyMasked(),
				isSaving:
					site.isFetchingSaveAIInsightsSettings( aiInsightsSettings ),
			};
		} );

	const {
		setAIInsightsEnabled,
		setAIInsightsAPIKey,
		saveAIInsightsSettings,
	} = useDispatch( CORE_SITE );

	useEffect( () => {
		if ( isEnabled !== undefined && ! hasSyncedEnabled.current ) {
			setEnabledDraft( isEnabled );
			hasSyncedEnabled.current = true;
		}
	}, [ isEnabled ] );

	const handleSave = useCallback( async () => {
		if ( apiKeyInput !== '' ) {
			await setAIInsightsAPIKey( apiKeyInput );
		}

		await setAIInsightsEnabled( enabledDraft );
		const { error } = await saveAIInsightsSettings();

		if ( ! error ) {
			setApiKeyInput( '' );
		}
	}, [
		apiKeyInput,
		enabledDraft,
		saveAIInsightsSettings,
		setAIInsightsAPIKey,
		setAIInsightsEnabled,
	] );

	if ( settings === undefined ) {
		return null;
	}

	const helperText = hasApiKey
		? sprintf(
				/* translators: %s is the masked OpenAI API key. */
				__(
					'Configured API key: %s (entering a new value will overwrite it)',
					'google-site-kit'
				),
				apiKeyMasked
		  )
		: __( 'No OpenAI API key is configured.', 'google-site-kit' );

	return (
		<div className="googlesitekit-settings-ai-insights__fields">
			<Row>
				<Cell size={ 12 }>
					<Switch
						label={ __( 'Enable AI Insights', 'google-site-kit' ) }
						checked={ enabledDraft }
						onClick={ () =>
							setEnabledDraft( ( enabled ) => ! enabled )
						}
						hideLabel={ false }
					/>
				</Cell>
			</Row>
			<Row>
				<Cell size={ 12 }>
					<div className="googlesitekit-settings-module__fields-group">
						<TextField
							type="password"
							label={ __( 'OpenAI API key', 'google-site-kit' ) }
							helperText={ helperText }
							value={ apiKeyInput }
							onChange={ ( { currentTarget } ) =>
								setApiKeyInput( currentTarget.value )
							}
							outlined
						/>
					</div>
				</Cell>
			</Row>
			<Row>
				<Cell size={ 12 }>
					<Button disabled={ isSaving } onClick={ handleSave }>
						{ __( 'Save', 'google-site-kit' ) }
					</Button>
				</Cell>
			</Row>
		</div>
	);
}
