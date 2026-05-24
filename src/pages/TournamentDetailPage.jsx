import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Tabs, Tag, Empty, Avatar, Skeleton, Table, Card, Button, Modal,
  Select, Input, message, Segmented, Form,
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, TeamOutlined, TrophyOutlined,
  PlusOutlined, ManOutlined, WomanOutlined, FireOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { tournaments as api, teams as teamsApi, registrations as regApi } from '../api';
import { subscribeTournament } from '../api/socket';
import { isAdmin, isCoach } from '../utils/permissions';

const FORMAT_LABEL = {
  'round-robin': 'Round-robin',
  'single-elim': 'Single-elimination',
  'double-elim': 'Double-elimination',
  'group-knockout': 'Хэсэг + плэйофф',
  'league': 'Лиг',
};

const STATUS_LABEL = {
  DRAFT:    { className: 'muted',   label: 'Ноорог' },
  ONGOING:  { className: 'live',    label: 'Явагдаж буй' },
  FINISHED: { className: 'success', label: 'Дууссан' },
};

const LEADERBOARDS = [
  { metric: 'totalPoints',        title: 'Best Scorer',   short: 'Оноо',         icon: <FireOutlined /> },
  { metric: 'attackSuccesses',    title: 'Best Attacker', short: 'Довтолгоо',    icon: <FireOutlined /> },
  { metric: 'blockSuccesses',     title: 'Best Blocker',  short: 'Хаалт',        icon: <FireOutlined /> },
  { metric: 'serveSuccesses',     title: 'Best Server',   short: 'Эйс',          icon: <FireOutlined /> },
  { metric: 'setSuccesses',       title: 'Best Setter',   short: 'Сэтгүүлэлт',   icon: <FireOutlined /> },
  { metric: 'digSuccesses',       title: 'Best Digger',   short: 'Хамгаалалт',   icon: <FireOutlined /> },
  { metric: 'receptionSuccesses', title: 'Best Receiver', short: 'Хүлээж авалт', icon: <FireOutlined /> },
];

export default function TournamentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(s => s.auth.user);
  const admin = isAdmin(user);
  const coach = isCoach(user);

  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gender toggle — null = "show everything". When the tournament has
  // teams of both genders we default to the side that has more matches.
  const [gender, setGender] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [t, m, r] = await Promise.all([
        api.get(id).catch(() => null),
        api.matches(id).catch(() => ({ matches: [] })),
        user
          ? regApi.list({ tournamentId: id }).catch(() => ({ registrations: [] }))
          : Promise.resolve({ registrations: [] }),
      ]);
      setTournament(t?.tournament || null);
      setMatches(m?.matches || []);
      setRegistrations(r?.registrations || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [id, user?.id]);

  // Live updates — every time any match in this tournament receives an event
  // or finishes, the server pushes a tournament:stats-changed signal and we
  // re-fetch matches (Schedule/Standings) silently.
  useEffect(() => {
    if (!id) return undefined;
    return subscribeTournament(parseInt(id, 10), () => {
      api.matches(id).then(d => setMatches(d.matches || [])).catch(() => {});
      // Tab-level data (standings/leaderboard) listens to the same signal
      // via the `signal` prop passed to each tab.
    });
  }, [id]);

  // Genders represented in this tournament's teams. Used to decide whether
  // to show the gender toggle and which default value to pick.
  const availableGenders = useMemo(() => {
    const set = new Set();
    for (const t of tournament?.teams || []) if (t.gender) set.add(t.gender);
    return Array.from(set);
  }, [tournament]);

  useEffect(() => {
    // Auto-pin only when *every* team has the same explicit gender. Otherwise
    // keep gender=null (show all) so legacy teams without a gender don't
    // disappear behind the filter.
    const teams = tournament?.teams || [];
    if (teams.length === 0) return;
    if (availableGenders.length === 1 && teams.every(t => !!t.gender)) {
      setGender(availableGenders[0]);
    } else {
      setGender(null);
    }
  }, [availableGenders, tournament]); // eslint-disable-line

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 4 }} />
        <div style={{ height: 24 }} />
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }
  if (!tournament) {
    return <Empty description="Тэмцээн олдсонгүй" />;
  }

  const status = STATUS_LABEL[tournament.status] || STATUS_LABEL.DRAFT;
  const myRegistrations = coach ? registrations.filter(r => r.coachId === user.id) : [];
  const canRegister = (coach || admin) && tournament.status !== 'FINISHED';

  // Tournament-wide signal — bumps each time the socket fires; child tabs
  // depend on it to know they should re-fetch.
  // (Implemented via a counter stored on the matches array length + last
  //  finishedAt — cheap and avoids passing yet another ref.)
  const liveSignal = matches.map(m => m.id + ':' + m.status + ':' + (m.setsWonHome ?? 0) + '-' + (m.setsWonAway ?? 0)).join(',');

  return (
    <div>
      <TournamentHero
        tournament={tournament}
        status={status}
        myRegistrations={myRegistrations}
        canRegister={canRegister}
        onRegister={() => setRegisterOpen(true)}
        gender={gender}
        availableGenders={availableGenders}
        onGenderChange={setGender}
      />

      <Tabs
        defaultActiveKey="schedule"
        size="large"
        className="tournament-tabs"
        items={[
          {
            key: 'schedule',
            label: <span><CalendarOutlined /> Schedule & Results</span>,
            children: <ScheduleTab tournament={tournament} matches={matches} gender={gender} navigate={navigate} />,
          },
          {
            key: 'standings',
            label: <span><TrophyOutlined /> Standings</span>,
            children: <StandingsTab tournamentId={tournament.id} gender={gender} signal={liveSignal} navigate={navigate} />,
          },
          {
            key: 'teams',
            label: <span><TeamOutlined /> Teams ({tournament.teams?.length || 0})</span>,
            children: <TeamsTab teams={tournament.teams || []} gender={gender} tournamentId={tournament.id} admin={admin} reload={reload} />,
          },
          {
            key: 'stats',
            label: <span><FireOutlined /> Statistics</span>,
            children: <StatisticsTab tournamentId={tournament.id} gender={gender} signal={liveSignal} />,
          },
          // Бүртгэлийн tab хасагдсан. Admin approval flow CMS → Бүртгэлийн
          // хүсэлт tab-аар явдаг; coach status hero pill-ээр харагдана.
        ].filter(Boolean)}
      />

      {registerOpen && (
        <RegisterModal
          open={registerOpen}
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          existing={registrations}
          user={user}
          admin={admin}
          onClose={() => setRegisterOpen(false)}
          onDone={() => { setRegisterOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

// ============================================================================
// HERO
// ============================================================================
function TournamentHero({
  tournament, status, myRegistrations, canRegister, onRegister,
  gender, availableGenders, onGenderChange,
}) {
  return (
    <section className="tournament-hero"
      style={tournament.bannerUrl ? { backgroundImage: `url(${tournament.bannerUrl})` } : {}}>
      <div className="tournament-hero-overlay" />
      <div className="tournament-hero-inner">
        <span className="kicker">Тэмцээн</span>
        <h1>{tournament.name}</h1>
        <div className="meta-row">
          <span className={`pill ${status.className}`}>{status.label}</span>
          {tournament.format && (
            <span className="meta-chip">{FORMAT_LABEL[tournament.format] || tournament.format}</span>
          )}
          {tournament.startDate && (
            <span className="meta-chip">
              <CalendarOutlined /> {dayjs(tournament.startDate).format('YYYY.MM.DD')}
              {tournament.endDate && ` — ${dayjs(tournament.endDate).format('YYYY.MM.DD')}`}
            </span>
          )}
          {tournament.location && (
            <span className="meta-chip"><EnvironmentOutlined /> {tournament.location}</span>
          )}
          <span className="meta-chip"><TeamOutlined /> {tournament.teams?.length || 0} баг</span>
        </div>
        {tournament.description && (
          <p className="lede">{tournament.description}</p>
        )}
        {canRegister && (
          <div className="cta-row">
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onRegister}
              style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}>
              Баг бүртгүүлэх
            </Button>
            {myRegistrations.length > 0 && (
              <span className="my-regs">
                Таны хүсэлт:{' '}
                {myRegistrations.map(r => (
                  <Tag key={r.id} color={
                    r.status === 'APPROVED' ? 'green' :
                    r.status === 'REJECTED' ? 'red'   :
                    r.status === 'WITHDRAWN' ? 'default' : 'gold'
                  }>{r.Team?.name}: {r.status}</Tag>
                ))}
              </span>
            )}
          </div>
        )}

        {availableGenders.length === 2 && (
          <div className="gender-toggle-wrap">
            <Segmented
              size="large"
              value={gender || 'ALL'}
              onChange={(v) => onGenderChange(v === 'ALL' ? null : v)}
              options={[
                { label: 'Бүгд',     value: 'ALL' },
                { label: <span><ManOutlined /> Эрэгтэй</span>,   value: 'MEN' },
                { label: <span><WomanOutlined /> Эмэгтэй</span>, value: 'WOMEN' },
              ]}
            />
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// SCHEDULE & RESULTS
// ============================================================================
function ScheduleTab({ tournament, matches, gender, navigate }) {
  // Filter by gender — a match counts as MEN/WOMEN if BOTH teams have that
  // gender; mixed pairs are excluded so the schedule view stays coherent.
  const visible = useMemo(() => {
    if (!gender) return matches;
    return matches.filter(m =>
      m.homeTeam?.gender === gender && m.awayTeam?.gender === gender
    );
  }, [matches, gender]);

  const liveMatches = visible.filter(m => m.status === 'LIVE');

  // Build the full day-by-day strip across [startDate, endDate]. If those
  // are missing, derive from match scheduledAt instead.
  const days = useMemo(() => buildDayStrip(tournament, visible), [tournament, visible]);

  const [selectedDay, setSelectedDay] = useState(() => initialDay(days, visible));
  useEffect(() => {
    // Keep selection valid when the strip changes.
    if (days.length && !days.find(d => d.iso === selectedDay)) {
      setSelectedDay(initialDay(days, visible));
    }
  }, [days, selectedDay, visible]);

  const dayMatches = useMemo(() => {
    return visible.filter(m => {
      if (!m.scheduledAt) return false;
      return dayjs(m.scheduledAt).format('YYYY-MM-DD') === selectedDay;
    }).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }, [visible, selectedDay]);

  const unscheduled = useMemo(
    () => visible.filter(m => !m.scheduledAt),
    [visible],
  );

  return (
    <div className="schedule-tab">
      {liveMatches.length > 0 && (
        <div className="live-now-strip">
          <div className="live-now-head">
            <span className="pill live">Live · одоо явагдаж байна</span>
            <span className="muted">{liveMatches.length} тоглолт</span>
          </div>
          <div className="cards-grid">
            {liveMatches.map(m => (
              <MatchCell key={m.id} m={m} onClick={() => navigate(`/matches/${m.id}`)} />
            ))}
          </div>
        </div>
      )}

      {days.length > 0 ? (
        <DayStrip days={days} selected={selectedDay} onSelect={setSelectedDay} />
      ) : null}

      {dayMatches.length > 0 ? (
        <div className="day-matches">
          <div className="day-head">
            <h3>{dayjs(selectedDay).format('dddd · YYYY.MM.DD')}</h3>
            <span className="muted">{dayMatches.length} тоглолт</span>
          </div>
          <div className="cards-grid">
            {dayMatches.map(m => (
              <MatchCell key={m.id} m={m} onClick={() => navigate(`/matches/${m.id}`)} />
            ))}
          </div>
        </div>
      ) : (
        <Empty description={`${dayjs(selectedDay).format('YYYY.MM.DD')} өдөр тоглолт алга`}
          style={{ marginTop: 32 }} />
      )}

      {unscheduled.length > 0 && (
        <div className="day-matches">
          <div className="day-head">
            <h3>Цаг тогтоогоогүй</h3>
            <span className="muted">{unscheduled.length} тоглолт</span>
          </div>
          <div className="cards-grid">
            {unscheduled.map(m => (
              <MatchCell key={m.id} m={m} onClick={() => navigate(`/matches/${m.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildDayStrip(tournament, visibleMatches) {
  let start = tournament.startDate ? dayjs(tournament.startDate) : null;
  let end = tournament.endDate ? dayjs(tournament.endDate) : null;
  if (!start || !end) {
    // Fallback: pick min/max from matches.
    const dates = visibleMatches
      .map(m => m.scheduledAt ? dayjs(m.scheduledAt) : null)
      .filter(Boolean)
      .sort((a, b) => a - b);
    if (dates.length === 0) return [];
    start = start || dates[0];
    end = end || dates[dates.length - 1];
  }
  if (end.isBefore(start)) [start, end] = [end, start];

  const matchesByDay = new Map();
  for (const m of visibleMatches) {
    if (!m.scheduledAt) continue;
    const key = dayjs(m.scheduledAt).format('YYYY-MM-DD');
    matchesByDay.set(key, (matchesByDay.get(key) || 0) + 1);
  }

  const days = [];
  let cursor = start.startOf('day');
  const endStart = end.startOf('day');
  while (cursor.isBefore(endStart) || cursor.isSame(endStart)) {
    const iso = cursor.format('YYYY-MM-DD');
    days.push({
      iso,
      day:   cursor.format('DD'),
      month: cursor.format('MMM'),
      dow:   cursor.format('ddd'),
      count: matchesByDay.get(iso) || 0,
    });
    cursor = cursor.add(1, 'day');
  }
  return days;
}

function initialDay(days, visibleMatches) {
  // Prefer today if in range; otherwise the first day with matches; otherwise
  // the first day.
  if (days.length === 0) return null;
  const today = dayjs().format('YYYY-MM-DD');
  if (days.find(d => d.iso === today)) return today;
  // Closest future day with matches:
  const todayD = dayjs(today);
  const future = days.filter(d => d.count > 0 && dayjs(d.iso).isAfter(todayD));
  if (future.length > 0) return future[0].iso;
  const past = days.filter(d => d.count > 0);
  if (past.length > 0) return past[past.length - 1].iso;
  return days[0].iso;
}

function DayStrip({ days, selected, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    // Scroll the selected pill into view on mount / selection change.
    if (!ref.current) return;
    const el = ref.current.querySelector(`[data-iso="${selected}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selected]);

  return (
    <div className="day-strip" ref={ref}>
      {days.map(d => (
        <button
          key={d.iso}
          data-iso={d.iso}
          className={`day-pill ${d.iso === selected ? 'is-selected' : ''} ${d.count === 0 ? 'is-empty' : ''}`}
          onClick={() => onSelect(d.iso)}
        >
          <span className="dow">{d.dow}</span>
          <span className="dom">{d.day}</span>
          <span className="mon">{d.month}</span>
          {d.count > 0 && <span className="count">{d.count}</span>}
        </button>
      ))}
    </div>
  );
}

function MatchCell({ m, onClick }) {
  const live = m.status === 'LIVE';
  const finished = m.status === 'FINISHED';
  return (
    <div className={`match-cell ${live ? 'is-live' : ''} ${finished ? 'is-finished' : ''}`}
      onClick={onClick}>
      <div className="cell-meta">
        {live && <span className="pill live">Live · Set {m.currentSetNumber || 1}</span>}
        {finished && <span className="pill success">Дууссан</span>}
        {!live && !finished && (
          <span className="pill muted">
            {m.scheduledAt ? dayjs(m.scheduledAt).format('HH:mm') : 'TBD'}
          </span>
        )}
        {m.venue && <span className="venue">{m.venue}</span>}
      </div>

      <div className="cell-teams">
        <TeamLine team={m.homeTeam} score={m.setsWonHome} live={live} finished={finished}
          winner={m.winnerSide === 'HOME'} />
        <TeamLine team={m.awayTeam} score={m.setsWonAway} live={live} finished={finished}
          winner={m.winnerSide === 'AWAY'} />
      </div>

      {m.sets?.length > 0 && (
        <div className="cell-sets">
          {m.sets.map(s => (
            <span key={s.setNumber} className="set-cube">
              <span className="num">S{s.setNumber}</span>
              <span className="scores">{s.scoreHome}–{s.scoreAway}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamLine({ team, score, live, finished, winner }) {
  return (
    <div className={`tl ${winner ? 'is-winner' : ''}`}>
      {team?.logoUrl
        ? <img src={team.logoUrl} alt="" className="logo" />
        : <div className="logo" />}
      <span className="name">{team?.name || '—'}</span>
      <span className="score">{(live || finished) ? (score ?? 0) : ''}</span>
    </div>
  );
}

// ============================================================================
// STANDINGS (FIVB format)
// ============================================================================
function StandingsTab({ tournamentId, gender, signal, navigate }) {
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.standings(tournamentId, gender)
      .then(setStandings)
      .catch(() => setStandings(null))
      .finally(() => setLoading(false));
  }, [tournamentId, gender, signal]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (!standings || standings.rows.length === 0) {
    return <Empty description="Standings — оролцох баг бүртгэгдсэний дараа гарна" />;
  }

  const cols = [
    {
      title: '#', dataIndex: 'position', width: 50, align: 'center',
      render: (n) => <span className={`pos-col ${n <= 4 ? 'top' : ''}`}>{n}</span>,
    },
    {
      title: 'Баг',
      render: (_, r) => (
        <a onClick={() => navigate(`/teams/${r.team.id}`)} className="standings-team">
          {r.team.logoUrl
            ? <Avatar size={28} shape="square" src={r.team.logoUrl} />
            : <Avatar size={28} shape="square" style={{ background: 'var(--bg-raised)' }}>·</Avatar>}
          <strong>{r.team.name}</strong>
          {r.team.shortName && <span className="muted">{r.team.shortName}</span>}
        </a>
      ),
    },
    { title: 'MP', dataIndex: 'played', width: 60, align: 'right' },
    { title: 'W',  dataIndex: 'wins',   width: 60, align: 'right',
      render: v => <strong style={{ color: 'var(--success)' }}>{v}</strong> },
    { title: 'L',  dataIndex: 'losses', width: 60, align: 'right',
      render: v => <span className="muted">{v}</span> },
    {
      title: 'Sets', width: 90, align: 'right',
      render: (_, r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.setsWon}–{r.setsLost}</span>,
    },
    { title: 'Sets ratio', dataIndex: 'setRatio', width: 100, align: 'right',
      render: v => v.toFixed(3) },
    {
      title: 'Points', width: 110, align: 'right',
      render: (_, r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.pointsFor}–{r.pointsAgainst}</span>,
    },
    { title: 'Pts ratio', dataIndex: 'pointRatio', width: 95, align: 'right',
      render: v => v.toFixed(3) },
    {
      title: 'Pts', dataIndex: 'leaguePoints', width: 70, align: 'right',
      render: v => <strong style={{ color: 'var(--accent)', fontSize: 16 }}>{v}</strong>,
    },
    {
      title: 'Form', width: 130, align: 'center',
      render: (_, r) => (
        <div className="form-cells">
          {(r.form || []).map((f, i) => (
            <span key={i} className={`form-cell ${f === 'W' ? 'win' : 'loss'}`}>{f}</span>
          ))}
        </div>
      ),
    },
  ];
  return (
    <Card style={{ overflow: 'hidden' }}>
      <div className="standings-legend">
        <span>MP = Тоглолт</span><span>W = Хож</span><span>L = Хож алдсан</span>
        <span>Pts = Лигийн оноо (3:0/3:1 → 3, 3:2 → 2, 2:3 → 1, 0:3/1:3 → 0)</span>
      </div>
      <Table
        rowKey={(r) => r.team.id}
        columns={cols}
        dataSource={standings.rows}
        pagination={false}
        size="middle"
        className="standings-table"
      />
    </Card>
  );
}

// ============================================================================
// TEAMS
// ============================================================================
function TeamsTab({ teams, gender, tournamentId, admin, reload }) {
  const [addOpen, setAddOpen] = useState(false);
  const visible = useMemo(() => {
    if (!gender) return teams;
    // Show explicit gender match OR ungendered (legacy) teams so they don't
    // vanish behind a filter set automatically.
    return teams.filter(t => !t.gender || t.gender === gender);
  }, [teams, gender]);

  const header = admin && (
    <div className="tournament-teams-actions">
      <Button
        type="primary" icon={<PlusOutlined />}
        onClick={() => setAddOpen(true)}
        style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}
      >
        Багаа нэмэх
      </Button>
    </div>
  );

  return (
    <div>
      {header}
      {visible.length === 0 ? (
        <Empty description={
          gender
            ? `${gender === 'MEN' ? 'Эрэгтэй' : 'Эмэгтэй'} баг бүртгэгдээгүй байна`
            : 'Энэ тэмцээнд баг бүртгэгдээгүй'
        } />
      ) : (
        <div className="tournament-teams-grid">
          {visible.map(t => (
            <div key={t.id} className="tournament-team-card-wrap">
              <Link to={`/teams/${t.id}?tournament=${tournamentId}`} className="tournament-team-card">
                <div className="logo-frame">
                  {t.logoUrl
                    ? <img src={t.logoUrl} alt="" />
                    : <span>{(t.shortName || t.name).slice(0, 2).toUpperCase()}</span>}
                </div>
                <div className="info">
                  <div className="name">{t.name}</div>
                  {t.coach && <div className="sub">Дасгалжуулагч: {t.coach.name}</div>}
                  {t.gender && (
                    <span className={`gender-chip ${t.gender === 'WOMEN' ? 'women' : 'men'}`}>
                      {t.gender === 'WOMEN' ? <WomanOutlined /> : <ManOutlined />}
                      {t.gender === 'WOMEN' ? ' Эмэгтэй' : ' Эрэгтэй'}
                    </span>
                  )}
                </div>
              </Link>
              {admin && (
                <Link
                  to={`/teams?team=${t.id}`}
                  className="team-card-manage"
                  aria-label="Удирдах"
                  title="Багийн бүрэлдэхүүн, лого, дасгалжуулагчийг удирдах"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SettingOutlined />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
      {addOpen && (
        <AddTeamModal
          tournamentId={tournamentId}
          onClose={() => setAddOpen(false)}
          onDone={() => { setAddOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

// Admin-only modal to add a team to this tournament. Two paths:
//   • Pick an existing team → set its tournamentId.
//   • Create a brand-new team that's pre-tied to this tournament.
function AddTeamModal({ tournamentId, onClose, onDone }) {
  const [mode, setMode] = useState('existing');
  const [allTeams, setAllTeams] = useState([]);
  const [pickedId, setPickedId] = useState();
  const [newForm] = Form.useForm();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    teamsApi.list().then(d => setAllTeams(d.teams || [])).catch(() => setAllTeams([]));
  }, []);

  const available = useMemo(() => {
    // Teams that aren't already in THIS tournament. They may belong to
    // a different tournament — reassigning is admin's prerogative.
    return allTeams.filter(t => t.tournamentId !== tournamentId);
  }, [allTeams, tournamentId]);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'existing') {
        if (!pickedId) {
          message.warning('Багаа сонгоно уу');
          setBusy(false);
          return;
        }
        const t = allTeams.find(x => x.id === pickedId);
        // Dedicated PATCH endpoint — avoids the full PUT/validate surface.
        await teamsApi.setTournament(pickedId, tournamentId);
        message.success(`"${t?.name || 'Баг'}" тэмцээнд нэмэгдсэн`);
      } else {
        const v = await newForm.validateFields();
        await teamsApi.create({ ...v, tournamentId });
        message.success(`"${v.name}" баг үүсгэгдэж тэмцээнд нэмэгдсэн`);
      }
      onDone();
    } catch (e) {
      if (e?.errorFields) return;
      const data = e?.response?.data || {};
      const details = data.details || data.detail;
      const detailMsg = Array.isArray(details) ? details.join(', ') : details;
      const finalMsg = detailMsg || data.error || e?.message || 'Алдаа гарлаа';
      // eslint-disable-next-line no-console
      console.error('[AddTeam] failure:', e, finalMsg);
      message.error(finalMsg);
    } finally { setBusy(false); }
  };

  return (
    <Modal title="Тэмцээнд баг нэмэх"
      open onCancel={onClose} onOk={submit} confirmLoading={busy}
      okText={mode === 'existing' ? 'Нэмэх' : 'Үүсгэх'} cancelText="Цуцлах"
      width={520}>
      <Segmented
        value={mode} onChange={setMode}
        block style={{ marginBottom: 16 }}
        options={[
          { value: 'existing', label: 'Байгаа багаас сонгох' },
          { value: 'create',   label: 'Шинэ баг үүсгэх' },
        ]}
      />
      {mode === 'existing' ? (
        <Select
          showSearch
          size="large"
          style={{ width: '100%' }}
          placeholder="Багаа сонгох"
          value={pickedId}
          onChange={setPickedId}
          options={available.map(t => ({
            value: t.id,
            label: `${t.name}${t.gender ? ` (${t.gender === 'MEN' ? 'Эр' : 'Эм'})` : ''}`,
          }))}
          optionFilterProp="label"
          notFoundContent={<div className="muted center">Боломжит баг алга</div>}
        />
      ) : (
        <Form form={newForm} layout="vertical" initialValues={{ gender: 'MEN' }}>
          <Form.Item name="name" label="Багийн нэр" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="Жнь: Эрчим" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="shortName" label="Богино нэр">
              <Input maxLength={20} placeholder="ERC" />
            </Form.Item>
            <Form.Item name="gender" label="Хүйс" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'MEN',   label: 'Эрэгтэй' },
                  { value: 'WOMEN', label: 'Эмэгтэй' },
                ]}
              />
            </Form.Item>
          </div>
        </Form>
      )}
    </Modal>
  );
}

// ============================================================================
// STATISTICS (7 leaderboards)
// ============================================================================
function StatisticsTab({ tournamentId, gender, signal }) {
  const [activeMetric, setActiveMetric] = useState(LEADERBOARDS[0].metric);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.leaderboard(tournamentId, activeMetric, 10, gender)
      .then(d => setRows(d.leaderboard || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [tournamentId, activeMetric, gender, signal]);

  const board = LEADERBOARDS.find(b => b.metric === activeMetric);

  return (
    <div className="statistics-tab">
      <div className="stat-metric-tabs">
        {LEADERBOARDS.map(b => (
          <button
            key={b.metric}
            className={`metric-pill ${b.metric === activeMetric ? 'is-active' : ''}`}
            onClick={() => setActiveMetric(b.metric)}
          >
            {b.title}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : rows.length === 0 ? (
        <Empty description="Энэ үзүүлэлтийн дагуу бүртгэгдсэн тоглогч алга" />
      ) : (
        <div className="leaderboard">
          {rows.map((r, i) => (
            <LeaderRow key={r.id} i={i + 1} row={r} valueKey={activeMetric} valueLabel={board?.short} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderRow({ i, row, valueKey, valueLabel }) {
  const p = row.Player;
  return (
    <Link
      to={p ? `/players/${p.id}` : '#'}
      className={`leader-row ${i <= 3 ? 'top' : ''}`}
    >
      <span className="rank">{i}</span>
      {p?.photoUrl
        ? <img src={p.photoUrl} alt="" className="ph" />
        : <div className="ph stub">{p?.fullName?.[0] || '?'}</div>}
      <div className="who">
        <div className="name">{p?.fullName || '—'}</div>
        <div className="sub">#{p?.jerseyNumber} · {p?.Team?.name || ''}</div>
      </div>
      <div className="metric">
        <span className="num">{row[valueKey]}</span>
        <span className="lbl">{valueLabel}</span>
      </div>
    </Link>
  );
}

// ============================================================================
// REGISTER MODAL
// ============================================================================
function RegisterModal({ open, tournamentId, tournamentName, existing, admin, user, onClose, onDone }) {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const params = admin ? {} : { coachId: user?.id };
    teamsApi.list(params).then(d => setTeams(d.teams || [])).catch(() => setTeams([]));
  }, [open, admin, user]);

  const submit = async () => {
    if (!teamId) { message.warning('Багаа сонгоно уу'); return; }
    setBusy(true);
    try {
      await regApi.apply({ tournamentId, teamId, note: note || null });
      message.success('Хүсэлт илгээгдлээ. Админы шийдвэр хүлээж байна.');
      onDone();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  const reservedTeamIds = new Set(existing
    .filter(r => ['PENDING', 'APPROVED'].includes(r.status))
    .map(r => r.teamId));
  const eligible = teams.filter(t => !reservedTeamIds.has(t.id));

  return (
    <Modal title={`"${tournamentName}" тэмцээнд бүртгүүлэх`}
      open={open} onCancel={onClose} onOk={submit} confirmLoading={busy}
      okText="Хүсэлт илгээх" cancelText="Цуцлах">
      <p className="muted" style={{ marginTop: 0 }}>
        Багаа сонгож хүсэлт илгээнэ үү. Админ хянаж зөвшөөрсний дараа таны баг тэмцээнд оруулагдана.
      </p>
      <Select
        style={{ width: '100%', marginBottom: 12 }}
        size="large"
        showSearch
        placeholder="Бүртгүүлэх багаа сонгох"
        value={teamId}
        onChange={setTeamId}
        options={eligible.map(t => ({
          value: t.id,
          label: `${t.name}${t.gender ? ` (${t.gender === 'MEN' ? 'Эр' : 'Эм'})` : ''}`,
        }))}
        notFoundContent={
          <div className="muted center">
            {teams.length === 0 ? 'Танд оноогдсон баг алга — админд хандана уу' : 'Боломжит баг үлдсэнгүй'}
          </div>
        }
      />
      <Input.TextArea
        rows={3} maxLength={500} showCount
        placeholder="Тэмдэглэл (заавал биш)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </Modal>
  );
}
