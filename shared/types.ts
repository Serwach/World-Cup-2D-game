export interface Team {
  id: number;
  name: string;
  group_name: string;
  primary_color: string;
  secondary_color: string;
  confederation: string;
  flag_emoji: string;
}

export interface Player {
  id: number;
  name: string;
  team_id: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  shirt_number: number;
}

export interface Match {
  id: number;
  team_a: number;
  team_b: number;
  score_a: number;
  score_b: number;
  stage: 'group' | 'knockout';
  round?: string;
  played: boolean;
  extra_time: boolean;
  penalties: boolean;
  penalty_score_a?: number;
  penalty_score_b?: number;
}

export interface Group {
  id: number;
  name: string;
}

export interface Standing {
  id: number;
  group_id: number;
  team_id: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  team?: Team;
}

export interface TournamentState {
  stage: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final' | 'finished';
  matches: Match[];
  groups: Group[];
  standings: Standing[];
}

export interface MatchSettings {
  matchDuration: number;
  extraTime: boolean;
  goldenGoal: boolean;
  penalties: boolean;
}

export interface GameState {
  matchId: number;
  teamA: Team;
  teamB: Team;
  playersA: Player[];
  playersB: Player[];
  scoreA: number;
  scoreB: number;
  timeLeft: number;
  phase: 'normal' | 'extra_time_1' | 'extra_time_2' | 'penalties';
  settings: MatchSettings;
}

export interface SocketPlayerPosition {
  playerId: number;
  x: number;
  y: number;
}

export interface SocketGameUpdate {
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  players: SocketPlayerPosition[];
  scoreA: number;
  scoreB: number;
  timeLeft: number;
}
