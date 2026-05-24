import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// We need the radar/polar module. Highcharts ships it as a separate file.
import 'highcharts/highcharts-more';

// Radar chart visualising a single stat profile (attack / block / serve /
// reception / dig / set efficiency). Used on PlayerProfilePage and
// TeamDetailPage to show the strengths/weaknesses of a player/team in one
// glance, against either zero (career view) or a comparison series.
//
// Each axis uses a 0–100 normalised score derived from the underlying
// attempts/successes columns. The actual normalisation lives in the page
// callers because match-level vs tournament-level vs career-level need
// slightly different rules.
export default function StatRadarChart({ title, primary, comparison, height = 320 }) {
  const series = useMemo(() => {
    const out = [{
      name: primary.name,
      data: primary.data,
      pointPlacement: 'on',
      color: '#1A3E8C',
      fillOpacity: 0.25,
    }];
    if (comparison) {
      out.push({
        name: comparison.name,
        data: comparison.data,
        pointPlacement: 'on',
        color: '#FFD000',
        fillOpacity: 0.18,
      });
    }
    return out;
  }, [primary, comparison]);

  const options = useMemo(() => ({
    chart: {
      polar: true,
      type: 'area',
      height,
      backgroundColor: 'transparent',
    },
    title: title ? { text: title, style: { fontSize: 14 } } : { text: undefined },
    pane: { size: '90%' },
    xAxis: {
      categories: primary.categories,
      tickmarkPlacement: 'on',
      lineWidth: 0,
      labels: { style: { fontSize: 11 } },
    },
    yAxis: {
      gridLineInterpolation: 'polygon',
      lineWidth: 0,
      min: 0,
      max: 100,
      tickInterval: 25,
      labels: { enabled: false },
    },
    tooltip: {
      shared: true,
      pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y}</b></span><br/>',
    },
    legend: { enabled: !!comparison },
    credits: { enabled: false },
    series,
  }), [title, height, primary.categories, series, comparison]);

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
