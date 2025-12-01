# E2E Testing Guide for Claude Code

This guide explains how to read, understand, and write E2E tests for the OBS Overlay project. Use this as a reference when working with Claude Code to continue test development.

## Table of Contents
1. [Understanding Test Structure](#understanding-test-structure)
2. [How Tests Work](#how-tests-work)
3. [Reading Existing Tests](#reading-existing-tests)
4. [Common Patterns](#common-patterns)
5. [Writing New Tests](#writing-new-tests)
6. [Debugging Tests](#debugging-tests)
7. [Test Helpers Reference](#test-helpers-reference)

---

## Understanding Test Structure

### File Organization
```
tests/
├── e2e/                           # End-to-end tests
│   └── realtime/                  # Real-time sync tests
│       ├── wheel-spinner.spec.ts  # Wheel feature tests
│       └── color-scheme-sync.spec.ts # Color scheme tests
├── fixtures/                      # Test setup utilities
│   ├── auth.ts                    # Authentication helpers
│   └── database.ts                # Database seeding/cleanup
└── utils/                         # Test helper functions
    └── test-helpers.ts            # Socket, canvas, and other utilities
```

### Test File Structure
Each test file follows this pattern:

```typescript
import { test, expect } from '@playwright/test';
import { setupTestDatabase, teardownTestDatabase } from '../../fixtures/database';
import { navigateToDashboard, navigateToOverlay } from '../../fixtures/auth';

test.describe('Feature Name', () => {
  // Setup: Runs once before all tests in this file
  test.beforeAll(async () => {
    await setupTestDatabase(); // Creates test user and session
  });

  // Cleanup: Runs once after all tests in this file
  test.afterAll(async () => {
    await teardownTestDatabase(); // Deletes test data
  });

  // Individual test
  test('should do something', async ({ page, context }) => {
    // Test code here
  });
});
```

---

## How Tests Work

### The Multi-Window Pattern

Our tests verify that **changes made in the dashboard appear in real-time on the overlay**. This requires opening two browser windows:

```typescript
// 1. Open dashboard
await navigateToDashboard(page);

// 2. Open overlay in a separate window
const overlayPage = await context.newPage();
await navigateToOverlay(overlayPage, 'wheel');

// 3. Make change in dashboard
await page.click('button:has-text("Activate")');

// 4. Verify change appears in overlay
await expect(overlayPage.locator('canvas')).toBeVisible();
```

**Key Concepts:**
- `page` = The dashboard window
- `overlayPage` = The overlay window
- `context` = Browser context that contains both windows
- Changes communicate via Socket.io

### Test Lifecycle

```
1. beforeAll()
   └─> Setup database (create test user, test session)

2. test()
   ├─> Navigate to dashboard
   ├─> Open overlay in new window
   ├─> Make changes in dashboard
   ├─> Verify changes in overlay
   └─> Close overlay window

3. afterAll()
   └─> Cleanup database (delete test data)
```

---

## Reading Existing Tests

### Example: Wheel Spinner Test

Let's break down a real test step-by-step:

```typescript
test('should create wheel in dashboard and spin it in overlay', async ({ page, context }) => {
  // STEP 1: Setup socket tracking
  await exposeSocketStatus(page);

  // STEP 2: Navigate to dashboard with authentication
  await navigateToDashboard(page);

  // STEP 3: Open overlay in separate window
  const overlayPage = await context.newPage();
  await exposeSocketStatus(overlayPage);
  await navigateToOverlay(overlayPage, 'wheel');

  // STEP 4: Click on Wheel Spinner tile to open settings
  await page.click('text=Wheel Spinner');

  // STEP 5: Create a new wheel
  await page.click('text=Create Wheel');
  await page.fill('input[placeholder*="Giveaway"]', 'Test E2E Wheel');
  await page.click('button:has-text("Create Wheel")');

  // STEP 6: Verify wheel was created
  await expect(page.locator('text=Test E2E Wheel')).toBeVisible({ timeout: 5000 });

  // STEP 7: Activate the wheel
  await page.click('button:has-text("Activate")');

  // STEP 8: Verify overlay shows the wheel canvas
  await expect(overlayPage.locator('canvas')).toBeVisible({ timeout: 5000 });

  // STEP 9: Spin the wheel from dashboard
  await spinButton.click();

  // STEP 10: Verify overlay canvas animates
  await waitForCanvasChange(overlayPage, 'canvas', 8000);

  // STEP 11: Verify winner appears
  await expect(overlayPage.locator('text=Winner!')).toBeVisible();

  // STEP 12: Verify wheel stops (no infinite loop)
  const snapshotBefore = await getCanvasSnapshot(overlayPage);
  await overlayPage.waitForTimeout(2000);
  const snapshotAfter = await getCanvasSnapshot(overlayPage);
  expect(snapshotBefore).toBe(snapshotAfter); // Canvas is stable

  // STEP 13: Cleanup
  await overlayPage.close();
});
```

### What Each Part Does

| Code | Purpose |
|------|---------|
| `page.click()` | Clicks an element in the dashboard |
| `overlayPage.locator()` | Finds an element in the overlay |
| `expect().toBeVisible()` | Asserts element appears on screen |
| `waitForCanvasChange()` | Waits for canvas animation to start |
| `getCanvasSnapshot()` | Captures canvas state for comparison |
| `overlayPage.waitForTimeout()` | Waits specified milliseconds |
| `overlayPage.close()` | Closes the overlay window |

---

## Common Patterns

### Pattern 1: Click and Verify Sync

**Use Case:** Click button in dashboard, verify change in overlay

```typescript
// Dashboard: Change setting
await page.click('button:has-text("Cyberpunk")');

// Overlay: Verify it received the change
await overlayPage.waitForTimeout(1000); // Wait for socket to propagate
await expect(overlayPage.locator('body')).toBeVisible(); // Still working
```

### Pattern 2: Fill Form and Create

**Use Case:** Create a new item (wheel, timer, alert)

```typescript
// Open creation form
await page.click('text=Create Wheel');

// Fill in fields
await page.fill('input[name="wheelName"]', 'My Wheel');

// Submit
await page.click('button:has-text("Create")');

// Verify created
await expect(page.locator('text=My Wheel')).toBeVisible();
```

### Pattern 3: Wait for Animation

**Use Case:** Verify canvas animation occurs

```typescript
// Trigger animation
await page.click('button:has-text("Spin")');

// Wait for canvas to change
await waitForCanvasChange(overlayPage, 'canvas', 5000);

// Verify result
await expect(overlayPage.locator('text=Winner!')).toBeVisible();
```

### Pattern 4: Test Socket Event

**Use Case:** Verify Socket.io event was received

```typescript
// This is more advanced - not commonly needed
const eventData = await waitForSocketEvent(overlayPage, 'wheel-spin', 10000);
expect(eventData.winningLabel).toBeDefined();
```

---

## Writing New Tests

### Template for New Feature Test

```typescript
import { test, expect } from '@playwright/test';
import { setupTestDatabase, teardownTestDatabase } from '../../fixtures/database';
import { navigateToDashboard, navigateToOverlay } from '../../fixtures/auth';
import { exposeSocketStatus } from '../../utils/test-helpers';

test.describe('My Feature - Dashboard to Overlay Sync', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test('should sync my feature from dashboard to overlay', async ({ page, context }) => {
    // Setup
    await exposeSocketStatus(page);
    await navigateToDashboard(page);

    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'my-feature'); // Change this to your overlay route

    // Test Steps:
    // 1. Open feature settings in dashboard
    await page.click('text=My Feature');

    // 2. Make a change
    await page.click('button:has-text("Enable")');

    // 3. Verify overlay received the change
    await overlayPage.waitForTimeout(1500); // Give socket time to sync
    await expect(overlayPage.locator('[data-feature="my-feature"]')).toBeVisible();

    // 4. Test another action
    await page.click('button:has-text("Configure")');
    await page.fill('input[name="setting"]', 'test value');
    await page.click('button:has-text("Save")');

    // 5. Verify overlay updated
    await overlayPage.waitForTimeout(1500);
    // Add your verification here

    // Cleanup
    await overlayPage.close();
  });
});
```

### Checklist for New Tests

- [ ] Import required utilities
- [ ] Setup database in `beforeAll()`
- [ ] Cleanup database in `afterAll()`
- [ ] Navigate to both dashboard and overlay
- [ ] Make changes in dashboard
- [ ] Verify changes in overlay
- [ ] Close overlay at end
- [ ] Use descriptive test names
- [ ] Add comments explaining each step
- [ ] Use appropriate timeouts (1500ms for socket sync)

---

## Debugging Tests

### When Tests Fail

1. **Check the screenshot**: Every failure saves a screenshot
   ```bash
   open test-results/[test-name]/test-failed-1.png
   ```

2. **Watch the video**: See what actually happened
   ```bash
   open test-results/[test-name]/video.webm
   ```

3. **Read the error context**:
   ```bash
   cat test-results/[test-name]/error-context.md
   ```

4. **Run in headed mode** to see browser:
   ```bash
   npm run test:headed
   ```

5. **Use debug mode** with breakpoints:
   ```bash
   npm run test:debug
   ```

### Common Issues and Solutions

#### Issue: "Element not found"
```typescript
// ❌ Bad: Selector too generic
await page.click('text=Active');

// ✅ Good: More specific selector
await page.click('span.bg-purple-600:has-text("Active")');
```

#### Issue: "Test timeout"
```typescript
// ❌ Bad: Not waiting for socket
await page.click('button');
await expect(overlayPage.locator('canvas')).toBeVisible();

// ✅ Good: Wait for sync
await page.click('button');
await overlayPage.waitForTimeout(1500); // Socket propagation
await expect(overlayPage.locator('canvas')).toBeVisible({ timeout: 5000 });
```

#### Issue: "Element detached from DOM"
```typescript
// ❌ Bad: Clicking during re-render
await page.click('button:has-text("Deactivate")');

// ✅ Good: Wait for stability
const button = page.locator('button:has-text("Deactivate")');
await button.waitFor({ state: 'visible' });
await button.click({ force: true });
```

#### Issue: "Cannot fill color input"
```typescript
// ❌ Bad: fill() doesn't work on color inputs
await page.fill('input[type="color"]', '#ff0000');

// ✅ Good: Use evaluate to set value
await page.locator('input[type="color"]').evaluate((el: HTMLInputElement) => {
  el.value = '#ff0000';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
});
```

---

## Test Helpers Reference

### Authentication (`fixtures/auth.ts`)

#### `navigateToDashboard(page, sessionId?)`
Opens the dashboard with mock authentication.
```typescript
await navigateToDashboard(page); // Uses TEST_SESSION_ID
await navigateToDashboard(page, 'my-custom-session');
```

#### `navigateToOverlay(page, overlayType, sessionId?)`
Opens an overlay page.
```typescript
await navigateToOverlay(overlayPage, 'wheel');
await navigateToOverlay(overlayPage, 'paint-by-numbers');
```

#### `TEST_SESSION_ID`
The session ID used for all tests: `'test-session-e2e'`

### Database (`fixtures/database.ts`)

#### `setupTestDatabase()`
Creates test user and session. **Call in `beforeAll()`**

#### `teardownTestDatabase()`
Deletes all test data. **Call in `afterAll()`**

#### `cleanupTestData()`
Deletes test session data only (keeps user).

### Utilities (`utils/test-helpers.ts`)

#### `exposeSocketStatus(page)`
Adds socket connection tracking to page. **Call before navigating.**
```typescript
await exposeSocketStatus(page);
await navigateToDashboard(page);
```

#### `waitForSocketEvent(page, eventName, timeout?)`
Waits for a specific Socket.io event.
```typescript
const data = await waitForSocketEvent(overlayPage, 'wheel-spin', 10000);
```

#### `getCanvasSnapshot(page, selector?)`
Captures canvas state as base64 string.
```typescript
const snapshot = await getCanvasSnapshot(overlayPage, 'canvas');
```

#### `waitForCanvasChange(page, selector?, timeout?)`
Waits for canvas to animate (pixels change).
```typescript
await waitForCanvasChange(overlayPage, 'canvas', 5000);
```

---

## Tips for Claude Code Users

### When Asking Claude Code to Write Tests

1. **Be specific about what to test:**
   ```
   "Write a test that creates a countdown timer in the dashboard
   and verifies it appears in the overlay"
   ```

2. **Reference this guide:**
   ```
   "Following the patterns in tests/GUIDE.md, write a test for..."
   ```

3. **Point to existing tests:**
   ```
   "Write a test similar to wheel-spinner.spec.ts but for alerts"
   ```

### When Tests Fail

1. **Share the error:**
   ```
   "This test is failing with error: [paste error]
   Here's the screenshot: [describe what you see]"
   ```

2. **Ask for specific fixes:**
   ```
   "The test times out at step 5. Can you add better waits?"
   ```

3. **Request debugging steps:**
   ```
   "How can I debug this test to see what's happening?"
   ```

---

## Quick Reference Commands

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test wheel-spinner

# Run with visible browser
npm run test:headed

# Interactive mode
npm run test:ui

# Debug mode (pause at breakpoints)
npm run test:debug

# View HTML report
npm run test:report

# Run single test by name
npx playwright test -g "should create wheel"
```

---

## Next Steps

To continue E2E test development:

1. **Read existing tests** to understand patterns
2. **Copy and modify** a similar test for your feature
3. **Run tests frequently** during development
4. **Check videos/screenshots** when tests fail
5. **Use this guide** as a reference

Remember: The goal is to verify **dashboard changes appear in overlay via Socket.io**. Every test should follow this pattern!

---

## Examples to Study

- **Simple sync test**: `color-scheme-sync.spec.ts` (easiest to understand)
- **Complex interaction**: `wheel-spinner.spec.ts` (create, activate, spin)
- **Multi-step workflow**: First wheel test (most comprehensive)

Start with the simple test, understand how it works, then tackle more complex scenarios.

Good luck! 🚀
