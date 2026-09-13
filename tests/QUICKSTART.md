# E2E Testing Quick Start

## 🏃 Run Tests

```bash
npm test              # Run all tests
npm run test:headed   # See browser
npm run test:ui       # Interactive mode
npm run test:debug    # Debug with breakpoints
```

## 📖 Read Tests

Every test follows this pattern:

```typescript
test('description', async ({ page, context }) => {
  // 1. Open dashboard
  await navigateToDashboard(page);

  // 2. Open overlay in new window
  const overlayPage = await context.newPage();
  await navigateToOverlay(overlayPage, 'wheel');

  // 3. Make change in dashboard
  await page.click('button:has-text("Activate")');

  // 4. Verify overlay received change
  await overlayPage.waitForTimeout(1500); // Socket sync time
  await expect(overlayPage.locator('canvas')).toBeVisible();

  // 5. Cleanup
  await overlayPage.close();
});
```

**Key points:**

- `page` = dashboard
- `overlayPage` = overlay
- Changes sync via Socket.io (wait 1500ms)
- Always close overlay at end

## ✍️ Write New Test

1. Copy existing test file as template
2. Change feature name and selectors
3. Follow pattern: dashboard change → verify overlay
4. Run test: `npx playwright test my-test`

## 🐛 Debug Failing Test

1. Check screenshot: `test-results/[name]/test-failed-1.png`
2. Watch video: `test-results/[name]/video.webm`
3. Run headed: `npm run test:headed`
4. Add more waits if timing out
5. Make selectors more specific if "not found"

## 📚 Full Documentation

**[Complete Testing Guide →](./GUIDE.md)**

Covers:

- Detailed test structure explanation
- All helper functions
- Common patterns
- Debugging techniques
- Writing new tests
- Tips for Claude Code users

## 🎯 Test Goals

Every test verifies:
✅ Dashboard change → Overlay updates (Socket.io)
✅ Multi-window communication works
✅ Features don't break over time

## 📁 File Structure

```
tests/
├── QUICKSTART.md           ← You are here
├── GUIDE.md                ← Full documentation
├── README.md               ← Test overview
├── e2e/realtime/           ← Test files
├── fixtures/               ← Setup helpers
└── utils/                  ← Test utilities
```

## 💡 Pro Tips

- **Read tests from top to bottom** - they're sequential
- **Check existing tests first** - copy patterns that work
- **Use descriptive test names** - helps debug failures
- **Wait for socket sync** - always `waitForTimeout(1500)` after dashboard changes
- **Close overlay windows** - prevents memory leaks

---

**Ready to dive deeper?** → [Read the Complete Guide](./GUIDE.md)
