export interface BallInteractionDecision {
  shouldTakeControl: boolean;
  shouldSteal: boolean;
  shouldIntercept: boolean;
}

export function evaluateBallInteraction({
  distToBall,
  isCharging,
  actionJustPressed,
  hasBallController,
  controllerIsSelf,
  ballSpeed,
  controlRange,
  stealRange,
  interceptRange,
}: {
  distToBall: number;
  isCharging: boolean;
  actionJustPressed: boolean;
  hasBallController: boolean;
  controllerIsSelf: boolean;
  ballSpeed: number;
  controlRange: number;
  stealRange: number;
  interceptRange: number;
}): BallInteractionDecision {
  if (isCharging) {
    return { shouldTakeControl: false, shouldSteal: false, shouldIntercept: false };
  }

  if (controllerIsSelf) {
    return { shouldTakeControl: true, shouldSteal: false, shouldIntercept: false };
  }

  if (hasBallController) {
    return {
      shouldTakeControl: false,
      shouldSteal: actionJustPressed && distToBall <= stealRange,
      shouldIntercept: false,
    };
  }

  if (ballSpeed > 90) {
    return {
      shouldTakeControl: false,
      shouldSteal: false,
      shouldIntercept: actionJustPressed && distToBall <= interceptRange,
    };
  }

  return {
    shouldTakeControl: distToBall <= controlRange,
    shouldSteal: false,
    shouldIntercept: false,
  };
}
