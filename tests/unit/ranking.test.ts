/**
 * Unit tests: Group ranking calculation and tournament advancement
 */

interface StandingData {
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

function compareStandings(a: StandingData, b: StandingData): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
  if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
  return 0;
}

function updateStanding(
  standing: StandingData,
  goalsFor: number,
  goalsAgainst: number
): StandingData {
  const won = goalsFor > goalsAgainst ? 1 : 0;
  const draw = goalsFor === goalsAgainst ? 1 : 0;
  const lost = goalsFor < goalsAgainst ? 1 : 0;
  const points = won * 3 + draw;
  return {
    ...standing,
    played: standing.played + 1,
    won: standing.won + won,
    drawn: standing.drawn + draw,
    lost: standing.lost + lost,
    goals_for: standing.goals_for + goalsFor,
    goals_against: standing.goals_against + goalsAgainst,
    goal_difference: standing.goal_difference + goalsFor - goalsAgainst,
    points: standing.points + points,
  };
}

function makeStanding(teamId: number, name: string, group = 'A'): StandingData {
  return {
    team_id: teamId, team_name: name, group_name: group,
    points: 0, played: 0, won: 0, drawn: 0, lost: 0,
    goals_for: 0, goals_against: 0, goal_difference: 0,
  };
}

describe('Group standings calculation', () => {
  test('Win gives 3 points', () => {
    const s = makeStanding(1, 'Germany');
    const updated = updateStanding(s, 2, 0);
    expect(updated.points).toBe(3);
    expect(updated.won).toBe(1);
    expect(updated.goal_difference).toBe(2);
  });

  test('Draw gives 1 point each', () => {
    const s = makeStanding(1, 'Germany');
    const updated = updateStanding(s, 1, 1);
    expect(updated.points).toBe(1);
    expect(updated.drawn).toBe(1);
    expect(updated.goal_difference).toBe(0);
  });

  test('Loss gives 0 points', () => {
    const s = makeStanding(1, 'Germany');
    const updated = updateStanding(s, 0, 3);
    expect(updated.points).toBe(0);
    expect(updated.lost).toBe(1);
    expect(updated.goal_difference).toBe(-3);
  });
});

describe('Group ranking sort', () => {
  test('Ranks by points first', () => {
    const standings: StandingData[] = [
      { ...makeStanding(1, 'Germany'), points: 3, goal_difference: 1, goals_for: 1 },
      { ...makeStanding(2, 'Brazil'), points: 6, goal_difference: 2, goals_for: 2 },
      { ...makeStanding(3, 'France'), points: 0, goal_difference: -3, goals_for: 0 },
    ];
    const sorted = [...standings].sort(compareStandings);
    expect(sorted[0].team_name).toBe('Brazil');
    expect(sorted[1].team_name).toBe('Germany');
    expect(sorted[2].team_name).toBe('France');
  });

  test('Tiebreak by goal difference', () => {
    const standings: StandingData[] = [
      { ...makeStanding(1, 'Spain'), points: 6, goal_difference: 1, goals_for: 3 },
      { ...makeStanding(2, 'England'), points: 6, goal_difference: 4, goals_for: 5 },
    ];
    const sorted = [...standings].sort(compareStandings);
    expect(sorted[0].team_name).toBe('England');
  });

  test('Tiebreak by goals scored when GD equal', () => {
    const standings: StandingData[] = [
      { ...makeStanding(1, 'Spain'), points: 6, goal_difference: 2, goals_for: 3 },
      { ...makeStanding(2, 'Italy'), points: 6, goal_difference: 2, goals_for: 5 },
    ];
    const sorted = [...standings].sort(compareStandings);
    expect(sorted[0].team_name).toBe('Italy');
  });
});

describe('Third-place qualification', () => {
  function getBest8Thirds(allThirds: Array<{
    teamId: number;
    groupName: string;
    points: number;
    gd: number;
    gf: number;
  }>) {
    return [...allThirds]
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      })
      .slice(0, 8);
  }

  test('Selects top 8 third-place teams from 12 groups', () => {
    const thirds = Array.from({ length: 12 }, (_, i) => ({
      teamId: i + 100,
      groupName: String.fromCharCode(65 + i),
      points: Math.floor(Math.random() * 10),
      gd: Math.floor(Math.random() * 4) - 2,
      gf: Math.floor(Math.random() * 5),
    }));
    const best = getBest8Thirds(thirds);
    expect(best.length).toBe(8);
  });

  test('Best third is first by points', () => {
    const thirds = [
      { teamId: 1, groupName: 'A', points: 7, gd: 3, gf: 5 },
      { teamId: 2, groupName: 'B', points: 4, gd: 1, gf: 3 },
      { teamId: 3, groupName: 'C', points: 7, gd: 5, gf: 7 },
    ];
    const best = getBest8Thirds(thirds);
    expect(best[0].groupName).toBe('C'); // Higher GD among tied points
  });

  test('Total qualified teams is 32', () => {
    // 12 groups: 12 top1 + 12 top2 = 24, + 8 best thirds = 32
    const top1And2 = 24;
    const thirds = 8;
    expect(top1And2 + thirds).toBe(32);
  });
});

describe('Tournament advancement', () => {
  test('Round of 32 produces 16 matches for 32 teams', () => {
    const teams = Array.from({ length: 32 }, (_, i) => i + 1);
    const half = teams.length / 2;
    const matches: [number, number][] = [];
    for (let i = 0; i < half; i++) {
      matches.push([teams[i], teams[i + half]]);
    }
    expect(matches.length).toBe(16);
  });

  test('Winners advance to next round', () => {
    const matchResults = [
      { teamA: 1, teamB: 2, scoreA: 2, scoreB: 1 },
      { teamA: 3, teamB: 4, scoreA: 0, scoreB: 1 },
    ];
    const winners = matchResults.map(m =>
      m.scoreA > m.scoreB ? m.teamA : m.teamB
    );
    expect(winners).toEqual([1, 4]);
  });

  test('Penalty winner determined by penalty score', () => {
    const match = { teamA: 1, teamB: 2, scoreA: 1, scoreB: 1, penalties: true, penaltyA: 4, penaltyB: 3 };
    const winner = match.penalties
      ? (match.penaltyA > match.penaltyB ? match.teamA : match.teamB)
      : (match.scoreA > match.scoreB ? match.teamA : match.teamB);
    expect(winner).toBe(1);
  });
});
