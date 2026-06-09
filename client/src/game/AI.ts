import Phaser from 'phaser';
import { Player, PlayerInputState } from './Player';
import { Ball } from './Ball';
import {
  FIELD_LEFT, FIELD_RIGHT, FIELD_CENTER_X, FIELD_CENTER_Y,
  GOAL_TOP, GOAL_BOTTOM, GK_ZONE_DEPTH,
} from '@shared/constants';

const EMPTY_INPUT: PlayerInputState = {
  up: false, down: false, left: false, right: false,
  action: false, actionJustPressed: false, actionJustReleased: false,
};

export function buildAIInput(
  player: Player,
  ball: Ball,
  teammates: Player[],
  opponents: Player[],
  delta: number
): PlayerInputState {
  if (player.isActive) return EMPTY_INPUT; // Player is human-controlled

  if (player.isGK) {
    return buildGKInput(player, ball);
  }

  return buildOutfieldInput(player, ball, teammates, opponents);
}

function buildGKInput(gk: Player, ball: Ball): PlayerInputState {
  const isLeftTeam = gk.teamIndex === 0;
  const goalX = isLeftTeam ? FIELD_LEFT + 20 : FIELD_RIGHT - 20;
  const goalCenterY = (GOAL_TOP + GOAL_BOTTOM) / 2;

  const ballToGoalDist = Math.abs(ball.x - goalX);
  const isDangerous = ballToGoalDist < 320 || (ball.vx !== 0 && Math.abs(ball.vx) > 90);
  const hasOpponentBall = ball.controller && ball.controller.teamIndex !== gk.teamIndex;

  let targetX: number;
  let targetY: number;

  if (hasOpponentBall) {
    targetX = ball.controller!.x + (isLeftTeam ? 30 : -30);
    targetY = Phaser.Math.Clamp(ball.controller!.y, GOAL_TOP + 20, GOAL_BOTTOM - 20);
  } else if (isDangerous) {
    targetX = goalX + (isLeftTeam ? 30 : -30);
    targetY = Phaser.Math.Clamp(ball.y, GOAL_TOP + 20, GOAL_BOTTOM - 20);
  } else {
    targetX = goalX + (isLeftTeam ? 40 : -40);
    targetY = goalCenterY;
  }

  return moveTowards(gk, targetX, targetY, 10);
}

function buildOutfieldInput(
  player: Player,
  ball: Ball,
  teammates: Player[],
  opponents: Player[]
): PlayerInputState {
  const isLeftTeam = player.teamIndex === 0;
  const leader = teammates.find(t => t.isActive && !t.isGK)
    || teammates.find(t => !t.isGK && t.distanceToBall(ball) < 120)
    || teammates.find(t => !t.isGK)
    || player;

  const playerIndex = teammates.indexOf(player);
  const leaderIndex = teammates.indexOf(leader);
  const supportOffsetX = isLeftTeam ? -70 : 70;
  const supportOffsetY = (playerIndex - leaderIndex) * 34;

  const targetX = leader.x + supportOffsetX;
  const targetY = Phaser.Math.Clamp(leader.y + supportOffsetY, GOAL_TOP - 40, GOAL_BOTTOM + 40);

  return moveTowards(player, targetX, targetY, 24);
}

function moveTowards(
  player: Player,
  targetX: number,
  targetY: number,
  threshold: number
): PlayerInputState {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const deadzone = Math.max(8, threshold * 0.5);
  if (dist < deadzone) return EMPTY_INPUT;

  const input: PlayerInputState = {
    up: false, down: false, left: false, right: false,
    action: false, actionJustPressed: false, actionJustReleased: false,
  };

  if (dx > deadzone) input.right = true;
  else if (dx < -deadzone) input.left = true;

  if (dy > deadzone) input.down = true;
  else if (dy < -deadzone) input.up = true;

  return input;
}
