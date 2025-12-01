# E2E Tests

End-to-end tests using Playwright to verify real-time dashboard-to-overlay synchronization.

📖 **[Read the Complete Testing Guide](./GUIDE.md)** - Learn how to read, write, and debug tests

## Setup

Tests are already configured. Just run:

```bash
npm test
```

## Test Structure

```
tests/
├── e2e/
│   └── realtime/
│       ├── wheel-spinner.spec.ts       # Wheel creation, activation, and spinning
│       └── color-scheme-sync.spec.ts   # Color scheme synchronization
├── fixtures/
│   ├── auth.ts                         # Authentication helpers
│   └── database.ts                     # Database seeding and cleanup
└── utils/
    └── test-helpers.ts                 # Socket and canvas testing utilities
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npx playwright test wheel-spinner
```

### Run in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run with UI mode (interactive)
```bash
npx playwright test --ui
```

### Debug a test
```bash
npx playwright test --debug
```

## Writing New Tests

### Basic Structure

```typescript
import { test, expect } from '@playwright/test';
import { setupTestDatabase, teardownTestDatabase } from '../../fixtures/database';
import { navigateToDashboard, navigateToOverlay } from '../../fixtures/auth';

test.describe('My Feature', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test('should sync changes from dashboard to overlay', async ({ page, context }) => {
    // 1. Navigate to dashboard
    await navigateToDashboard(page);

    // 2. Open overlay in separate window
    const overlayPage = await context.newPage();
    await navigateToOverlay(overlayPage, 'your-overlay-type');

    // 3. Make changes in dashboard
    // ...

    // 4. Verify changes appear in overlay
    // ...

    await overlayPage.close();
  });
});
```

## Key Testing Patterns

### Multi-Window Testing
```typescript
const overlayPage = await context.newPage();
await navigateToOverlay(overlayPage, 'wheel');
// Both page and overlayPage are now active
```

### Socket Event Testing
```typescript
import { waitForSocketEvent } from '../../utils/test-helpers';

const eventData = await waitForSocketEvent(overlayPage, 'wheel-spin');
expect(eventData.winningLabel).toBeDefined();
```

### Canvas Testing
```typescript
import { waitForCanvasChange } from '../../utils/test-helpers';

// Wait for canvas to animate
await waitForCanvasChange(overlayPage, 'canvas', 5000);
```

## Debugging Tips

### View test execution
```bash
npx playwright test --headed --slowMo=1000
```

### Generate test code
```bash
npx playwright codegen http://localhost:3000
```

### View test report
```bash
npx playwright show-report
```

### Check videos/screenshots
After test failures, check `test-results/` directory for:
- Screenshots
- Videos
- Traces

## CI/CD

Tests run automatically in CI with:
- Retries on failure
- Video recording on failure
- Screenshot on failure
- GitHub Actions reporter

## Current Test Coverage

- ✅ Wheel Spinner: Creation, activation, spinning, deactivation
- ✅ Color Scheme: Theme changes, custom colors
- 🔄 TODO: Countdown timers
- 🔄 TODO: Paint by numbers template selection
- 🔄 TODO: Stream alerts
- 🔄 TODO: Now Playing updates

## Notes

- Tests use a dedicated test session ID: `test-session-e2e`
- Test user credentials are mocked (no real OAuth)
- Database is cleaned before and after test runs
- Tests run sequentially (not in parallel) to avoid database conflicts
