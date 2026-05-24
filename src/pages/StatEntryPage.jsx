import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Spin, Modal, Form, Select, Button, Row, Col, Space, Alert, message, Empty, Switch, Tag,
} from 'antd';
import { matches as api, teams as teamsApi } from '../api';
import { subscribeMatch } from '../api/socket';
import LiveScoreboard from '../components/LiveScoreboard';
import CourtAndBench from '../components/CourtAndBench';
import EventButtons from '../components/EventButtons';
import ActionLog from '../components/ActionLog';

export default function StatEntryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [snap, setSnap] = useState(null);
  const [rallies, setRallies] = useState([]);
  const [homeRoster, setHomeRoster] = useState([]);
  const [awayRoster, setAwayRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState({ side: null, playerId: null });
  const [subMode, setSubMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [startOpen, setStartOpen] = useState(false);
  const [startForm] = Form.useForm();

  const [nextSetOpen, setNextSetOpen] = useState(false);
  const [nextSetForm] = Form.useForm();

  const reload = async () => {
    setLoading(true);
    try {
      const s = await api.get(id);
      setSnap(s);
      const [home, away] = await Promise.all([
        teamsApi.get(s.match.homeTeam.id),
        teamsApi.get(s.match.awayTeam.id),
      ]);
      setHomeRoster(home.team.players || []);
      setAwayRoster(away.team.players || []);
      const p = await api.playByPlay(id);
      setRallies(p.rallies || []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Уншихад алдаа гарлаа');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    reload();
    const matchId = parseInt(id, 10);
    const off = subscribeMatch(matchId, (next) => {
      setSnap(next);
      api.playByPlay(id).then(p => setRallies(p.rallies || [])).catch(() => {});
    });
    return off;
  }, [id]);

  const currentSet = useMemo(
    () => snap?.sets?.find(s => s.setNumber === snap.match.currentSetNumber),
    [snap],
  );

  const status = snap?.match?.status;

  // ---------- Match start ----------
  const onStartMatch = async () => {
    const v = await startForm.validateFields();
    setBusy(true);
    try {
      await api.start(id, {
        lineupHome: v.lineupHome,
        lineupAway: v.lineupAway,
        liberoHome: v.liberoHome ?? null,
        liberoAway: v.liberoAway ?? null,
        servingSide: v.servingSide,
      });
      message.success('Тоглолт эхэллээ');
      setStartOpen(false);
      reload();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Эхлүүлэх алдаа');
    } finally { setBusy(false); }
  };

  const onStartNextSet = async () => {
    const v = await nextSetForm.validateFields();
    setBusy(true);
    try {
      await api.startNextSet(id, v);
      message.success(`Set ${snap.match.currentSetNumber} эхэллээ`);
      setNextSetOpen(false);
      reload();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  // ---------- Event recording ----------
  const recordEvent = async ({ type, result }) => {
    if (!selected.playerId) {
      message.warning('Тоглогч сонгоно уу');
      return;
    }
    setBusy(true);
    try {
      await api.recordEvent(id, {
        type,
        result,
        actorSide: selected.side,
        playerId: selected.playerId,
      });
      // selection persists for fast consecutive entries unless rally closed
      reload();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  const onStepBack = async () => {
    setBusy(true);
    try { await api.stepBack(id); message.success('Сүүлийн event буцаагдлаа'); reload(); }
    catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
    finally { setBusy(false); }
  };

  const onSwap = async (courtId, benchId) => {
    setBusy(true);
    try {
      await api.substitute(id, { side: subSide, courtPlayerId: courtId, benchPlayerId: benchId });
      message.success('Орлуулалт хийгдлээ');
      reload();
    } catch (e) { message.error(e?.response?.data?.error || 'Орлуулалт алдаа'); }
    finally { setBusy(false); }
  };
  const [subSide, setSubSide] = useState('HOME');

  if (loading) return <Spin size="large" />;
  if (error) return <Alert type="error" message={error} />;
  if (!snap) return <Empty description="Тоглолт олдсонгүй" />;

  const onSelectPlayer = (side, pid) => setSelected({ side, playerId: pid });

  // ---------- Render branches ----------
  if (status === 'FINISHED') {
    return (
      <div>
        <LiveScoreboard snap={snap} />
        <Alert type="success" message="Тоглолт дууссан байна" style={{ marginTop: 16 }} />
        <Card title="Үйл явдлын лог" size="small" style={{ marginTop: 16 }}>
          <ActionLog rallies={rallies} />
        </Card>
      </div>
    );
  }

  if (status === 'SCHEDULED') {
    return (
      <div>
        <LiveScoreboard snap={snap} />
        <Card style={{ marginTop: 16 }} title="Тоглолтыг эхлүүлэх">
          <p>Эхлүүлэхийн тулд хоёр баг тус бүрд 6 эхлэх тоглогч сонгож, серв эхлэх тал болон libero-г оруулна.</p>
          <Button type="primary" size="large" onClick={() => setStartOpen(true)} disabled={!homeRoster.length || !awayRoster.length}>
            Тоглолт эхлүүлэх
          </Button>
          {!homeRoster.length && <Alert type="warning" style={{ marginTop: 12 }} message={`${snap.match.homeTeam.name} баг тоглогчгүй`} />}
          {!awayRoster.length && <Alert type="warning" style={{ marginTop: 12 }} message={`${snap.match.awayTeam.name} баг тоглогчгүй`} />}
        </Card>

        <StartMatchModal
          open={startOpen} onCancel={() => setStartOpen(false)} onOk={onStartMatch}
          form={startForm} home={snap.match.homeTeam} away={snap.match.awayTeam}
          homeRoster={homeRoster} awayRoster={awayRoster} busy={busy}
        />
      </div>
    );
  }

  // LIVE
  const setLineupExists = currentSet && currentSet.lineupHome?.length === 6 && currentSet.lineupAway?.length === 6;
  const needsNextSetSetup = !setLineupExists && status === 'LIVE';

  return (
    <div>
      <LiveScoreboard snap={snap} />

      {needsNextSetSetup ? (
        <Card style={{ marginTop: 16 }} title={`Set ${snap.match.currentSetNumber}-ийг эхлүүлэх`}>
          <p>Шинэ сетийн lineup болон серв эхлэх талыг сонгоно.</p>
          <Button type="primary" size="large" onClick={() => setNextSetOpen(true)}>Сет эхлүүлэх</Button>
          <StartMatchModal
            open={nextSetOpen} onCancel={() => setNextSetOpen(false)} onOk={onStartNextSet}
            form={nextSetForm} home={snap.match.homeTeam} away={snap.match.awayTeam}
            homeRoster={homeRoster} awayRoster={awayRoster} busy={busy}
            title={`Set ${snap.match.currentSetNumber} эхлүүлэх`}
          />
        </Card>
      ) : (
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} md={8}>
            <Card size="small">
              <CourtAndBench
                side="HOME" isHome={true}
                players={homeRoster}
                lineup={currentSet?.lineupHome}
                selectedId={selected.side === 'HOME' ? selected.playerId : null}
                onSelect={(pid) => onSelectPlayer('HOME', pid)}
                subMode={subMode && subSide === 'HOME'}
                onSwap={onSwap}
                subsUsed={currentSet?.subsUsedHome ?? 0}
                subsLimit={6}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small" title="Үйл явдал бүртгэх">
              {selected.playerId ? (
                <div style={{ marginBottom: 8 }}>
                  Сонгосон: <Tag color="blue">{selected.side} #{selected.playerId}</Tag>
                </div>
              ) : (
                <Alert type="info" showIcon message="Эхлээд талбайн тоглогч сонгоно уу" style={{ marginBottom: 12 }} />
              )}
              <EventButtons disabled={busy || !selected.playerId} onPick={recordEvent} />

              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button onClick={onStepBack} disabled={busy}>← Алхам буцах</Button>
                <Switch
                  checkedChildren="Орлуулалтын горим"
                  unCheckedChildren="Үйлдэл оруулах"
                  checked={subMode}
                  onChange={setSubMode}
                />
                {subMode && (
                  <Select
                    size="small"
                    value={subSide}
                    onChange={setSubSide}
                    options={[{ value: 'HOME', label: 'Гэрийн тал' }, { value: 'AWAY', label: 'Зочид тал' }]}
                  />
                )}
                <Button onClick={() => navigate(`/matches/${id}`)}>Үзэгчийн харагдац</Button>
              </div>
            </Card>

            <Card size="small" title="Лог" style={{ marginTop: 16 }}>
              <ActionLog rallies={rallies} />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small">
              <CourtAndBench
                side="AWAY" isHome={false}
                players={awayRoster}
                lineup={currentSet?.lineupAway}
                selectedId={selected.side === 'AWAY' ? selected.playerId : null}
                onSelect={(pid) => onSelectPlayer('AWAY', pid)}
                subMode={subMode && subSide === 'AWAY'}
                onSwap={onSwap}
                subsUsed={currentSet?.subsUsedAway ?? 0}
                subsLimit={6}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

function StartMatchModal({ open, onCancel, onOk, form, home, away, homeRoster, awayRoster, busy, title = 'Тоглолтыг эхлүүлэх' }) {
  const lineupRules = [{ required: true, validator: (_, v) => v?.length === 6 ? Promise.resolve() : Promise.reject('6 тоглогч сонгох ёстой') }];
  return (
    <Modal title={title} open={open} onCancel={onCancel} onOk={onOk} okText="Эхлүүлэх" cancelText="Цуцлах" width={760} confirmLoading={busy}>
      <Form form={form} layout="vertical" initialValues={{ servingSide: 'HOME' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={`${home.name} — Гэрийн lineup (P1..P6)`} name="lineupHome" rules={lineupRules}>
              <Select mode="multiple" maxTagCount={6} placeholder="6 тоглогч"
                options={homeRoster.map(p => ({ value: p.id, label: `#${p.jerseyNumber} ${p.fullName}` }))} />
            </Form.Item>
            <Form.Item label="Libero (Home)" name="liberoHome">
              <Select allowClear options={homeRoster.filter(p => p.isLibero).map(p => ({ value: p.id, label: `#${p.jerseyNumber} ${p.fullName}` }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={`${away.name} — Зочид lineup (P1..P6)`} name="lineupAway" rules={lineupRules}>
              <Select mode="multiple" maxTagCount={6} placeholder="6 тоглогч"
                options={awayRoster.map(p => ({ value: p.id, label: `#${p.jerseyNumber} ${p.fullName}` }))} />
            </Form.Item>
            <Form.Item label="Libero (Away)" name="liberoAway">
              <Select allowClear options={awayRoster.filter(p => p.isLibero).map(p => ({ value: p.id, label: `#${p.jerseyNumber} ${p.fullName}` }))} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Серв эхлэх тал" name="servingSide">
          <Select options={[{ value: 'HOME', label: 'Гэрийн' }, { value: 'AWAY', label: 'Зочид' }]} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
