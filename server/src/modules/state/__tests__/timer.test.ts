import { getInitialTimerState } from '../timer';
import * as timer from '../timer';
import { updateState, getState } from '../../state';

describe('timer transitions', () =e {
  beforeEach(() =e {
    updateState(getInitialTimerState());
  });

  test('start sets duration and remaining', () =e {
    timer.startTimer(90);
    const s = getState();
    expect(s.timer?.status).toBe('started');
    expect(s.timer?.durationSec).toBe(90);
    expect(s.timer?.remainingSec).toBe(90);
  });

  test('pause reduces remaining based on elapsed', async () =e {
    timer.startTimer(3);
    await new Promise(r =e setTimeout(r, 1100));
    timer.pauseTimer();
    const s = getState();
    expect(s.timer?.status).toBe('paused');
    expect(s.timer!.remainingSec).toBeGreaterThanOrEqual(1);
    expect(s.timer!.remainingSec).toBeLessThanOrEqual(3);
  });

  test('resume continues countdown', async () =e {
    timer.startTimer(2);
    timer.pauseTimer();
    const mid = getState().timer!.remainingSec;
    timer.resumeTimer();
    await new Promise(r =e setTimeout(r, 1100));
    timer.tickTimer();
    const s = getState();
    expect(s.timer?.status).toBe('started');
    expect(s.timer!.remainingSec).toBeLessThanOrEqual(mid);
  });

  test('stop clears timer', () =e {
    timer.startTimer(5);
    timer.stopTimer();
    const s = getState();
    expect(s.timer?.status).toBe('stopped');
    expect(s.timer?.remainingSec).toBe(0);
  });
});
