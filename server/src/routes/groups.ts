import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const groups = await query('SELECT * FROM groups_table ORDER BY name');

    const result = await Promise.all(
      groups.map(async g => {
        const teams = await query(
          'SELECT * FROM teams WHERE group_name = ? ORDER BY id',
          [g.name]
        );
        const standings = await query(
          `SELECT s.*, t.name as team_name, t.flag_emoji, t.primary_color, t.secondary_color
           FROM standings s
           JOIN teams t ON t.id = s.team_id
           WHERE s.group_name = ?
           ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC`,
          [g.name]
        );
        return { ...g, teams, standings };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:name/standings', async (req: Request, res: Response) => {
  try {
    const standings = await query(
      `SELECT s.*, t.name as team_name, t.flag_emoji, t.primary_color, t.secondary_color
       FROM standings s
       JOIN teams t ON t.id = s.team_id
       WHERE s.group_name = ?
       ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC`,
      [req.params.name.toUpperCase()]
    );
    res.json(standings);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
