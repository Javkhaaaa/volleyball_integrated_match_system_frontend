import React from 'react';
import dayjs from 'dayjs';
import { CalendarOutlined, EnvironmentOutlined, TrophyOutlined } from '@ant-design/icons';

// VNL-style match hero. Large team blocks left/right, massive set-won
// counter in the middle, set-by-set breakdown underneath. Live matches
// show the current-set score plus a pulsing LIVE badge.
export default function LiveScoreboard({ snap }) {
  if (!snap) return null;
  const { match, sets } = snap;
  const home = match.homeTeam;
  const away = match.awayTeam;
  const currentSet = sets?.find(s => s.setNumber === match.currentSetNumber);
  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';
  const setsHome = match.setsWon?.home ?? match.setsWonHome ?? 0;
  const setsAway = match.setsWon?.away ?? match.setsWonAway ?? 0;

  return (
    <section className={`match-hero ${isLive ? 'is-live' : ''} ${isFinished ? 'is-finished' : ''}`}>
      <div className="match-hero-overlay" />

      <div className="match-hero-status">
        {isLive && (
          <>
            <span className="dot" />
            <span>LIVE · Set {match.currentSetNumber || 1}</span>
          </>
        )}
        {isFinished && <span>FULL TIME · {sets?.length || 0} сет</span>}
        {!isLive && !isFinished && match.scheduledAt && (
          <span>{dayjs(match.scheduledAt).format('YYYY.MM.DD · HH:mm')}</span>
        )}
      </div>

      <div className="match-hero-body">
        <TeamBlock team={home} side="home" winner={isFinished && match.winnerSide === 'HOME'}
          serving={currentSet?.servingSide === 'HOME'} />

        <div className="match-hero-score">
          <div className="sets-row">
            <span className={`sets-num ${setsHome > setsAway ? 'lead' : ''}`}>{setsHome}</span>
            <span className="sep">:</span>
            <span className={`sets-num ${setsAway > setsHome ? 'lead' : ''}`}>{setsAway}</span>
          </div>
          {isLive && currentSet && (
            <div className="current-set">
              <span className="cs-label">Set {currentSet.setNumber}</span>
              <span className="cs-scores">
                <span className={currentSet.scoreHome > currentSet.scoreAway ? 'lead' : ''}>{currentSet.scoreHome}</span>
                <span className="dash">–</span>
                <span className={currentSet.scoreAway > currentSet.scoreHome ? 'lead' : ''}>{currentSet.scoreAway}</span>
              </span>
            </div>
          )}
        </div>

        <TeamBlock team={away} side="away" winner={isFinished && match.winnerSide === 'AWAY'}
          serving={currentSet?.servingSide === 'AWAY'} />
      </div>

      {sets?.length > 0 && (
        <div className="match-hero-sets">
          {sets.map(s => (
            <SetCube key={s.setNumber} set={s} />
          ))}
        </div>
      )}

      <div className="match-hero-meta">
        {match.scheduledAt && !isLive && (
          <span><CalendarOutlined /> {dayjs(match.scheduledAt).format('YYYY.MM.DD HH:mm')}</span>
        )}
        {match.venue && <span><EnvironmentOutlined /> {match.venue}</span>}
        {match.tournamentId && <span><TrophyOutlined /> Тэмцээн #{match.tournamentId}</span>}
      </div>
    </section>
  );
}

function TeamBlock({ team, side, winner, serving }) {
  return (
    <div className={`team-block side-${side} ${winner ? 'is-winner' : ''}`}>
      <div className="logo-wrap">
        {team?.logoUrl
          ? <img src={team.logoUrl} alt={team?.name || ''} />
          : <span className="logo-stub">{(team?.shortName || team?.name || '?').slice(0, 2).toUpperCase()}</span>}
        {serving && <span className="serving-dot" title="Серв" />}
      </div>
      <div className="team-block-text">
        <div className="team-name">{team?.name || (side === 'home' ? 'Home' : 'Away')}</div>
        {team?.shortName && <div className="team-short">{team.shortName}</div>}
      </div>
    </div>
  );
}

function SetCube({ set }) {
  const homeWon = set.winnerSide === 'HOME';
  const awayWon = set.winnerSide === 'AWAY';
  const isLive = set.status === 'LIVE';
  return (
    <div className={`set-cube ${isLive ? 'is-live' : ''}`}>
      <div className="set-cube-head">Set {set.setNumber}</div>
      <div className="set-cube-scores">
        <span className={homeWon ? 'won' : ''}>{set.scoreHome}</span>
        <span className="dash">–</span>
        <span className={awayWon ? 'won' : ''}>{set.scoreAway}</span>
      </div>
      {isLive && <div className="set-cube-tag">Live</div>}
    </div>
  );
}
