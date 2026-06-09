import Phaser from 'phaser';
import { ApiTeam, ApiPlayer, api } from '../api';
import { Field } from '../game/Field';
import { Ball } from '../game/Ball';
import { Player, PlayerInputState } from '../game/Player';
import { PowerBar } from '../game/PowerBar';
import { HUD } from '../game/HUD';
import { buildAIInput } from '../game/AI';
import { deriveActionInputState } from '../game/inputState';
import {
  FIELD_CENTER_X, FIELD_CENTER_Y,
  FIELD_LEFT, FIELD_RIGHT, FIELD_TOP, FIELD_BOTTOM,
  PLAYER_RADIUS, BALL_RADIUS,
  GOAL_CELEBRATION_DURATION, KICKOFF_DELAY,
  DEFAULT_MATCH_DURATION, EXTRA_TIME_DURATION,
} from '@shared/constants';

interface GameSceneData {
  teamAId: number;
  teamBId: number;
  teamA: ApiTeam;
  teamB: ApiTeam;
  mode: string;
  matchId?: number;
  settings: {
    matchDuration: number;
    extraTime: boolean;
    goldenGoal: boolean;
    penalties: boolean;
  };
}

type GamePhase = 'kickoff' | 'playing' | 'goal' | 'halftime' | 'extra_time_1' | 'extra_time_2' | 'penalties' | 'ended';

interface PenaltyState {
  round: number;
  maxRounds: number;
  teamATaken: number;
  teamBTaken: number;
  teamAScored: number;
  teamBScored: number;
  currentTeam: 'A' | 'B';
  shooterActive: boolean;
  keeperActive: boolean;
  shooterDir: number; // -1 left, 0 center, 1 right
  keeperDir: number;
  chargeTime: number;
}

export class GameScene extends Phaser.Scene {
  private sceneData!: GameSceneData;
  private playersA: Player[] = [];
  private playersB: Player[] = [];
  private ball!: Ball;
  private field!: Field;
  private hud!: HUD;
  private powerBarA!: PowerBar;
  private powerBarB!: PowerBar;

  private scoreA = 0;
  private scoreB = 0;
  private timeLeft = DEFAULT_MATCH_DURATION;
  private phase: GamePhase = 'kickoff';
  private paused = false;
  private ready = false;

  private keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    enter: Phaser.Input.Keyboard.Key;
  };

  private prevActionA = false;
  private prevActionB = false;

  private timerEvent!: Phaser.Time.TimerEvent;
  private kickoffSide: 0 | 1 = 0; // which team kicks off

  private penalty?: PenaltyState;
  private penaltyPlayers: Player[] = [];
  private penaltyResultText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData) {
    this.sceneData = data;
    this.scoreA = 0;
    this.scoreB = 0;
    this.timeLeft = data.settings.matchDuration;
    this.phase = 'kickoff';
    this.paused = false;
    this.kickoffSide = 0;
    this.prevActionA = false;
    this.prevActionB = false;
    this.penaltyPlayers = [];
    this.penalty = undefined;
  }

  async create() {
    this.ready = false;

    // Input must exist before async loading completes to avoid update crashing
    this.keys = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      enter: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
    };

    // Build field
    this.field = new Field(this);

    // Load players from server
    let playersA: ApiPlayer[] = [];
    let playersB: ApiPlayer[] = [];
    try {
      [playersA, playersB] = await Promise.all([
        this.loadPlayersWithFallback(this.sceneData.teamAId, () => this.createDummyPlayers(this.sceneData.teamAId)),
        this.loadPlayersWithFallback(this.sceneData.teamBId, () => this.createDummyPlayers(this.sceneData.teamBId)),
      ]);
    } catch {
      playersA = this.createDummyPlayers(this.sceneData.teamAId);
      playersB = this.createDummyPlayers(this.sceneData.teamBId);
    }

    const aColor = parseInt(this.sceneData.teamA.primary_color.replace('#', ''), 16);
    const aSecColor = parseInt(this.sceneData.teamA.secondary_color.replace('#', ''), 16);
    const bColor = parseInt(this.sceneData.teamB.primary_color.replace('#', ''), 16);
    const bSecColor = parseInt(this.sceneData.teamB.secondary_color.replace('#', ''), 16);

    // Create players
    const startPosA = this.getStartPositions(0);
    const startPosB = this.getStartPositions(1);

    this.playersA = playersA.map((p, i) => new Player(
      this, startPosA[i].x, startPosA[i].y,
      p, 0, aColor, aSecColor,
      (this.sceneData.teamAId + i) % 48
    ));

    this.playersB = playersB.map((p, i) => new Player(
      this, startPosB[i].x, startPosB[i].y,
      p, 1, bColor, bSecColor,
      (this.sceneData.teamBId + i) % 48
    ));

    // Ball
    this.ball = new Ball(this, FIELD_CENTER_X, FIELD_CENTER_Y);
    this.ball.setDepth(200);

    // HUD
    this.hud = new HUD(this, this.sceneData.teamA, this.sceneData.teamB);
    this.hud.updateTimer(this.timeLeft);

    // Power bars
    this.powerBarA = new PowerBar(this, 200, 680, 'P1 SHOT POWER');
    this.powerBarB = new PowerBar(this, 1080, 680, 'P2 SHOT POWER');

    // Start match after short delay
    this.ready = true;

    this.time.delayedCall(KICKOFF_DELAY, () => {
      this.startKickoff();
    });
  }

  private getStartPositions(teamIndex: 0 | 1): { x: number; y: number }[] {
    const cy = FIELD_CENTER_Y;
    if (teamIndex === 0) {
      return [
        { x: FIELD_LEFT + 40, y: cy },           // GK
        { x: FIELD_LEFT + 160, y: cy },           // DEF
        { x: FIELD_LEFT + 320, y: cy - 60 },      // MID
        { x: FIELD_LEFT + 460, y: cy },            // FWD
      ];
    } else {
      return [
        { x: FIELD_RIGHT - 40, y: cy },           // GK
        { x: FIELD_RIGHT - 160, y: cy },          // DEF
        { x: FIELD_RIGHT - 320, y: cy + 60 },     // MID
        { x: FIELD_RIGHT - 460, y: cy },           // FWD
      ];
    }
  }

  private startKickoff() {
    this.phase = 'playing';
    this.ball.reset(FIELD_CENTER_X, FIELD_CENTER_Y);
    this.resetPlayerPositions();
    this.startTimer();
  }

  private startTimer() {
    if (this.timerEvent) this.timerEvent.destroy();
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      repeat: this.timeLeft - 1,
    });
  }

  private onTimerTick() {
    if (this.paused || this.phase !== 'playing') return;
    this.timeLeft = Math.max(0, this.timeLeft - 1);
    this.hud.updateTimer(this.timeLeft);

    if (this.timeLeft <= 0) {
      this.onTimeUp();
    }
  }

  private onTimeUp() {
    this.paused = true;
    this.phase = 'halftime';
    const isKnockout = this.sceneData.mode === 'knockout';

    if (isKnockout && this.scoreA === this.scoreB) {
      if (this.sceneData.settings.extraTime) {
        this.hud.showHalfTimeBanner('FULL TIME\nEXTRA TIME!', () => {
          this.phase = 'extra_time_1';
          this.timeLeft = EXTRA_TIME_DURATION * 60;
          this.hud.setPhaseLabel('EXTRA TIME 1');
          this.paused = false;
          this.startTimer();
        });
        return;
      }
      if (this.sceneData.settings.penalties) {
        this.hud.showHalfTimeBanner('FULL TIME\nPENALTIES!', () => {
          this.startPenalties();
        });
        return;
      }
    }

    this.endMatch();
  }

  private endMatch() {
    this.phase = 'ended';
    this.paused = true;
    if (this.timerEvent) this.timerEvent.destroy();
    this.saveResult();
  }

  private saveResult() {
    if (this.sceneData.matchId) {
      api.postResult({
        matchId: this.sceneData.matchId,
        scoreA: this.scoreA,
        scoreB: this.scoreB,
      }).catch(console.error);
    }

    this.time.delayedCall(1500, () => {
      this.scene.start('ResultScene', {
        teamA: this.sceneData.teamA,
        teamB: this.sceneData.teamB,
        scoreA: this.scoreA,
        scoreB: this.scoreB,
        mode: this.sceneData.mode,
      });
    });
  }

  update(_time: number, delta: number) {
    if (!this.ready || this.paused || this.phase === 'ended') return;
    if (this.phase === 'penalties') {
      this.updatePenalties(delta);
      return;
    }

    const inputA = this.getInputA();
    const inputB = this.getInputB();

    // Auto-select active player for each team
    this.updateActivePlayer(this.playersA, this.ball, inputA);
    this.updateActivePlayer(this.playersB, this.ball, inputB);

    const activeA = this.playersA.find(p => p.isActive);
    const activeB = this.playersB.find(p => p.isActive);

    // Update all players
    for (const p of this.playersA) {
      const input = p.isActive ? inputA : null;
      const aiInput = p.isActive ? null : buildAIInput(p, this.ball, this.playersA, this.playersB, delta);
      p.update(delta, input || aiInput, this.ball);
    }

    for (const p of this.playersB) {
      const input = p.isActive ? inputB : null;
      const aiInput = p.isActive ? null : buildAIInput(p, this.ball, this.playersB, this.playersA, delta);
      p.update(delta, input || aiInput, this.ball);
    }

    // Player-player collisions (push apart)
    this.resolvePlayerCollisions();

    // Ball update
    if (this.phase === 'playing' || this.phase === 'extra_time_1' || this.phase === 'extra_time_2') {
      this.ball.update(delta);
    }

    // Power bars
    const carrierA = this.playersA.find(p => this.ball.controller === p) || activeA;
    const carrierB = this.playersB.find(p => this.ball.controller === p) || activeB;

    if (carrierA) {
      this.powerBarA.showAbovePlayer(carrierA.x, carrierA.y);
      this.powerBarA.updatePower(carrierA.chargePower, carrierA.isCharging);
    }
    if (carrierB) {
      this.powerBarB.showAbovePlayer(carrierB.x, carrierB.y);
      this.powerBarB.updatePower(carrierB.chargePower, carrierB.isCharging);
    }

    // Save previous action state
    this.prevActionA = inputA.action;
    this.prevActionB = inputB.action;

    // Goal detection
    if (this.phase === 'playing' || this.phase === 'extra_time_1' || this.phase === 'extra_time_2') {
      this.checkGoals();
    }
  }

  private getInputA(): PlayerInputState {
    const actionState = deriveActionInputState(this.keys.space.isDown, this.prevActionA);
    return {
      up: this.keys.w.isDown,
      down: this.keys.s.isDown,
      left: this.keys.a.isDown,
      right: this.keys.d.isDown,
      action: actionState.action,
      actionJustPressed: actionState.actionJustPressed,
      actionJustReleased: actionState.actionJustReleased,
    };
  }

  private getInputB(): PlayerInputState {
    const actionState = deriveActionInputState(this.keys.enter.isDown, this.prevActionB);
    return {
      up: this.keys.up.isDown,
      down: this.keys.down.isDown,
      left: this.keys.left.isDown,
      right: this.keys.right.isDown,
      action: actionState.action,
      actionJustPressed: actionState.actionJustPressed,
      actionJustReleased: actionState.actionJustReleased,
    };
  }

  private updateActivePlayer(players: Player[], ball: Ball, input: PlayerInputState) {
    // Auto-switch: closest player to ball becomes active
    let closestDist = Infinity;
    let closestPlayer: Player | null = null;

    for (const p of players) {
      const dist = p.distanceToBall(ball);
      if (dist < closestDist) {
        closestDist = dist;
        closestPlayer = p;
      }
    }

    for (const p of players) {
      p.setActiveState(p === closestPlayer);
    }
  }

  private resolvePlayerCollisions() {
    const allPlayers = [...this.playersA, ...this.playersB];
    for (let i = 0; i < allPlayers.length; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        const a = allPlayers[i];
        const b = allPlayers[j];
        const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
        const minDist = PLAYER_RADIUS * 2;
        if (dist < minDist && dist > 0) {
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          const push = (minDist - dist) / 2;
          a.x -= Math.cos(angle) * push;
          a.y -= Math.sin(angle) * push;
          b.x += Math.cos(angle) * push;
          b.y += Math.sin(angle) * push;
        }
      }
    }
  }

  private checkGoals() {
    if (this.ball.isGoalLeft()) {
      this.onGoal('B');
    } else if (this.ball.isGoalRight()) {
      this.onGoal('A');
    }
  }

  private onGoal(scoringTeam: 'A' | 'B') {
    const prevPhase = this.phase;
    this.phase = 'goal';
    this.paused = true;
    if (this.timerEvent) this.timerEvent.paused = true;

    if (scoringTeam === 'A') {
      this.scoreA++;
    } else {
      this.scoreB++;
    }

    this.hud.updateScore(this.scoreA, this.scoreB);

    const scoringName = scoringTeam === 'A' ? this.sceneData.teamA.name : this.sceneData.teamB.name;
    const isGolden = (prevPhase === 'extra_time_1' || prevPhase === 'extra_time_2') &&
      this.sceneData.settings.goldenGoal;

    this.cameras.main.flash(400, 255, 215, 0, true);
    this.cameras.main.shake(300, 0.01);

    this.hud.showGoalBanner(scoringName, () => {
      if (isGolden) {
        this.endMatch();
        return;
      }

      // Reset for kickoff
      this.kickoffSide = scoringTeam === 'A' ? 1 : 0;
      this.ball.reset(FIELD_CENTER_X, FIELD_CENTER_Y);
      this.resetPlayerPositions();
      this.phase = 'playing';
      this.paused = false;
      if (this.timerEvent) this.timerEvent.paused = false;
    });
  }

  private resetPlayerPositions() {
    const posA = this.getStartPositions(0);
    const posB = this.getStartPositions(1);
    this.playersA.forEach((p, i) => { p.x = posA[i].x; p.y = posA[i].y; p.vx = 0; p.vy = 0; });
    this.playersB.forEach((p, i) => { p.x = posB[i].x; p.y = posB[i].y; p.vx = 0; p.vy = 0; });
  }

  // ======================== PENALTIES ========================
  private startPenalties() {
    this.phase = 'penalties';
    this.paused = false;
    this.penalty = {
      round: 1,
      maxRounds: 5,
      teamATaken: 0,
      teamBTaken: 0,
      teamAScored: 0,
      teamBScored: 0,
      currentTeam: 'A',
      shooterActive: false,
      keeperActive: false,
      shooterDir: 0,
      keeperDir: 0,
      chargeTime: 0,
    };

    // Clear field
    [...this.playersA, ...this.playersB].forEach(p => p.setVisible(false));
    this.ball.setVisible(false);

    this.setupPenaltyKick();
  }

  private setupPenaltyKick() {
    if (!this.penalty) return;

    const isTeamA = this.penalty.currentTeam === 'A';
    // Shooter on right (attacking left goal) for team A, or left (attacking right goal) for team B
    const shooterX = isTeamA ? FIELD_CENTER_X + 100 : FIELD_CENTER_X - 100;
    const shooterY = FIELD_CENTER_Y;
    const keeperX = isTeamA ? FIELD_LEFT + 40 : FIELD_RIGHT - 40;
    const keeperY = FIELD_CENTER_Y;
    const ballX = isTeamA ? FIELD_LEFT + 110 : FIELD_RIGHT - 110;
    const ballY = FIELD_CENTER_Y;

    this.penaltyPlayers.forEach(p => p.destroy());
    this.penaltyPlayers = [];
    this.ball.reset(ballX, ballY);
    this.ball.setVisible(true);

    const team = isTeamA ? this.playersA : this.playersB;
    const gk = (isTeamA ? this.playersB : this.playersA).find(p => p.isGK)!;

    // Re-use first outfield player as shooter
    const shooter = team.find(p => !p.isGK)!;
    shooter.x = shooterX;
    shooter.y = shooterY;
    shooter.setVisible(true);
    gk.x = keeperX;
    gk.y = keeperY;
    gk.setVisible(true);

    this.penalty.shooterActive = true;
    this.penalty.keeperActive = true;
    this.penalty.shooterDir = 0;
    this.penalty.keeperDir = 0;
    this.penalty.chargeTime = 0;

    // Show penalty HUD
    if (!this.penaltyResultText) {
      this.penaltyResultText = this.add.text(FIELD_CENTER_X, FIELD_TOP - 20, '', {
        fontSize: '18px', color: '#FFD700', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(600);
    }
    const { teamAScored, teamATaken, teamBScored, teamBTaken, round, currentTeam } = this.penalty;
    this.penaltyResultText.setText(
      `${this.sceneData.teamA.name} ${teamAScored}/${teamATaken} | ${this.sceneData.teamB.name} ${teamBScored}/${teamBTaken} | Kick ${round} - ${currentTeam === 'A' ? this.sceneData.teamA.name : this.sceneData.teamB.name}`
    );
  }

  private updatePenalties(delta: number) {
    if (!this.penalty) return;
    const p = this.penalty;
    const dt = delta / 1000;

    const isTeamA = p.currentTeam === 'A';
    const shooterInput = isTeamA ? this.getInputA() : this.getInputB();
    const keeperInput = isTeamA ? this.getInputB() : this.getInputA();

    // Shooter aims
    if (shooterInput.left) p.shooterDir = -1;
    if (shooterInput.right) p.shooterDir = 1;
    if (!shooterInput.left && !shooterInput.right) p.shooterDir = 0;

    // Keeper guesses
    if (keeperInput.left) p.keeperDir = -1;
    if (keeperInput.right) p.keeperDir = 1;
    if (!keeperInput.left && !keeperInput.right) p.keeperDir = 0;

    // Shooter charges and shoots
    if (shooterInput.action) {
      p.chargeTime = Math.min(1, p.chargeTime + dt / 1.2);
    }

    if (shooterInput.actionJustReleased) {
      this.executePenaltyKick();
    }

    this.prevActionA = this.getInputA().action;
    this.prevActionB = this.getInputB().action;
  }

  private executePenaltyKick() {
    if (!this.penalty) return;
    const p = this.penalty;
    const isTeamA = p.currentTeam === 'A';
    const ballX = this.ball.x;
    const ballY = this.ball.y;

    // Determine if it's a goal
    const hitDir = p.shooterDir;
    const saveDir = p.keeperDir;
    const saved = hitDir === saveDir && p.chargeTime < 0.8; // Keeper saves if same direction AND shot not powerful enough
    const missed = p.chargeTime < 0.2; // Missed if barely charged

    let scored = !saved && !missed;

    // Animate ball
    const isTeamAKicking = isTeamA;
    const goalX = isTeamAKicking ? FIELD_LEFT - 10 : FIELD_RIGHT + 10;
    const goalY = FIELD_CENTER_Y + hitDir * 50;
    const savePosX = isTeamAKicking ? FIELD_LEFT + 40 : FIELD_RIGHT - 40;
    const savePosY = FIELD_CENTER_Y + saveDir * 50;

    this.ball.setVelocity(
      isTeamAKicking ? -600 : 600,
      hitDir * 200
    );

    this.time.delayedCall(600, () => {
      this.ball.setVelocity(0, 0);
      const resultText = scored ? '⚽ GOAL!' : (missed ? 'MISSED!' : 'SAVED!');
      const resultColor = scored ? '#FFD700' : '#FF4444';

      const rt = this.add.text(FIELD_CENTER_X, FIELD_CENTER_Y, resultText, {
        fontSize: '48px', color: resultColor, fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 6,
      }).setOrigin(0.5).setDepth(700);

      if (scored) {
        if (isTeamA) p.teamAScored++;
        else p.teamBScored++;
      }

      if (isTeamA) p.teamATaken++;
      else p.teamBTaken++;

      this.time.delayedCall(1200, () => {
        rt.destroy();
        this.advancePenalties();
      });
    });
  }

  private advancePenalties() {
    if (!this.penalty) return;
    const p = this.penalty;

    // Check if match is decided early
    const remaining = p.maxRounds - Math.max(p.teamATaken, p.teamBTaken);
    const canAWin = p.teamAScored + remaining > p.teamBScored;
    const canBWin = p.teamBScored + remaining > p.teamAScored;

    if (p.teamATaken === p.maxRounds && p.teamBTaken === p.maxRounds) {
      if (p.teamAScored !== p.teamBScored) {
        // End
        this.endPenalties();
        return;
      } else {
        // Sudden death: next round
        p.maxRounds++;
      }
    }

    // Switch team
    if (p.currentTeam === 'A') {
      p.currentTeam = 'B';
    } else {
      p.currentTeam = 'A';
      p.round++;
    }

    this.setupPenaltyKick();
  }

  private endPenalties() {
    if (!this.penalty) return;
    const p = this.penalty;
    const winner = p.teamAScored > p.teamBScored ? this.sceneData.teamA : this.sceneData.teamB;

    this.hud.showHalfTimeBanner(`${winner.flag_emoji} ${winner.name} WIN ON PENALTIES\n${p.teamAScored} - ${p.teamBScored}`, () => {
      this.phase = 'ended';

      // Use penalty scores to determine final result
      const finalScoreA = this.scoreA;
      const finalScoreB = this.scoreB;

      if (this.sceneData.matchId) {
        api.postResult({
          matchId: this.sceneData.matchId,
          scoreA: finalScoreA,
          scoreB: finalScoreB,
          penalties: true,
          penaltyScoreA: p.teamAScored,
          penaltyScoreB: p.teamBScored,
        }).catch(console.error);
      }

      this.scene.start('ResultScene', {
        teamA: this.sceneData.teamA,
        teamB: this.sceneData.teamB,
        scoreA: finalScoreA,
        scoreB: finalScoreB,
        penaltyScoreA: p.teamAScored,
        penaltyScoreB: p.teamBScored,
        mode: this.sceneData.mode,
      });
    });
  }

  private async loadPlayersWithFallback(teamId: number, fallback: () => ApiPlayer[]): Promise<ApiPlayer[]> {
    const playersPromise = api.getTeamPlayers(teamId);
    const timeoutPromise = new Promise<ApiPlayer[]>((_, reject) => {
      this.time.delayedCall(800, () => reject(new Error(`Timed out loading players for team ${teamId}`)));
    });

    try {
      return await Promise.race([playersPromise, timeoutPromise]);
    } catch {
      return fallback();
    }
  }

  private createDummyPlayers(teamId: number): ApiPlayer[] {
    return [
      { id: teamId * 100 + 1, name: 'Goalkeeper', team_id: teamId, position: 'GK', shirt_number: 1 },
      { id: teamId * 100 + 2, name: 'Defender', team_id: teamId, position: 'DEF', shirt_number: 4 },
      { id: teamId * 100 + 3, name: 'Midfielder', team_id: teamId, position: 'MID', shirt_number: 8 },
      { id: teamId * 100 + 4, name: 'Forward', team_id: teamId, position: 'FWD', shirt_number: 9 },
    ];
  }
}
