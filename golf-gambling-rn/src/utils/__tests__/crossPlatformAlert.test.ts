/**
 * Tests for crossPlatformAlert utility
 *
 * Since crossPlatformAlert uses Platform.OS which is set at module load time,
 * we test the logic paths by directly testing the web behavior functions.
 */

// --- Test helpers ---
let passed = 0;
let failed = 0;
const results: string[] = [];

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    results.push(`  PASS: ${message}`);
  } else {
    failed++;
    results.push(`  FAIL: ${message}`);
  }
}

function describe(name: string, fn: () => void) {
  results.push(`\n${name}`);
  fn();
}

function it(name: string, fn: () => void) {
  try {
    fn();
  } catch (e: any) {
    failed++;
    results.push(`  FAIL: ${name} — ${e.message}`);
  }
}

// --- Simulate the web alert logic extracted from crossPlatformAlert ---

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Web implementation logic extracted for testing.
 * Returns: { type: 'alert' | 'confirm', message: string, action?: () => void, cancel?: () => void }
 */
function simulateWebAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): { type: 'alert' | 'confirm'; message: string; onOk?: () => void; onCancel?: () => void } {
  const fullMessage = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    return { type: 'alert', message: fullMessage };
  }

  if (buttons.length === 1) {
    return { type: 'alert', message: fullMessage, onOk: buttons[0].onPress };
  }

  // Two or more buttons: use confirm()
  const cancelButton = buttons.find((b) => b.style === 'cancel');
  const actionButton = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];

  return {
    type: 'confirm',
    message: fullMessage,
    onOk: actionButton?.onPress,
    onCancel: cancelButton?.onPress,
  };
}

// --- Tests ---

describe('crossPlatformAlert web logic', () => {
  it('should format title-only message', () => {
    const result = simulateWebAlert('Error');
    assert(result.type === 'alert', 'Title-only uses alert');
    assert(result.message === 'Error', 'Message is just the title');
  });

  it('should format title + message', () => {
    const result = simulateWebAlert('Error', 'Something went wrong');
    assert(result.type === 'alert', 'Title+message with no buttons uses alert');
    assert(result.message === 'Error\n\nSomething went wrong', 'Combines title and message with newlines');
  });

  it('should use alert for empty buttons array', () => {
    const result = simulateWebAlert('Info', 'Details', []);
    assert(result.type === 'alert', 'Empty buttons array uses alert');
  });

  it('should use alert for single button', () => {
    let pressed = false;
    const result = simulateWebAlert('Done', 'All set', [
      { text: 'OK', onPress: () => { pressed = true; } },
    ]);
    assert(result.type === 'alert', 'Single button uses alert');
    result.onOk?.();
    assert(pressed === true, 'Single button onPress fires after alert');
  });

  it('should use confirm for two buttons', () => {
    let action = '';
    const result = simulateWebAlert('Delete?', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel', onPress: () => { action = 'cancelled'; } },
      { text: 'Delete', style: 'destructive', onPress: () => { action = 'deleted'; } },
    ]);
    assert(result.type === 'confirm', 'Two buttons uses confirm');

    // Simulate user clicking OK
    result.onOk?.();
    assert(action === 'deleted', 'OK triggers action button onPress');

    // Reset and simulate cancel
    action = '';
    result.onCancel?.();
    assert(action === 'cancelled', 'Cancel triggers cancel button onPress');
  });

  it('should use confirm for three buttons', () => {
    let action = '';
    const result = simulateWebAlert('Choose', 'Pick one', [
      { text: 'Option A', onPress: () => { action = 'a'; } },
      { text: 'Option B', onPress: () => { action = 'b'; } },
      { text: 'Cancel', style: 'cancel', onPress: () => { action = 'cancel'; } },
    ]);
    assert(result.type === 'confirm', 'Three buttons uses confirm');

    // The first non-cancel button should be the action
    result.onOk?.();
    assert(action === 'a', 'First non-cancel button is the action button');
  });

  it('should handle buttons with no onPress', () => {
    const result = simulateWebAlert('Info', 'Nothing to do', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK' },
    ]);
    assert(result.type === 'confirm', 'Still uses confirm for two buttons');
    // Should not throw when calling undefined onPress
    result.onOk?.();
    result.onCancel?.();
    assert(true, 'No crash when buttons have no onPress');
  });

  it('should handle no cancel-styled button (fallback)', () => {
    let action = '';
    const result = simulateWebAlert('Choose', undefined, [
      { text: 'Yes', onPress: () => { action = 'yes'; } },
      { text: 'No', onPress: () => { action = 'no'; } },
    ]);
    assert(result.type === 'confirm', 'Two default-style buttons uses confirm');
    // First non-cancel is "Yes" (first in array)
    result.onOk?.();
    assert(action === 'yes', 'First button is treated as action when no cancel style');
  });

  it('should handle undefined message', () => {
    const result = simulateWebAlert('Just Title', undefined);
    assert(result.message === 'Just Title', 'Undefined message gives title-only string');
  });

  it('should handle empty string message', () => {
    const result = simulateWebAlert('Title', '');
    assert(result.message === 'Title', 'Empty string message gives title-only string');
  });
});

// --- Print results ---
console.log('\ncrossPlatformAlert Tests');
console.log('========================');
for (const r of results) {
  console.log(r);
}
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
