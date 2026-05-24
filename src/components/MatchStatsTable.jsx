import React from 'react';
import { Table, Empty } from 'antd';

const fmtPct = (v) => v == null ? '—' : `${(v * 100).toFixed(1)}%`;

const COLS = [
  { title: '#', dataIndex: 'jerseyNumber', width: 50 },
  { title: 'Тоглогч', dataIndex: 'fullName', width: 160 },
  { title: 'K', dataIndex: ['stats', 'attack', 'kills'], width: 50, align: 'right' },
  { title: 'E', dataIndex: ['stats', 'attack', 'errors'], width: 50, align: 'right' },
  { title: 'TA', dataIndex: ['stats', 'attack', 'attempts'], width: 50, align: 'right' },
  { title: 'Hit%', width: 70, align: 'right',
    render: (_, r) => fmtPct(r.stats?.attack?.hitPercent) },
  { title: 'A', dataIndex: ['stats', 'set', 'good'], width: 50, align: 'right' },
  { title: 'ACE', dataIndex: ['stats', 'serve', 'aces'], width: 50, align: 'right' },
  { title: 'SE', dataIndex: ['stats', 'serve', 'errors'], width: 50, align: 'right' },
  { title: 'BS', dataIndex: ['stats', 'block', 'stuffs'], width: 50, align: 'right' },
  { title: 'BE', dataIndex: ['stats', 'block', 'errors'], width: 50, align: 'right' },
  { title: 'DIG', dataIndex: ['stats', 'dig', 'good'], width: 50, align: 'right' },
  { title: 'REC', dataIndex: ['stats', 'reception', 'good'], width: 50, align: 'right' },
  { title: 'BHE', dataIndex: ['stats', 'bhe', 'errors'], width: 50, align: 'right' },
  { title: 'PTS', dataIndex: ['stats', 'points'], width: 60, align: 'right',
    render: (v) => <strong style={{ color: '#1A3E8C' }}>{v}</strong> },
];

export default function MatchStatsTable({ players, teamTotals, label }) {
  if (!players || players.length === 0) {
    return <Empty description={`${label}: статистик байхгүй`} style={{ padding: 24 }} />;
  }
  const totalsRow = {
    jerseyNumber: '',
    fullName: 'Багийн нийлбэр',
    stats: teamTotals,
    _isTotal: true,
  };
  const data = [...players, totalsRow];
  return (
    <div>
      <div style={{ marginBottom: 8, fontWeight: 700, color: '#1A3E8C' }}>{label}</div>
      <Table
        size="small"
        rowKey={(r) => r._isTotal ? 'totals' : r.playerId}
        columns={COLS}
        dataSource={data}
        pagination={false}
        scroll={{ x: 950 }}
        rowClassName={(r) => r._isTotal ? 'stats-total-row' : ''}
      />
    </div>
  );
}
