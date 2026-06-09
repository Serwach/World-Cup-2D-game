/**
 * Unit tests: Ball physics logic
 */

// Inline implementation matching Ball.ts logic for pure unit testing
const BALL_FRICTION = 0.984;
const BALL_MIN_SPEED = 8;
const FIELD_LEFT = 90;
const FIELD_RIGHT = 1190;
const FIELD_TOP = 60;
const FIELD_BOTTOM = 660;
const GOAL_TOP = 295;
const GOAL_BOTTOM = 425;
const GOAL_DEPTH = 30;
const BALL_RADIUS = 8;

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function updateBall(ball: BallState, dt: number): BallState {
  let { x, y, vx, vy } = ball;
  const frames = dt / (1000 / 60);

  x += vx * dt;
  y += vy * dt;

  vx *= Math.pow(BALL_FRICTION, frames);
  vy *= Math.pow(BALL_FRICTION, frames);

  if (Math.abs(vx) < BALL_MIN_SPEED) vx = 0;
  if (Math.abs(vy) < BALL_MIN_SPEED) vy = 0;

  // Wall bouncing (excluding goal areas)
  if (x - BALL_RADIUS < FIELD_LEFT) {
    const inGoal = y >= GOAL_TOP && y <= GOAL_BOTTOM;
    if (!inGoal) {
      x = FIELD_LEFT + BALL_RADIUS;
      vx = Math.abs(vx) * 0.75;
    }
  }
  if (x + BALL_RADIUS > FIELD_RIGHT) {
    const inGoal = y >= GOAL_TOP && y <= GOAL_BOTTOM;
    if (!inGoal) {
      x = FIELD_RIGHT - BALL_RADIUS;
      vx = -Math.abs(vx) * 0.75;
    }
  }
  if (y - BALL_RADIUS < FIELD_TOP) {
    y = FIELD_TOP + BALL_RADIUS;
    vy = Math.abs(vy) * 0.75;
  }
  if (y + BALL_RADIUS > FIELD_BOTTOM) {
    y = FIELD_BOTTOM - BALL_RADIUS;
    vy = -Math.abs(vy) * 0.75;
  }

  return { x, y, vx, vy };
}

function isGoalLeft(ball: BallState): boolean {
  return ball.x - BALL_RADIUS < FIELD_LEFT - GOAL_DEPTH &&
    ball.y >= GOAL_TOP && ball.y <= GOAL_BOTTOM;
}

function isGoalRight(ball: BallState): boolean {
  return ball.x + BALL_RADIUS > FIELD_RIGHT + GOAL_DEPTH &&
    ball.y >= GOAL_TOP && ball.y <= GOAL_BOTTOM;
}

describe('Ball physics', () => {
  test('Ball moves with velocity over time', () => {
    const ball: BallState = { x: 640, y: 360, vx: 100, vy: 0 };
    const dt = 0.1; // 100ms
    const updated = updateBall(ball, dt);
    expect(updated.x).toBeGreaterThan(640);
    expect(updated.y).toBeCloseTo(360, 1);
  });

  test('Ball decelerates due to friction', () => {
    let ball: BallState = { x: 640, y: 360, vx: 500, vy: 0 };
    for (let i = 0; i < 60; i++) {
      ball = updateBall(ball, 1000 / 60);
    }
    expect(Math.abs(ball.vx)).toBeLessThan(500);
  });

  test('Ball stops when speed below minimum', () => {
    let ball: BallState = { x: 640, y: 360, vx: 5, vy: 0 };
    ball = updateBall(ball, 1000 / 60);
    expect(ball.vx).toBe(0);
  });

  test('Ball bounces off top wall', () => {
    const ball: BallState = { x: 640, y: FIELD_TOP - 5, vx: 0, vy: -200 };
    const updated = updateBall(ball, 1000 / 60);
    expect(updated.vy).toBeGreaterThan(0); // Reversed to positive (downward)
    expect(updated.y).toBeGreaterThanOrEqual(FIELD_TOP);
  });

  test('Ball bounces off bottom wall', () => {
    const ball: BallState = { x: 640, y: FIELD_BOTTOM + 5, vx: 0, vy: 200 };
    const updated = updateBall(ball, 1000 / 60);
    expect(updated.vy).toBeLessThan(0); // Reversed to negative (upward)
  });

  test('Ball bounces off left wall when not in goal area', () => {
    const ball: BallState = { x: FIELD_LEFT - 5, y: 200, vx: -200, vy: 0 };
    const updated = updateBall(ball, 1000 / 60);
    expect(updated.vx).toBeGreaterThan(0); // Reversed
    expect(updated.x).toBeGreaterThanOrEqual(FIELD_LEFT);
  });

  test('Ball passes through goal mouth on left', () => {
    const ball: BallState = { x: FIELD_LEFT + 5, y: (GOAL_TOP + GOAL_BOTTOM) / 2, vx: -400, vy: 0 };
    const updated = updateBall(ball, 1000 / 60);
    expect(updated.vx).toBeLessThan(0); // Not reversed — passed through
  });

  test('Ball bounces off left wall outside goal height', () => {
    const ball: BallState = { x: FIELD_LEFT - 5, y: 150, vx: -200, vy: 0 };
    const updated = updateBall(ball, 1000 / 60);
    expect(updated.vx).toBeGreaterThan(0);
  });
});

describe('Goal detection', () => {
  test('Detects goal in left net (team B scores)', () => {
    const ball: BallState = { x: FIELD_LEFT - GOAL_DEPTH - 10, y: (GOAL_TOP + GOAL_BOTTOM) / 2, vx: -100, vy: 0 };
    expect(isGoalLeft(ball)).toBe(true);
  });

  test('No goal if ball out of height range left', () => {
    const ball: BallState = { x: FIELD_LEFT - GOAL_DEPTH - 10, y: 100, vx: -100, vy: 0 };
    expect(isGoalLeft(ball)).toBe(false);
  });

  test('Detects goal in right net (team A scores)', () => {
    const ball: BallState = { x: FIELD_RIGHT + GOAL_DEPTH + 10, y: (GOAL_TOP + GOAL_BOTTOM) / 2, vx: 100, vy: 0 };
    expect(isGoalRight(ball)).toBe(true);
  });

  test('No goal if ball not far enough right', () => {
    const ball: BallState = { x: FIELD_RIGHT + 5, y: (GOAL_TOP + GOAL_BOTTOM) / 2, vx: 100, vy: 0 };
    expect(isGoalRight(ball)).toBe(false);
  });
});

describe('Shot power scaling', () => {
  const MIN_KICK_POWER = 200;
  const MAX_KICK_POWER = 950;

  function calcShotSpeed(power: number): number {
    return MIN_KICK_POWER + power * (MAX_KICK_POWER - MIN_KICK_POWER);
  }

  test('Zero power gives minimum kick speed', () => {
    expect(calcShotSpeed(0)).toBe(MIN_KICK_POWER);
  });

  test('Full power gives maximum kick speed', () => {
    expect(calcShotSpeed(1)).toBe(MAX_KICK_POWER);
  });

  test('Half power is midway', () => {
    const mid = calcShotSpeed(0.5);
    expect(mid).toBeCloseTo((MIN_KICK_POWER + MAX_KICK_POWER) / 2, 0);
  });

  test('Power is monotonically increasing', () => {
    for (let p = 0; p < 1; p += 0.1) {
      expect(calcShotSpeed(p + 0.1)).toBeGreaterThan(calcShotSpeed(p));
    }
  });

  test('Shot speed is always within bounds', () => {
    for (let p = 0; p <= 1; p += 0.05) {
      const speed = calcShotSpeed(p);
      expect(speed).toBeGreaterThanOrEqual(MIN_KICK_POWER);
      expect(speed).toBeLessThanOrEqual(MAX_KICK_POWER);
    }
  });
});
