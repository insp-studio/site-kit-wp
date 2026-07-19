/**
 * AIInsightsWidget component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import {
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { useDispatch, useInViewSelect, useSelect } from 'googlesitekit-data';
import PreviewBlock from '@/js/components/PreviewBlock';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { buildMetricsSummary, splitSearchConsoleTrend } from './utils';

export default function AIInsightsWidget( { Widget } ) {
	const [ isGenerating, setIsGenerating ] = useState( false );
	const [ generateError, setGenerateError ] = useState( null );
	const hasRequestedRef = useRef( false );

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( { compare: true } )
	);

	const gaOverviewOptions = {
		...dates,
		metrics: [
			{ name: 'totalUsers' },
			{ name: 'sessions' },
			{ name: 'engagementRate' },
		],
		reportID: 'ai-insights_overview_widget_reportOptions',
	};
	const gaOverviewReport = useInViewSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).getReport( gaOverviewOptions ),
		[ gaOverviewOptions ]
	);

	const gaTopPagesOptions = {
		startDate: dates.startDate,
		endDate: dates.endDate,
		dimensions: [ 'pagePath' ],
		metrics: [ { name: 'activeUsers' } ],
		orderby: [
			{
				metric: { metricName: 'activeUsers' },
				desc: true,
			},
		],
		limit: 10,
		keepEmptyRows: false,
		reportID: 'ai-insights_top-pages_widget_reportOptions',
	};
	const gaTopPagesReport = useInViewSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).getReport( gaTopPagesOptions ),
		[ gaTopPagesOptions ]
	);
	const gaTopPagesTitles = useInViewSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).getPageTitles(
				gaTopPagesReport,
				gaTopPagesOptions
			),
		[ gaTopPagesReport, gaTopPagesOptions ]
	);

	const scTrendOptions = {
		startDate: dates.compareStartDate,
		endDate: dates.endDate,
		dimensions: 'date',
		reportID: 'ai-insights_sc-trend_widget_reportOptions',
	};
	const scTrendReport = useInViewSelect(
		( select ) =>
			select( MODULES_SEARCH_CONSOLE ).getReport( scTrendOptions ),
		[ scTrendOptions ]
	);

	const scQueriesOptions = {
		startDate: dates.startDate,
		endDate: dates.endDate,
		dimensions: 'query',
		limit: 10,
		reportID: 'ai-insights_top-queries_widget_reportOptions',
	};
	const scQueriesRows = useInViewSelect(
		( select ) =>
			select( MODULES_SEARCH_CONSOLE ).getReport( scQueriesOptions ),
		[ scQueriesOptions ]
	);

	const scPagesOptions = {
		startDate: dates.startDate,
		endDate: dates.endDate,
		dimensions: 'page',
		limit: 10,
		reportID: 'ai-insights_top-pages-sc_widget_reportOptions',
	};
	const scPagesRows = useInViewSelect(
		( select ) =>
			select( MODULES_SEARCH_CONSOLE ).getReport( scPagesOptions ),
		[ scPagesOptions ]
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ gaOverviewOptions ]
			) ||
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ gaTopPagesOptions ]
			) ||
			! select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution(
				'getReport',
				[ scTrendOptions ]
			) ||
			! select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution(
				'getReport',
				[ scQueriesOptions ]
			) ||
			! select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution(
				'getReport',
				[ scPagesOptions ]
			) ||
			gaTopPagesTitles === undefined
	);

	const metrics = useMemo( () => {
		if (
			loading ||
			gaOverviewReport === undefined ||
			gaTopPagesReport === undefined ||
			scTrendReport === undefined ||
			scQueriesRows === undefined ||
			scPagesRows === undefined
		) {
			return undefined;
		}

		const scTrend = splitSearchConsoleTrend( scTrendReport, dates );

		return buildMetricsSummary( {
			dates,
			gaOverviewReport,
			gaTopPagesReport,
			gaTopPagesTitles,
			scTrend,
			scQueriesRows,
			scPagesRows,
		} );
	}, [
		dates,
		gaOverviewReport,
		gaTopPagesReport,
		gaTopPagesTitles,
		loading,
		scPagesRows,
		scQueriesRows,
		scTrendReport,
	] );

	const insights = useSelect( ( select ) =>
		select( CORE_SITE ).getAIInsights()
	);
	const { generateAIInsights } = useDispatch( CORE_SITE );

	useEffect( () => {
		if (
			metrics === undefined ||
			insights !== undefined ||
			hasRequestedRef.current ||
			isGenerating
		) {
			return;
		}

		hasRequestedRef.current = true;
		setIsGenerating( true );

		async function generate() {
			const { error } = await generateAIInsights( metrics, false );

			setIsGenerating( false );

			if ( error ) {
				setGenerateError( error );
				hasRequestedRef.current = false;
			}
		}

		generate();
	}, [ metrics, insights, isGenerating, generateAIInsights ] );

	const handleRegenerate = useCallback( async () => {
		setIsGenerating( true );
		setGenerateError( null );

		const { error } = await generateAIInsights( metrics, true );

		setIsGenerating( false );

		if ( error ) {
			setGenerateError( error );
		}
	}, [ generateAIInsights, metrics ] );

	if ( loading || metrics === undefined ) {
		return (
			<Widget>
				<PreviewBlock width="100%" height="250px" />
			</Widget>
		);
	}

	return (
		<Widget>
			<div className="googlesitekit-ai-insights-widget">
				<h3>{ __( 'AI Insights', 'google-site-kit' ) }</h3>
				{ generateError && (
					<p className="googlesitekit-ai-insights-widget__error">
						{ generateError.message }
					</p>
				) }
				{ isGenerating && <PreviewBlock width="100%" height="150px" /> }
				{ ! isGenerating && insights && (
					<Fragment>
						<p>{ insights.summary?.headline }</p>
						{ Array.isArray( insights.summary?.highlights ) && (
							<ul>
								{ insights.summary.highlights.map(
									( highlight ) => (
										<li key={ highlight }>{ highlight }</li>
									)
								) }
							</ul>
						) }
						<h4>
							{ __( 'Improvement ideas', 'google-site-kit' ) }
						</h4>
						<ul>
							{ ( insights.improvements || [] ).map( ( item ) => (
								<li key={ item.title }>
									<strong>{ item.title }</strong>:{ ' ' }
									{ item.description }
								</li>
							) ) }
						</ul>
						<h4>{ __( 'Blog post ideas', 'google-site-kit' ) }</h4>
						<ul>
							{ ( insights.blogIdeas || [] ).map( ( item ) => (
								<li key={ item.title }>
									<strong>{ item.title }</strong>:{ ' ' }
									{ item.description }
								</li>
							) ) }
						</ul>
						<Button
							disabled={ isGenerating }
							onClick={ handleRegenerate }
						>
							{ __( 'Regenerate', 'google-site-kit' ) }
						</Button>
					</Fragment>
				) }
			</div>
		</Widget>
	);
}

AIInsightsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
