import { Router, Request, Response } from 'express';
import { query, execute } from '../db';
import { updateStandings, generateNextKnockoutRound } from '../tournament/engine';
import * as mysql from 'mysql2/promise';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const stage = req.query.stage as string | undefined;
    const round = req.query.round as string | undefined;
    const played = req.query.played as string | undefined;

    let sql = `
      SELECT m.*,
        ta.name as team_a_name, ta.flag_emoji as team_a_flag,
        ta.primary_color as team_a_color,
        tb.name as team_b_name, tb.flag_emoji as team_b_flag,
        tb.primary_color as team_b_color
      FROM matches m
      JOIN teams ta ON ta.id = m.team_a
      JOIN teams tb ON tb.id = m.team_b
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (stage) { sql += ' AND m.stage = ?'; params.push(stage); }
    if (round) { sql += ' AND m.round_name = ?'; params.push(round); }
    if (played !== undefined) { sql += ' AND m.played = ?'; params.push(played === '1' ? 1 : 0); }

    sql += ' ORDER BY m.match_order';

    const matches = await query<mysql.RowDataPacket[]>(sql, params);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [match] = await query<mysql.RowDataPacket[]>(
      `SELECT m.*,
        ta.name as team_a_name, ta.flag_emoji as team_a_flag,
        tb.name as team_b_name, tb.flag_emoji as team_b_flag
       FROM matches m
       JOIN teams ta ON ta.id = m.team_a
       JOIN teams tb ON tb.id = m.team_b
       WHERE m.id = ?`,
      [req.params.id]
    );
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/result', async (req: Request, res: Response) => {
  try {
    const {
      matchId, scoreA, scoreB,
      extraTime = false, penalties = false,
      penaltyScoreA, penaltyScoreB,
    } = req.body as {
      matchId: number;
      scoreA: number;
      scoreB: number;
      extraTime?: boolean;
      penalties?: boolean;
      penaltyScoreA?: number;
      penaltyScoreB?: number;
    };

    const [match] = await query<mysql.RowDataPacket[]>(
      'SELECT * FROM matches WHERE id = ?', [matchId]
    );
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.played) return res.status(400).json({ error: 'Match already played' });

    await execute(
      `UPDATE matches SET
        score_a = ?, score_b = ?, played = 1,
        extra_time = ?, penalties = ?,
        penalty_score_a = ?, penalty_score_b = ?
       WHERE id = ?`,
      [scoreA, scoreB, extraTime ? 1 : 0, penalties ? 1 : 0,
       penaltyScoreA ?? null, penaltyScoreB ?? null, matchId]
    );

    if (match.stage === 'group') {
      await updateStandings(match.team_a, match.team_b, scoreA, scoreB);
    }

    // Check if we should advance knockout round
    if (match.stage === 'knockout') {
      const remaining = await query<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) as cnt FROM matches
         WHERE round_name = ? AND stage = 'knockout' AND played = 0`,
        [match.round_name]
      );
      if (remaining[0].cnt === 0 && match.round_name !== 'final' && match.round_name !== 'third_place') {
        await generateNextKnockoutRound(match.round_name);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
