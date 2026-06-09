import { Router, Request, Response } from 'express';
import { query } from '../db';
import * as mysql from 'mysql2/promise';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const teams = await query<mysql.RowDataPacket[]>('SELECT * FROM teams ORDER BY group_name, id');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [team] = await query<mysql.RowDataPacket[]>(
      'SELECT * FROM teams WHERE id = ?',
      [req.params.id]
    );
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const players = await query<mysql.RowDataPacket[]>(
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
    const players = await query<mysql.RowDataPacket[]>(
      'SELECT * FROM players WHERE team_id = ? ORDER BY FIELD(position,"GK","DEF","MID","FWD"), shirt_number',
      [req.params.id]
    );
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
