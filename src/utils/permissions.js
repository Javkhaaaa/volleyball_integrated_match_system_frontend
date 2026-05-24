// Mirrors backend's auth.js role rules. Used to gate UI elements so we
// don't show buttons that will 403. Backend remains the source of truth.

export const isAdmin = (user) => user?.role === 'ADMIN';
export const isCoach = (user) => user?.role === 'COACH';
export const isStatistician = (user) => user?.role === 'STATISTICIAN';

export function canManageTeam(user, team) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  // Coach can manage their own team unless admin has locked the roster.
  if (user.role === 'COACH' && team?.coachId === user.id && !team?.rosterLocked) return true;
  return false;
}

export function canRecordMatch(user, match) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role !== 'STATISTICIAN') return false;
  // Either unassigned (anyone with role STATISTICIAN can claim) or matches us.
  return match?.statisticianId == null || match.statisticianId === user.id;
}
