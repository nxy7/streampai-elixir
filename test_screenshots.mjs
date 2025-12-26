import { chromium } from 'playwright';

const FRONTEND_URL = 'http://localhost:3833';

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log('Taking screenshot of landing page...');
  await page.goto(FRONTEND_URL);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshot_landing.png', fullPage: true });
  console.log('Saved screenshot_landing.png');

  // Try to navigate to settings or dashboard
  console.log('Checking for login/signup...');
  const loginButton = page.locator('text=Login, text="Sign in", button:has-text("Login")').first();

  if (await loginButton.isVisible().catch(() => false)) {
    console.log('Found login button');
    await page.screenshot({ path: 'screenshot_login_available.png', fullPage: true });
  }

  // Take a screenshot of whatever main page content is visible
  await page.screenshot({ path: 'screenshot_main.png', fullPage: true });
  console.log('Saved screenshot_main.png');

  // Keep browser open for user verification
  console.log('\nScreenshots complete. Press Ctrl+C to close browser.');
  console.log('Frontend URL:', FRONTEND_URL);
  console.log('Backend URL: http://localhost:4478');

  // Wait forever so user can verify
  await new Promise(() => {});
}

takeScreenshots().catch(console.error);
