/**
 * `core/site` data store: AI Insights settings.
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
 * External dependencies
 */
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	combineStores,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';
import { CORE_SITE } from './constants';

const baseInitialState = {
	aiInsights: {
		settings: undefined,
		savedSettings: undefined,
		insights: undefined,
	},
};

const settingsReducerCallback = createReducer( ( state, settings ) => {
	state.aiInsights.settings = settings;
	state.aiInsights.savedSettings = settings;
} );

const fetchGetAIInsightsSettingsStore = createFetchStore( {
	baseName: 'getAIInsightsSettings',
	controlCallback: () =>
		get( 'core', 'site', 'ai-insights-settings', undefined, {
			useCache: false,
		} ),
	reducerCallback: settingsReducerCallback,
} );

const fetchSaveAIInsightsSettingsStore = createFetchStore( {
	baseName: 'saveAIInsightsSettings',
	controlCallback: ( settings ) =>
		set( 'core', 'site', 'ai-insights-settings', { settings } ),
	reducerCallback: settingsReducerCallback,
	argsToParams: ( settings ) => settings,
	validateParams: ( settings ) => {
		invariant(
			isPlainObject( settings ),
			'AI Insights settings should be an object.'
		);
	},
	isAction: true,
} );

const fetchGenerateAIInsightsStore = createFetchStore( {
	baseName: 'generateAIInsights',
	controlCallback: ( { metrics, forceRegenerate } ) =>
		set( 'core', 'site', 'ai-insights-generate', {
			metrics,
			forceRegenerate,
		} ),
	reducerCallback: createReducer( ( state, insights ) => {
		state.aiInsights.insights = insights;
	} ),
	argsToParams: ( args ) => args,
	validateParams: ( { metrics } = {} ) => {
		invariant( isPlainObject( metrics ), 'metrics should be an object.' );
	},
	isAction: true,
} );

const SET_AI_INSIGHTS_ENABLED = 'SET_AI_INSIGHTS_ENABLED';
const SET_AI_INSIGHTS_API_KEY = 'SET_AI_INSIGHTS_API_KEY';

const baseActions = {
	/**
	 * Saves the AI Insights settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveAIInsightsSettings() {
		const { select } = yield commonActions.getRegistry();
		const settings = select( CORE_SITE ).getAIInsightsSettings();

		const results =
			yield fetchSaveAIInsightsSettingsStore.actions.fetchSaveAIInsightsSettings(
				settings
			);

		return results;
	},

	/**
	 * Sets whether AI Insights is enabled.
	 *
	 * @since n.e.x.t
	 *
	 * @param {*} enabled Whether AI Insights is enabled.
	 * @return {Object} Redux-style action.
	 */
	setAIInsightsEnabled( enabled ) {
		invariant(
			typeof enabled === 'boolean',
			'enabled should be a boolean.'
		);

		return {
			type: SET_AI_INSIGHTS_ENABLED,
			payload: { enabled },
		};
	},

	/**
	 * Sets the AI Insights API key.
	 *
	 * @since n.e.x.t
	 *
	 * @param {*} apiKey OpenAI API key.
	 * @return {Object} Redux-style action.
	 */
	setAIInsightsAPIKey( apiKey ) {
		invariant( typeof apiKey === 'string', 'apiKey should be a string.' );

		return {
			type: SET_AI_INSIGHTS_API_KEY,
			payload: { apiKey },
		};
	},

	/**
	 * Generates AI Insights for the supplied metrics.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} metrics Metrics used to generate insights.
	 * @return {Object} Object with `response` and `error`.
	 */
	generateAIInsights: createValidatedAction(
		( metrics ) => {
			invariant(
				isPlainObject( metrics ),
				'metrics should be an object.'
			);
		},
		function* ( metrics, forceRegenerate = false ) {
			const results =
				yield fetchGenerateAIInsightsStore.actions.fetchGenerateAIInsights(
					{ metrics, forceRegenerate }
				);

			return results;
		}
	),
};

export const baseReducer = createReducer( ( state, action ) => {
	const { type, payload } = action;

	switch ( type ) {
		case SET_AI_INSIGHTS_ENABLED: {
			state.aiInsights.settings = {
				...state.aiInsights.settings,
				enabled: payload.enabled,
			};
			break;
		}
		case SET_AI_INSIGHTS_API_KEY: {
			state.aiInsights.settings = {
				...state.aiInsights.settings,
				apiKey: payload.apiKey,
			};
			break;
		}
		default:
			break;
	}
} );

const baseResolvers = {
	*getAIInsightsSettings() {
		const registry = yield commonActions.getRegistry();
		const settings = registry.select( CORE_SITE ).getAIInsightsSettings();

		if ( settings === undefined ) {
			yield fetchGetAIInsightsSettingsStore.actions.fetchGetAIInsightsSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the AI Insights settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} AI Insights settings; `undefined` if not loaded.
	 */
	getAIInsightsSettings( state ) {
		return state.aiInsights?.settings;
	},

	/**
	 * Determines whether AI Insights is enabled.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(boolean|undefined)} TRUE if AI Insights is enabled, otherwise FALSE; `undefined` if not loaded.
	 */
	isAIInsightsEnabled: createRegistrySelector( ( select ) => () => {
		const { enabled } = select( CORE_SITE ).getAIInsightsSettings() || {};

		return enabled;
	} ),

	/**
	 * Determines whether an OpenAI API key is configured.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(boolean|undefined)} TRUE if an API key is configured, otherwise FALSE; `undefined` if not loaded.
	 */
	hasAIInsightsAPIKey: createRegistrySelector( ( select ) => () => {
		const { hasApiKey } = select( CORE_SITE ).getAIInsightsSettings() || {};

		return hasApiKey;
	} ),

	/**
	 * Gets the masked OpenAI API key.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(string|undefined)} Masked API key; `undefined` if not loaded.
	 */
	getAIInsightsAPIKeyMasked: createRegistrySelector( ( select ) => () => {
		const { apiKeyMasked } =
			select( CORE_SITE ).getAIInsightsSettings() || {};

		return apiKeyMasked;
	} ),

	/**
	 * Gets the generated AI Insights.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Generated AI Insights; `undefined` if not loaded.
	 */
	getAIInsights( state ) {
		return state.aiInsights?.insights;
	},
};

const store = combineStores(
	fetchGetAIInsightsSettingsStore,
	fetchSaveAIInsightsSettingsStore,
	fetchGenerateAIInsightsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
