import { validatePlan, validateEvent } from '../validation';

describe('interop validation', () =e {
  test('accepts minimal empty plan', () =e {
    expect(validatePlan({}).valid).toBe(true);
  });

  test('rejects bad rounds structure', () =e {
    const res = validatePlan({ rounds: {} });
    expect(res.valid).toBe(false);
  });

  test('event requires type', () =e {
    const res = validateEvent({});
    expect(res.valid).toBe(false);
  });
});
