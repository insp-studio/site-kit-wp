/**
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
 * Aggregates Search Console rows into current and previous period totals.
 *
 * @since n.e.x.t
 *
 * @param {Array}  rows  Search Console report rows with a `date` dimension.
 * @param {Object} dates Object with date ranges for the current and previous periods.
 * @return {Object} Object with `current` and `previous` period totals.
 */
export function splitSearchConsoleTrend( rows, dates ) {
	const { startDate, endDate, compareStartDate, compareEndDate } = dates;

	function aggregate( periodRows ) {
		const clicks = periodRows.reduce(
			( sum, row ) => sum + ( Number( row.clicks ) || 0 ),
			0
		);
		const impressions = periodRows.reduce(
			( sum, row ) => sum + ( Number( row.impressions ) || 0 ),
			0
		);
		const weightedPosition = periodRows.reduce(
			( sum, row ) =>
				sum +
				( Number( row.position ) || 0 ) *
					( Number( row.impressions ) || 0 ),
			0
		);

		return {
			clicks,
			impressions,
			ctr: impressions > 0 ? clicks / impressions : 0,
			position: impressions > 0 ? weightedPosition / impressions : 0,
		};
	}

	const safeRows = Array.isArray( rows ) ? rows : [];

	const currentRows = safeRows.filter( ( row ) => {
		const date = row?.keys?.[ 0 ];
		return date >= startDate && date <= endDate;
	} );

	const previousRows = safeRows.filter( ( row ) => {
		const date = row?.keys?.[ 0 ];
		return date >= compareStartDate && date <= compareEndDate;
	} );

	return {
		current: aggregate( currentRows ),
		previous: aggregate( previousRows ),
	};
}

/**
 * Builds the metrics summary object sent to the AI Insights generate endpoint.
 *
 * @since n.e.x.t
 *
 * @param {Object} args                  Named arguments.
 * @param {Object} args.dates            Current and comparison date ranges.
 * @param {Object} args.gaOverviewReport GA4 overview report.
 * @param {Object} args.gaTopPagesReport GA4 top pages report.
 * @param {Object} args.gaTopPagesTitles GA4 page titles keyed by page path.
 * @param {Object} args.scTrend          Search Console period totals.
 * @param {Array}  args.scQueriesRows    Search Console top query rows.
 * @param {Array}  args.scPagesRows      Search Console top page rows.
 * @return {Object} Metrics summary object.
 */
export function buildMetricsSummary( {
	dates,
	gaOverviewReport,
	gaTopPagesReport,
	gaTopPagesTitles,
	scTrend,
	scQueriesRows,
	scPagesRows,
} ) {
	const gaTotalsCurrent = gaOverviewReport?.totals?.[ 0 ]?.metricValues || [];
	const gaTotalsPrevious =
		gaOverviewReport?.totals?.[ 1 ]?.metricValues || [];

	function gaMetric( index ) {
		return {
			current: Number( gaTotalsCurrent[ index ]?.value ) || 0,
			previous: Number( gaTotalsPrevious[ index ]?.value ) || 0,
		};
	}

	const gaTopPagesRows = gaTopPagesReport?.rows || [];
	const safeScQueriesRows = Array.isArray( scQueriesRows )
		? scQueriesRows
		: [];
	const safeScPagesRows = Array.isArray( scPagesRows ) ? scPagesRows : [];

	return {
		dateRange: {
			startDate: dates.startDate,
			endDate: dates.endDate,
			compareStartDate: dates.compareStartDate,
			compareEndDate: dates.compareEndDate,
		},
		analytics: {
			totalUsers: gaMetric( 0 ),
			sessions: gaMetric( 1 ),
			engagementRate: gaMetric( 2 ),
			topPages: gaTopPagesRows.map( ( row ) => {
				const pagePath = row?.dimensionValues?.[ 0 ]?.value || '';

				return {
					pagePath,
					title: gaTopPagesTitles?.[ pagePath ] || '',
					activeUsers: Number( row?.metricValues?.[ 0 ]?.value ) || 0,
				};
			} ),
		},
		searchConsole: {
			clicks: {
				current: scTrend.current.clicks,
				previous: scTrend.previous.clicks,
			},
			impressions: {
				current: scTrend.current.impressions,
				previous: scTrend.previous.impressions,
			},
			ctr: {
				current: scTrend.current.ctr,
				previous: scTrend.previous.ctr,
			},
			position: {
				current: scTrend.current.position,
				previous: scTrend.previous.position,
			},
			topQueries: safeScQueriesRows.map( ( row ) => ( {
				query: row?.keys?.[ 0 ] || '',
				clicks: Number( row?.clicks ) || 0,
				impressions: Number( row?.impressions ) || 0,
				ctr: Number( row?.ctr ) || 0,
				position: Number( row?.position ) || 0,
			} ) ),
			topPages: safeScPagesRows.map( ( row ) => ( {
				page: row?.keys?.[ 0 ] || '',
				clicks: Number( row?.clicks ) || 0,
				impressions: Number( row?.impressions ) || 0,
				ctr: Number( row?.ctr ) || 0,
				position: Number( row?.position ) || 0,
			} ) ),
		},
	};
}
