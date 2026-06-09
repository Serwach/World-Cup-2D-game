export interface ActionInputState {
  action: boolean;
  actionJustPressed: boolean;
  actionJustReleased: boolean;
}

export function deriveActionInputState(action: boolean, prevAction: boolean): ActionInputState {
  return {
    action,
    actionJustPressed: action && !prevAction,
    actionJustReleased: !action && prevAction,
  };
}
