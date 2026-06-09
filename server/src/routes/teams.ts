import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const teams = await query('SELECT * FROM teams ORDER BY group_name, id');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [team] = await query(
      'SELECT * FROM teams WHERE id = ?',
      [req.params.id]
    );
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const players = await query(
      'SELECT * FROM players WHERE team_id = ? ORDER BY position, shirt_number',
      [req.params.id]
    );

    res.json({ ...team, players });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id/players', async (req: Request, res: Response) => {
  try {
    const players = await query(
      `SELECT * FROM players WHERE team_id = ?
       ORDER BY CASE position WHEN 'GK' THEN 0 WHEN 'DEF' THEN 1 WHEN 'MID' THEN 2 WHEN 'FWD' THEN 3 ELSE 4 END, shirt_number`,
      [req.params.id]
    );
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
