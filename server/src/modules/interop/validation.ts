// Lightweight runtime validation for Mon-Pacing interop payloads
// Avoids extra deps; keep permissive but shields obvious bad inputs.

export type ValidationResult = { valid: true } | { valid: false; errors: string[] };

export function validatePlan(input: any): ValidationResult {
  const errors: string[] = [];
  if (input == null || typeof input !== 'object') {
    return { valid: false, errors: ['body must be an object'] };
  }
  if (input.teams != null && !Array.isArray(input.teams)) {
    errors.push('teams must be an array');
  }
  if (Array.isArray(input.teams)) {
    input.teams.forEach((t: any, i: number) => {
      if (!t || typeof t !== 'object') errors.push(`teams[${i}] must be object`);
      else if (typeof t.name !== 'string' || t.name.trim() === '') errors.push(`teams[${i}].name must be non-empty string`);
    });
  }
  if (input.rounds != null && !Array.isArray(input.rounds)) {
    errors.push('rounds must be an array');
  }
  if (Array.isArray(input.rounds)) {
    input.rounds.forEach((r: any, i: number) => {
      if (!r || typeof r !== 'object') errors.push(`rounds[${i}] must be object`);
      else {
        if (r.type != null && typeof r.type !== 'string') errors.push(`rounds[${i}].type must be string`);
        if (r.category != null && typeof r.category !== 'string') errors.push(`rounds[${i}].category must be string`);
        if (r.theme != null && typeof r.theme !== 'string') errors.push(`rounds[${i}].theme must be string`);
        if (r.durationsInSeconds != null && !Array.isArray(r.durationsInSeconds)) errors.push(`rounds[${i}].durationsInSeconds must be array`);
      }
    });
  }
  return errors.length ? { valid: false, errors } : { valid: true };
}

export function validateEvent(input: any): ValidationResult {
  const errors: string[] = [];
  if (input == null || typeof input !== 'object') return { valid: false, errors: ['body must be an object'] };
  if (typeof input.type !== 'string' || input.type.trim() === '') errors.push('type must be non-empty string');
  if (input.payload != null && typeof input.payload !== 'object') errors.push('payload must be object when provided');
  return errors.length ? { valid: false, errors } : { valid: true };
}
