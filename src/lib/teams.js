export function isTeamActive(team) {
  return team != null && !team.deleted_at
}

export function filterActiveTeams(teams) {
  return (teams || []).filter(isTeamActive)
}
