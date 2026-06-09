const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export interface ApiTeam {
  id: number;
  name: string;
  group_name: string;
  primary_color: string;
  secondary_color: string;
  confederation: string;
  flag_emoji: string;
  players?: ApiPlayer[];
}

export interface ApiPlayer {
  id: number;
  name: string;
  team_id: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  shirt_number: number;
}

export interface ApiStanding {
  team_id: number;
  team_name: string;
  flag_emoji: string;
  primary_color: string;
  group_name: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

export interface ApiMatch {
  id: number;
  team_a: number;
  team_b: number;
  team_a_name: string;
  team_b_name: string;
  team_a_flag: string;
  team_b_flag: string;
  team_a_color: string;
  team_b_color: string;
  score_a: number;
  score_b: number;
  stage: string;
  round_name: string | null;
  played: number;
  extra_time: number;
  penalties: number;
  penalty_score_a?: number;
  penalty_score_b?: number;
}

export interface ApiGroup {
  id: number;
  name: string;
  teams: ApiTeam[];
  standings: ApiStanding[];
}

export const api = {
  getTeams: () => get<ApiTeam[]>('/teams'),
  getTeam: (id: number) => get<ApiTeam>(`/teams/${id}`),
  getTeamPlayers: (id: number) => get<ApiPlayer[]>(`/teams/${id}/players`),

  getGroups: () => get<ApiGroup[]>('/groups'),
  getGroupStandings: (name: string) => get<ApiStanding[]>(`/groups/${name}/standings`),

  getMatches: (params?: { stage?: string; round?: string; played?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return get<ApiMatch[]>(`/matches${qs}`);
  },
  getMatch: (id: number) => get<ApiMatch>(`/matches/${id}`),
  postResult: (data: {
    matchId: number;
    scoreA: number;
    scoreB: number;
    extraTime?: boolean;
    penalties?: boolean;
    penaltyScoreA?: number;
    penaltyScoreB?: number;
  }) => post<{ success: boolean }>('/matches/result', data),

  getTournamentState: () => get<{
    stage: string;
    groupStageDone: boolean;
    standings: ApiStanding[];
    matches: ApiMatch[];
  }>('/tournament/state'),

  getTournamentBracket: () => get<Record<string, ApiMatch[]>>('/tournament/bracket'),

  advanceToKnockout: () => post<{ success: boolean }>('/tournament/advance-to-knockout', {}),
  resetTournament: () => post<{ success: boolean }>('/tournament/reset', {}),
};
