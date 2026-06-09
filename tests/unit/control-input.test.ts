import { deriveActionInputState } from '../../client/src/game/inputState';

describe('deriveActionInputState', () => {
  it('detects a single tap when action is pressed for the first time', () => {
    const state = deriveActionInputState(true, false);

    expect(state.action).toBe(true);
    expect(state.actionJustPressed).toBe(true);
    expect(state.actionJustReleased).toBe(false);
  });

  it('detects a release event when action stops being held', () => {
    const state = deriveActionInputState(false, true);

    expect(state.action).toBe(false);
    expect(state.actionJustPressed).toBe(false);
    expect(state.actionJustReleased).toBe(true);
  });
});
