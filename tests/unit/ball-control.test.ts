import { evaluateBallInteraction } from '../../client/src/game/ballControl';

describe('evaluateBallInteraction', () => {
  it('takes control of a loose ball when approaching it closely', () => {
    const result = evaluateBallInteraction({
      distToBall: 12,
      isCharging: false,
      actionJustPressed: false,
      hasBallController: false,
      controllerIsSelf: false,
      ballSpeed: 40,
      controlRange: 20,
      stealRange: 30,
      interceptRange: 38,
    });

    expect(result.shouldTakeControl).toBe(true);
    expect(result.shouldSteal).toBe(false);
    expect(result.shouldIntercept).toBe(false);
  });

  it('steals the ball when pressing action near the carrier', () => {
    const result = evaluateBallInteraction({
      distToBall: 18,
      isCharging: false,
      actionJustPressed: true,
      hasBallController: true,
      controllerIsSelf: false,
      ballSpeed: 20,
      controlRange: 20,
      stealRange: 30,
      interceptRange: 38,
    });

    expect(result.shouldSteal).toBe(true);
    expect(result.shouldTakeControl).toBe(false);
  });

  it('intercepts a moving ball when pressing action near it', () => {
    const result = evaluateBallInteraction({
      distToBall: 24,
      isCharging: false,
      actionJustPressed: true,
      hasBallController: false,
      controllerIsSelf: false,
      ballSpeed: 220,
      controlRange: 20,
      stealRange: 30,
      interceptRange: 38,
    });

    expect(result.shouldIntercept).toBe(true);
    expect(result.shouldTakeControl).toBe(false);
  });
});
