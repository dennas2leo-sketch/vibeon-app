import { describe, it, expect, beforeAll } from "vitest";
import * as db from "../server/vibeon-db";

describe("Authentication Token Flow", () => {
  let userId: number;
  let sessionToken: string;
  let email: string;

  beforeAll(async () => {
    email = `auth-test-${Date.now()}@example.com`;
  });

  it("Should create user and session token", async () => {
    const result = await db.createVibeUser({
      email,
      username: `authtest_${Date.now()}`,
      fullName: "Auth Test User",
      password: "hashed_password_123",
      dateOfBirth: "1990-01-01",
    });

    expect(result).toBeGreaterThan(0);
    userId = result;

    // Create session
    sessionToken = `token-${Date.now()}-${Math.random()}`;
    const sessionResult = await db.createSession(userId, sessionToken);
    expect(sessionResult).toBeGreaterThan(0);
  });

  it("Should retrieve user by session token", async () => {
    const user = await db.getUserBySessionToken(sessionToken);
    expect(user).toBeDefined();
    expect(user?.id).toBe(userId);
    expect(user?.email).toBe(email);
  });

  it("Should create post with authenticated user", async () => {
    const postId = await db.createPost({
      userId,
      imageUrl: "data:image/jpeg;base64,test",
      caption: "Test post with auth",
    });

    expect(postId).toBeGreaterThan(0);

    // Verify post was created
    const posts = await db.getUserPosts(userId);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.some((p) => p.id === postId)).toBe(true);
  });

  it("Should verify token is valid and not expired", async () => {
    const user = await db.getUserBySessionToken(sessionToken);
    expect(user).toBeDefined();
    expect(user?.id).toBe(userId);
  });

  it("Should return null for invalid token", async () => {
    const user = await db.getUserBySessionToken("invalid-token-xyz");
    expect(user).toBeNull();
  });

  it("Should delete session and invalidate token", async () => {
    const result = await db.deleteSession(sessionToken);
    expect(result).toBe(true);

    // Verify token is now invalid
    const user = await db.getUserBySessionToken(sessionToken);
    expect(user).toBeNull();
  });
});
