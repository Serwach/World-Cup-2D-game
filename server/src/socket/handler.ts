import { Server as IOServer, Socket } from 'socket.io';

interface GameRoom {
  roomId: string;
  players: string[];
  gameState: {
    ballX: number;
    ballY: number;
    ballVx: number;
    ballVy: number;
    scoreA: number;
    scoreB: number;
    timeLeft: number;
  };
}

const rooms = new Map<string, GameRoom>();

export function setupSocket(io: IOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('join_room', (roomId: string) => {
      let room = rooms.get(roomId);
      if (!room) {
        room = {
          roomId,
          players: [],
          gameState: { ballX: 640, ballY: 360, ballVx: 0, ballVy: 0, scoreA: 0, scoreB: 0, timeLeft: 90 * 60 },
        };
        rooms.set(roomId, room);
      }

      if (room.players.length < 2 && !room.players.includes(socket.id)) {
        room.players.push(socket.id);
        socket.join(roomId);
        socket.emit('room_joined', { roomId, playerIndex: room.players.indexOf(socket.id) });

        if (room.players.length === 2) {
          io.to(roomId).emit('game_ready', { roomId });
        }
      } else {
        socket.emit('room_full', { roomId });
      }
    });

    socket.on('game_update', (data: { roomId: string; state: Partial<GameRoom['gameState']> }) => {
      const room = rooms.get(data.roomId);
      if (!room || !room.players.includes(socket.id)) return;
      Object.assign(room.gameState, data.state);
      socket.to(data.roomId).emit('game_state', room.gameState);
    });

    socket.on('goal_scored', (data: { roomId: string; team: 'A' | 'B' }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      if (data.team === 'A') room.gameState.scoreA++;
      else room.gameState.scoreB++;
      io.to(data.roomId).emit('goal_scored', { team: data.team, scoreA: room.gameState.scoreA, scoreB: room.gameState.scoreB });
    });

    socket.on('match_end', (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      io.to(data.roomId).emit('match_ended', room.gameState);
      rooms.delete(data.roomId);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      for (const [roomId, room] of rooms.entries()) {
        if (room.players.includes(socket.id)) {
          io.to(roomId).emit('player_disconnected', { socketId: socket.id });
          rooms.delete(roomId);
          break;
        }
      }
    });
  });
}
