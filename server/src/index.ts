import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { runMigrations, checkAndSeed } from './db';
import teamsRouter from './routes/teams';
import groupsRouter from './routes/groups';
import matchesRouter from './routes/matches';
import tournamentRouter from './routes/tournament';
import { setupSocket } from './socket/handler';

const PORT = parseInt(process.env.SERVER_PORT || '3001');

async function bootstrap() {
  console.log('[Server] Running database migrations...');
  await runMigrations();

  console.log('[Server] Checking seed data...');
  await checkAndSeed();

  const app = express();
  const httpServer = createServer(app);
  const io = new IOServer(httpServer, {
    cors: {
      origin: `http://localhost:${process.env.CLIENT_PORT || 3000}`,
      methods: ['GET', 'POST'],
    },
  });

  app.use(cors({
    origin: `http://localhost:${process.env.CLIENT_PORT || 3000}`,
  }));
  app.use(express.json());

  app.use('/api/teams', teamsRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/matches', matchesRouter);
  app.use('/api/tournament', tournamentRouter);

  app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  setupSocket(io);

  httpServer.listen(PORT, () => {
    console.log(`[Server] Listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
