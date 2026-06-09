import { query, execute } from '../db';

interface StandingRow {
  team_id: number;
  team_name: string;
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

export async function updateStandings(
  teamAId: number,
  teamBId: number,
  scoreA: number,
  scoreB: number
): Promise<void> {
  // Determine outcomes
  const [aPoints, bPoints] = scoreA > scoreB ? [3, 0] : scoreA === scoreB ? [1, 1] : [0, 3];
  const [aWon, bWon] = scoreA > scoreB ? [1, 0] : scoreA === scoreB ? [0, 0] : [0, 1];
  const [aDraw, bDraw] = scoreA === scoreB ? [1, 1] : [0, 0];
  const [aLost, bLost] = scoreA < scoreB ? [1, 0] : scoreA === scoreB ? [0, 0] : [0, 1];

  await execute(
    `UPDATE standings SET
      points = points + ?,
      played = played + 1,
      won = won + ?,
      drawn = drawn + ?,
      lost = lost + ?,
      goals_for = goals_for + ?,
      goals_against = goals_against + ?
     WHERE team_id = ?`,
    [aPoints, aWon, aDraw, aLost, scoreA, scoreB, teamAId]
  );

  await execute(
    `UPDATE standings SET
      points = points + ?,
      played = played + 1,
      won = won + ?,
      drawn = drawn + ?,
      lost = lost + ?,
      goals_for = goals_for + ?,
      goals_against = goals_against + ?
     WHERE team_id = ?`,
    [bPoints, bWon, bDraw, bLost, scoreB, scoreA, teamBId]
  );
}

export async function getGroupStandings(): Promise<StandingRow[]> {
  return query<StandingRow>(
    `SELECT s.*, t.name as team_name
     FROM standings s
     JOIN teams t ON t.id = s.team_id
     ORDER BY s.group_name, s.points DESC, s.goal_difference DESC, s.goals_for DESC`
  );
}

export function compareStandings(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
  if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
  return 0;
}

export async function getQualifiedTeams(): Promise<{
  group: { teamId: number; position: number; groupName: string }[];
  thirdPlace: { teamId: number; groupName: string; points: number; gd: number; gf: number }[];
}> {
  const standings = await getGroupStandings();

  const groups: Record<string, StandingRow[]> = {};
  for (const row of standings) {
    if (!groups[row.group_name]) groups[row.group_name] = [];
    groups[row.group_name].push(row);
  }

  const qualified: { teamId: number; position: number; groupName: string }[] = [];
  const thirdPlaceTeams: { teamId: number; groupName: string; points: number; gd: number; gf: number }[] = [];

  for (const [groupName, rows] of Object.entries(groups)) {
    const sorted = [...rows].sort(compareStandings);
    qualified.push({ teamId: sorted[0].team_id, position: 1, groupName });
    qualified.push({ teamId: sorted[1].team_id, position: 2, groupName });
    if (sorted[2]) {
      thirdPlaceTeams.push({
        teamId: sorted[2].team_id,
        groupName,
        points: sorted[2].points,
        gd: sorted[2].goal_difference,
        gf: sorted[2].goals_for,
      });
    }
  }

  // Best 8 third-place teams
  thirdPlaceTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
  const best8Third = thirdPlaceTeams.slice(0, 8);

  return { group: qualified, thirdPlace: best8Third };
}

export async function generateKnockoutMatches(): Promise<void> {
  const { group, thirdPlace } = await getQualifiedTeams();

  // Build ordered list: groups A-L, top 2 from each + 8 best 3rds = 32 teams
  // Standard seeding: A1 vs third (from F,G,H or assigned group)
  // For simplicity: seed by group order, top vs second-seed bracket
  const top1 = group.filter(t => t.position === 1).sort((a, b) => a.groupName.localeCompare(b.groupName));
  const top2 = group.filter(t => t.position === 2).sort((a, b) => a.groupName.localeCompare(b.groupName));
  const thirds = thirdPlace.map(t => t.teamId);

  // 32 teams total: 12 first + 12 second + 8 thirds
  // Pair them for Round of 32 (16 matches)
  const allTeams = [
    ...top1.map(t => t.teamId),
    ...top2.map(t => t.teamId),
    ...thirds,
  ];

  // Simple bracket: team[0] vs team[16], team[1] vs team[17], etc.
  const half = allTeams.length / 2;
  let order = 1000;
  for (let i = 0; i < half; i++) {
    await execute(
      `INSERT INTO matches (team_a, team_b, stage, round_name, played, match_order)
       VALUES (?, ?, 'knockout', 'round_of_32', 0, ?)`,
      [allTeams[i], allTeams[i + half], order++]
    );
  }

  await execute(
    `UPDATE tournament_config SET current_stage = 'round_of_32', group_stage_done = 1`
  );
}

export async function generateNextKnockoutRound(currentRound: string): Promise<void> {
  const roundProgression: Record<string, string> = {
    round_of_32: 'round_of_16',
    round_of_16: 'quarter_final',
    quarter_final: 'semi_final',
    semi_final: 'final',
  };

  const nextRound = roundProgression[currentRound];
  if (!nextRound) return;

  const matches = await query(
    `SELECT * FROM matches WHERE round_name = ? AND stage = 'knockout' AND played = 1 ORDER BY match_order`,
    [currentRound]
  );

  // Winners advance
  const winners: number[] = matches.map(m => {
    if (m.penalties) {
      return m.penalty_score_a > m.penalty_score_b ? m.team_a : m.team_b;
    }
    return m.score_a > m.score_b ? m.team_a : m.team_b;
  });

  let order = matches[0]?.match_order + 5000;
  for (let i = 0; i < winners.length; i += 2) {
    if (winners[i + 1] !== undefined) {
      await execute(
        `INSERT INTO matches (team_a, team_b, stage, round_name, played, match_order)
         VALUES (?, ?, 'knockout', ?, 0, ?)`,
        [winners[i], winners[i + 1], nextRound, order++]
      );
    }
  }

  // Generate 3rd place if semi_final done
  if (currentRound === 'semi_final') {
    const losers: number[] = matches.map(m => {
      if (m.penalties) {
        return m.penalty_score_a > m.penalty_score_b ? m.team_b : m.team_a;
      }
      return m.score_a > m.score_b ? m.team_b : m.team_a;
    });
    if (losers.length >= 2) {
      await execute(
        `INSERT INTO matches (team_a, team_b, stage, round_name, played, match_order)
         VALUES (?, ?, 'knockout', 'third_place', 0, ?)`,
        [losers[0], losers[1], order++]
      );
    }
  }

  await execute(
    `UPDATE tournament_config SET current_stage = ?`,
    [nextRound]
  );
}

export async function simulateMatch(teamAId: number, teamBId: number): Promise<{ scoreA: number; scoreB: number }> {
  // Simple simulation: random score weighted by strength (we use points as proxy)
  const maxGoals = 4;
  const scoreA = Math.floor(Math.random() * (maxGoals + 1));
  const scoreB = Math.floor(Math.random() * (maxGoals + 1));
  return { scoreA, scoreB };
}

export async function simulateRemainingGroupMatches(): Promise<void> {
  const unplayed = await query(
    `SELECT * FROM matches WHERE stage = 'group' AND played = 0`
  );

  for (const match of unplayed) {
    const { scoreA, scoreB } = await simulateMatch(match.team_a, match.team_b);
    await execute(
      `UPDATE matches SET score_a = ?, score_b = ?, played = 1 WHERE id = ?`,
      [scoreA, scoreB, match.id]
    );
    await updateStandings(match.team_a, match.team_b, scoreA, scoreB);
  }
}
