import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const auth = {
  config: () => api.get('/auth/config').then(r => r.data),
  login: (email, password) => api.post('/auth/login', { email, password }).then(r => r.data),
  google: (credential) => api.post('/auth/google', { credential }).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  setPassword: (newPassword, currentPassword) =>
    api.post('/auth/me/password', { newPassword, currentPassword }).then(r => r.data),
};

export const admin = {
  listUsers: (params = {}) => api.get('/admin/users', { params }).then(r => r.data),
  createUser: (payload) => api.post('/admin/users', payload).then(r => r.data),
  updateUser: (id, payload) => api.put(`/admin/users/${id}`, payload).then(r => r.data),
  setRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }).then(r => r.data),
  setActive: (id, isActive) => api.patch(`/admin/users/${id}/active`, { isActive }).then(r => r.data),
  setPassword: (id, password) => api.patch(`/admin/users/${id}/password`, { password }).then(r => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then(r => r.data),
};

export const tournaments = {
  list: (params = {}) => api.get('/tournaments', { params }).then(r => r.data),
  get: (id) => api.get(`/tournaments/${id}`).then(r => r.data),
  matches: (id) => api.get(`/tournaments/${id}/matches`).then(r => r.data),
  standings: (id, gender) =>
    api.get(`/tournaments/${id}/standings`, { params: gender ? { gender } : {} }).then(r => r.data),
  create: (p) => api.post('/tournaments', p).then(r => r.data),
  update: (id, p) => api.put(`/tournaments/${id}`, p).then(r => r.data),
  remove: (id) => api.delete(`/tournaments/${id}`).then(r => r.data),
  setFeatured: (id, isFeatured, featuredOrder) =>
    api.patch(`/tournaments/${id}/featured`, { isFeatured, ...(featuredOrder != null ? { featuredOrder } : {}) }).then(r => r.data),
  uploadBanner: (id, file) => uploadFile(`/tournaments/${id}/banner`, file),
  removeBanner: (id) => api.delete(`/tournaments/${id}/banner`).then(r => r.data),
  // Top N players by a stat metric (totalPoints by default).
  leaderboard: (id, metric, limit, gender) =>
    api.get(`/tournaments/${id}/leaderboard`, {
      params: {
        ...(metric ? { metric } : {}),
        ...(limit ? { limit } : {}),
        ...(gender ? { gender } : {}),
      },
    }).then(r => r.data),
};

export const players = {
  list: (params = {}) => api.get('/players', { params }).then(r => r.data),
  get: (id) => api.get(`/players/${id}`).then(r => r.data),
  stats: (id, params = {}) => api.get(`/players/${id}/stats`, { params }).then(r => r.data),
  // Read from PlayerCareerStatistic / PlayerTournamentStatistic tables.
  careerStats: (id) => api.get(`/players/${id}/career-stats`).then(r => r.data),
  tournamentStats: (id, tournamentId) =>
    api.get(`/players/${id}/tournament-stats`, { params: tournamentId ? { tournamentId } : {} })
      .then(r => r.data),
  matchLog: (id, limit) =>
    api.get(`/players/${id}/match-log`, { params: limit ? { limit } : {} }).then(r => r.data),
  setFeatured: (id, payload) => api.patch(`/players/${id}/featured`, payload).then(r => r.data),
};

export const sponsors = {
  publicList: () => api.get('/sponsors').then(r => r.data),
  adminList: () => api.get('/sponsors/admin/all').then(r => r.data),
  create: (p) => api.post('/sponsors', p).then(r => r.data),
  update: (id, p) => api.put(`/sponsors/${id}`, p).then(r => r.data),
  remove: (id) => api.delete(`/sponsors/${id}`).then(r => r.data),
  uploadLogo: (id, file) => uploadFile(`/sponsors/${id}/logo`, file),
  removeLogo: (id) => api.delete(`/sponsors/${id}/logo`).then(r => r.data),
};

export const siteSettings = {
  publicMap: () => api.get('/site-settings').then(r => r.data),
  adminList: () => api.get('/site-settings/admin/all').then(r => r.data),
  set: (key, value) => api.put(`/site-settings/${encodeURIComponent(key)}`, { value }).then(r => r.data),
  uploadLoginImage: (file) => uploadFile('/site-settings/login-image', file),
  removeLoginImage: () => api.delete('/site-settings/login-image').then(r => r.data),
  uploadSiteLogo: (file) => uploadFile('/site-settings/site-logo', file),
  removeSiteLogo: () => api.delete('/site-settings/site-logo').then(r => r.data),
};

export const siteStats = {
  get: () => api.get('/site-stats').then(r => r.data),
};

function uploadFile(url, file) {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
}

export const teams = {
  list: (params = {}) => {
    // Back-compat: callers used to pass a bare tournamentId number
    const p = typeof params === 'number' ? { tournamentId: params } : params;
    return api.get('/teams', { params: p }).then(r => r.data);
  },
  rawList: (tournamentId) =>
    api.get('/teams', { params: tournamentId ? { tournamentId } : {} }).then(r => r.data),
  get: (id) => api.get(`/teams/${id}`).then(r => r.data),
  create: (p) => api.post('/teams', p).then(r => r.data),
  update: (id, p) => api.put(`/teams/${id}`, p).then(r => r.data),
  remove: (id) => api.delete(`/teams/${id}`).then(r => r.data),
  addPlayer: (id, p) => api.post(`/teams/${id}/players`, p).then(r => r.data),
  updatePlayer: (id, pid, p) => api.put(`/teams/${id}/players/${pid}`, p).then(r => r.data),
  deletePlayer: (id, pid) => api.delete(`/teams/${id}/players/${pid}`).then(r => r.data),
  uploadLogo: (id, file) => uploadFile(`/teams/${id}/logo`, file),
  removeLogo: (id) => api.delete(`/teams/${id}/logo`).then(r => r.data),
  uploadPlayerPhoto: (id, pid, file) => uploadFile(`/teams/${id}/players/${pid}/photo`, file),
  removePlayerPhoto: (id, pid) => api.delete(`/teams/${id}/players/${pid}/photo`).then(r => r.data),
  setFeatured: (id, isFeatured, featuredOrder) =>
    api.patch(`/teams/${id}/featured`, { isFeatured, ...(featuredOrder != null ? { featuredOrder } : {}) }).then(r => r.data),
  setCoach: (id, coachId) => api.patch(`/teams/${id}/coach`, { coachId }).then(r => r.data),
  setTournament: (id, tournamentId) => api.patch(`/teams/${id}/tournament`, { tournamentId }).then(r => r.data),
  setLock: (id, locked) => api.patch(`/teams/${id}/lock`, { locked }).then(r => r.data),
  stats: (id, params = {}) => api.get(`/teams/${id}/stats`, { params }).then(r => r.data),
  // Read from TeamCareerStatistic / TeamTournamentStatistic tables.
  careerStats: (id) => api.get(`/teams/${id}/career-stats`).then(r => r.data),
  tournamentStats: (id, tournamentId) =>
    api.get(`/teams/${id}/tournament-stats`, { params: tournamentId ? { tournamentId } : {} })
      .then(r => r.data),
  matches: (id) => api.get(`/teams/${id}/matches`).then(r => r.data),
};

export const announcements = {
  publicList: (kind, limit) =>
    api.get('/announcements', { params: { kind, limit } }).then(r => r.data),
  get: (id) => api.get(`/announcements/${id}`).then(r => r.data),
  adminList: () => api.get('/announcements/admin/all').then(r => r.data),
  create: (p) => api.post('/announcements', p).then(r => r.data),
  update: (id, p) => api.put(`/announcements/${id}`, p).then(r => r.data),
  remove: (id) => api.delete(`/announcements/${id}`).then(r => r.data),
  uploadImage: (id, file) => uploadFile(`/announcements/${id}/image`, file),
  removeImage: (id) => api.delete(`/announcements/${id}/image`).then(r => r.data),
};

export const registrations = {
  list: (params = {}) => api.get('/registrations', { params }).then(r => r.data),
  apply: (payload) => api.post('/registrations', payload).then(r => r.data),
  decide: (id, status, adminNote) =>
    api.patch(`/registrations/${id}`, { status, adminNote: adminNote || null }).then(r => r.data),
  withdraw: (id) => api.delete(`/registrations/${id}`).then(r => r.data),
};

export const matches = {
  list: (params = {}) => api.get('/matches', { params }).then(r => r.data),
  get: (id) => api.get(`/matches/${id}`).then(r => r.data),
  create: (p) => api.post('/matches', p).then(r => r.data),
  start: (id, p) => api.post(`/matches/${id}/start`, p).then(r => r.data),
  startNextSet: (id, p) => api.post(`/matches/${id}/start-next-set`, p).then(r => r.data),
  recordEvent: (id, p) => api.post(`/matches/${id}/events`, p).then(r => r.data),
  substitute: (id, p) => api.post(`/matches/${id}/substitute`, p).then(r => r.data),
  stepBack: (id) => api.post(`/matches/${id}/step-back`).then(r => r.data),
  setStatistician: (id, statisticianId) => api.patch(`/matches/${id}/statistician`, { statisticianId }).then(r => r.data),
  playByPlay: (id, setNumber) =>
    api.get(`/matches/${id}/play-by-play`, { params: setNumber ? { setNumber } : {} }).then(r => r.data),
  stats: (id) => api.get(`/matches/${id}/stats`).then(r => r.data),
  reportPdfUrl: (id) => `/api/matches/${id}/report.pdf`,
  reportXlsxUrl: (id) => `/api/matches/${id}/report.xlsx`,
};
