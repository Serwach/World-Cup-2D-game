import { Router, Request, Response } from 'express';
import { query, execute } from '../db';
import {
  getGroupStandings,
  generateKnockoutMatches,
  simulateRemainingGroupMatches,
  getQualifiedTeams,
} from '../tournament/engine';

const router = Router();

router.get('/state', async (_req: Request, res: Response) => {
  try {
    const [config] = await query(
      'SELECT * FROM tournament_config ORDER BY id DESC LIMIT 1'
    );
    const standings = await getGroupStandings();
    const matches = await query(
      `SELECT m.*,
        ta.name as team_a_name, ta.flag_emoji as team_a_flag,
        tb.name as team_b_name, tb.flag_emoji as team_b_flag
       FROM matches m
       JOIN teams ta ON ta.id = m.team_a
       JOIN teams tb ON tb.id = m.team_b
       ORDER BY m.match_order`
    );

    res.json({
      stage: config?.current_stage || 'group',
      groupStageDone: config?.group_stage_done || false,
      standings,
      matches,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/reset', async (_req: Request, res: Response) => {
  try {
    await execute('DELETE FROM matches');
    await execute('DELETE FROM standings');
    await execute('DELETE FROM players');
    await execute('DELETE FROM teams');
    await execute('DELETE FROM groups_table');
    await execute('DELETE FROM tournament_config');

    // Re-seed
    const { seed } = await import('../seeder');
    await seed();

    res.json({ success: true, message: 'Tournament reset and re-seeded.' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/advance-to-knockout', async (_req: Request, res: Response) => {
  try {
    const [config] = await query(
      'SELECT * FROM tournament_config ORDER BY id DESC LIMIT 1'
    );
    if (config?.group_stage_done) {
      return res.status(400).json({ error: 'Knockout stage already generated.' });
    }

    // Simulate any unplayed group matches first
    await simulateRemainingGroupMatches();
    await generateKnockoutMatches();

    res.json({ success: true, message: 'Knockout stage generated.' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/bracket', async (_req: Request, res: Response) => {
  try {
    const rounds = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'];
    const bracket: Record<string, unknown[]> = {};

    for (const round of rounds) {
      bracket[round] = await query(
        `SELECT m.*,
          ta.name as team_a_name, ta.flag_emoji as team_a_flag, ta.primary_color as team_a_color,
          tb.name as team_b_name, tb.flag_emoji as team_b_flag, tb.primary_color as team_b_color
         FROM matches m
         JOIN teams ta ON ta.id = m.team_a
         JOIN teams tb ON tb.id = m.team_b
         WHERE m.round_name = ? AND m.stage = 'knockout'
         ORDER BY m.match_order`,
        [round]
      );
    }

    res.json(bracket);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/qualified', async (_req: Request, res: Response) => {
  try {
    const qualified = await getQualifiedTeams();
    res.json(qualified);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
