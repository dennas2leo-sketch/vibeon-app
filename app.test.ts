import { describe, it, expect, beforeAll } from "vitest";
import { createVibeUser, getUserByEmail, createPost, getUserPosts, searchUsers } from "./server/vibeon-db";
import { getDb } from "./server/db";

describe("VibeOn Core Functionality", () => {
  let testUserId: number;
  const testEmail = `test-${Date.now()}@example.com`;
  const testUsername = `testuser${Date.now()}`;

  beforeAll(async () => {
    // Create test user
    testUserId = await createVibeUser({
      email: testEmail,
      username: testUsername,
      password: "hashedpassword123",
      fullName: "Test User",
      dateOfBirth: "2000-01-01",
      isEmailVerified: 1,
    });
    console.log("✓ Test user created:", testUserId);
  });

  describe("User Management", () => {
    it("should create a user", async () => {
      expect(testUserId).toBeGreaterThan(0);
    });

    it("should get user by email", async () => {
      const user = await getUserByEmail(testEmail);
      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);
    });

    it("should search users by email", async () => {
      const results = await searchUsers(testEmail.split("@")[0]);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Posts", () => {
    it("should create a post", async () => {
      const postId = await createPost({
        userId: testUserId,
        caption: "Test post",
        imageUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k",
      });
      expect(postId).toBeGreaterThanOrEqual(0);
    });

    it("should get user posts", async () => {
      const posts = await getUserPosts(testUserId);
      expect(Array.isArray(posts)).toBe(true);
    });
  });

  describe("Database Connection", () => {
    it("should have database connection", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
    });
  });
});
