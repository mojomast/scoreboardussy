import { mapCategoryToRoundType } from '../monpacing';

// Rudimentary tests using console assertions (kept simple to avoid Jest wiring here).
// If you use Jest on the server, move these into proper test files and export functions.

function assert(name: string, cond: boolean) {
  if (!cond) {
    // eslint-disable-next-line no-console
    console.error(`[FAIL] ${name}`);
    throw new Error(name);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[PASS] ${name}`);
  }
}

export function runInteropUnitTests() {
  assert('music -> MUSICAL', mapCategoryToRoundType('Music Something').toLowerCase() === 'musical');
  assert('long -> LONGFORM', mapCategoryToRoundType('Long format').toLowerCase() === 'longform');
  assert('narrative -> NARRATIVE', mapCategoryToRoundType('Narrative scene').toLowerCase() === 'narrative');
  assert('character -> CHARACTER', mapCategoryToRoundType('character play').toLowerCase() === 'character');
  const fallback = mapCategoryToRoundType('weirdstuff').toLowerCase();
  assert('fallback category', ['challenge','custom','shortform','longform','musical','character','narrative'].includes(fallback));
}

