import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Horizontal stacked bar chart for showing the breakdown of points by
// category (Attack kills, Aces, Block stuffs, Opponent errors). Used on
// the team detail and tournament leaderboard pages.
export default function StatBarChart({ categories, series, height = 280, title }) {
  const options = useMemo(() => ({
    chart: { type: 'bar', height, backgroundColor: 'transparent' },
    title: title ? { text: title, style: { fontSize: 13 } } : { text: undefined },
    xAxis: { categories, labels: { style: { fontSize: 11 } } },
    yAxis: { min: 0, title: { text: null }, gridLineColor: 'rgba(0,0,0,0.06)' },
    legend: { enabled: series.length > 1, reversed: true },
    plotOptions: {
      bar: { stacking: 'normal', dataLabels: { enabled: false } },
    },
    tooltip: { shared: true },
    credits: { enabled: false },
    series,
  }), [categories, series, height, title]);

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
