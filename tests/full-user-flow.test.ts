import { describe, it, expect, beforeAll } from "vitest";
import * as db from "../server/vibeon-db";

describe("Full User Flow - Complete Simulation", () => {
  let userId: number;
  let userId2: number;
  let email: string;
  let sessionToken: string;

  beforeAll(async () => {
    // Clean up any existing test data
    email = `test-${Date.now()}@example.com`;
  });

  it("Step 1: Create Account", async () => {
    const result = await db.createVibeUser({
      email,
      username: `user_${Date.now()}`,
      fullName: "Test User",
      password: "hashed_password_123",
      dateOfBirth: "1990-01-01",
    });

    expect(result).toBeGreaterThan(0);
    userId = result;
  });

  it("Step 2: Create Session (Login)", async () => {
    const result = await db.createSession(userId, "test-token-123");
    expect(result).toBeGreaterThan(0);
    sessionToken = "test-token-123";
  });

  it("Step 3: Get User by Token", async () => {
    const user = await db.getUserBySessionToken(sessionToken);
    expect(user).toBeDefined();
    expect(user?.email).toBe(email);
    expect(user?.id).toBe(userId);
  });

  it("Step 4: Update Profile (Bio)", async () => {
    const result = await db.updateUserProfile(userId, {
      bio: "This is my bio",
    });

    expect(result).toBe(true);

    // Verify update
    const user = await db.getUserById(userId);
    expect(user?.bio).toBe("This is my bio");
  });

  it("Step 5: Update Profile (Full Name)", async () => {
    const result = await db.updateUserProfile(userId, {
      fullName: "Updated Name",
    });

    expect(result).toBe(true);

    // Verify update
    const user = await db.getUserById(userId);
    expect(user?.fullName).toBe("Updated Name");
  });

  it("Step 6: Update Profile (Profile Photo)", async () => {
    const base64Image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k";

    const result = await db.updateUserProfile(userId, {
      profilePhoto: base64Image,
    });

    expect(result).toBe(true);

    // Verify update
    const user = await db.getUserById(userId);
    expect(user?.profilePhoto).toBe(base64Image);
  });

  it("Step 7: Create Post", async () => {
    const postId = await db.createPost({
      userId,
      imageUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k",
      caption: "My first post!",
    });

    expect(postId).toBeGreaterThan(0);
  });

  it("Step 8: Get User Posts", async () => {
    const posts = await db.getUserPosts(userId);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].caption).toBe("My first post!");
  });

  it("Step 9: Create Another Post", async () => {
    const postId = await db.createPost({
      userId,
      imageUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k",
      caption: "My second post!",
    });

    expect(postId).toBeGreaterThan(0);
  });

  it("Step 10: Verify Multiple Posts", async () => {
    const posts = await db.getUserPosts(userId);
    expect(posts.length).toBeGreaterThanOrEqual(2);
  });

  it("Step 11: Create Another User for Following", async () => {
    const result = await db.createVibeUser({
      email: `test2-${Date.now()}@example.com`,
      username: `user2_${Date.now()}`,
      fullName: "Test User 2",
      password: "hashed_password_456",
      dateOfBirth: "1990-01-01",
    });

    expect(result).toBeGreaterThan(0);
    userId2 = result;
  });

  it("Step 12: Follow Another User", async () => {
    const followId = await db.followUser(userId, userId2);
    expect(followId).toBeGreaterThan(0);
  });

  it("Step 13: Like a Post", async () => {
    const posts = await db.getUserPosts(userId);
    expect(posts.length).toBeGreaterThan(0);

    const postId = posts[0].id;
    const likeId = await db.likePost({
      userId,
      postId,
    });
    expect(likeId).toBeGreaterThan(0);
  });

  it("Step 14: Search for Users", async () => {
    const results = await db.searchUsers(`user_${Date.now()}`);
    expect(Array.isArray(results)).toBe(true);
  });

  it("Step 15: Get User Profile", async () => {
    const user = await db.getUserById(userId);
    expect(user).toBeDefined();
    expect(user?.email).toBe(email);
    expect(user?.bio).toBe("This is my bio");
    expect(user?.fullName).toBe("Updated Name");
  });

  it("Step 16: Delete Session (Logout)", async () => {
    const result = await db.deleteSession(sessionToken);
    expect(result).toBe(true);

    // Verify session is deleted
    const user = await db.getUserBySessionToken(sessionToken);
    expect(user).toBeNull();
  });
});
