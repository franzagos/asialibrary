import { test, expect } from "@playwright/test";

/**
 * Auth flow E2E tests.
 *
 * These are the starter tests for the boilerplate.
 * Add your own feature tests in this directory as you build.
 *
 * Pattern:
 *   - Group related tests with test.describe()
 *   - Use page.goto() with relative paths (baseURL is set in playwright.config.ts)
 *   - Use getByRole / getByLabel / getByPlaceholder over CSS selectors — more resilient
 */

test.describe("Pages load correctly", () => {
  test("login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("login links to register", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL("/register");
  });

  test("register links to login", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/login");
  });
});

test.describe("Auth guards", () => {
  test("unauthenticated user cannot access /dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    // requireAuth() redirects to "/" when there's no session
    await expect(page).toHaveURL("/");
  });

  test("unauthenticated user cannot access /profile", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL("/");
  });
});

test.describe("Registration flow", () => {
  test("register with valid credentials and land on dashboard", async ({ page }) => {
    await page.goto("/register");

    // Use a unique email so this test can be run multiple times
    const email = `test-${Date.now()}@example.com`;

    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();

    // After registration, the user is redirected to /dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("register with short password shows validation error", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();

    // HTML5 minLength validation prevents submission — stays on /register
    await expect(page).toHaveURL("/register");
  });
});
