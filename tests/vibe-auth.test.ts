import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "../server/vibeon-db";
import bcrypt from "bcrypt";

describe("VibeOn Authentication with Tokens", () => {
  let testUserId: number;
  const testEmail = "test-token-" + Math.random().toString(36).substring(7) + "@example.com";
  const testPassword = "TestPassword123";
  const testUsername = "testtoken" + Math.random().toString(36).substring(7);
  const testFullName = "Test Token User";

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    testUserId = await db.createVibeUser({
      email: testEmail,
      username: testUsername,
      password: hashedPassword,
      fullName: testFullName,
      dateOfBirth: "1990-01-01",
    });
    
    // Verify email
    await db.verifyEmail(testEmail);
  });

  afterAll(async () => {
    // Cleanup - delete test user and sessions
    if (testUserId) {
      // Sessions would be deleted by foreign key cascade
    }
  });

  it("should create a session token", async () => {
    const token = "test-token-" + Math.random().toString(36).substring(7);
    const sessionId = await db.createSession(testUserId, token, 24);
    
    expect(sessionId).toBeGreaterThan(0);
  });

  it("should retrieve user by session token", async () => {
    const token = "test-token-" + Math.random().toString(36).substring(7);
    await db.createSession(testUserId, token, 24);
    
    const user = await db.getUserBySessionToken(token);
    
    expect(user).toBeDefined();
    expect(user?.id).toBe(testUserId);
    expect(user?.email).toBe(testEmail);
  });

  it("should return null for invalid token", async () => {
    const user = await db.getUserBySessionToken("invalid-token");
    
    expect(user).toBeNull();
  });

  it("should delete session token", async () => {
    const token = "test-token-" + Math.random().toString(36).substring(7);
    await db.createSession(testUserId, token, 24);
    
    await db.deleteSession(token);
    
    const user = await db.getUserBySessionToken(token);
    expect(user).toBeNull();
  });

  it("should not return expired session", async () => {
    const token = "test-token-" + Math.random().toString(36).substring(7);
    // Create session that expires immediately
    await db.createSession(testUserId, token, -1);
    
    const user = await db.getUserBySessionToken(token);
    expect(user).toBeNull();
  });
});
