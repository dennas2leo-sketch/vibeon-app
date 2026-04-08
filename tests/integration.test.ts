import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "../server/vibeon-db";
import bcrypt from "bcrypt";

describe("VibeOn Integration Tests - Complete Flow", () => {
  let testUserId: number;
  let testUser2Id: number;
  let testToken: string;
  const testEmail = "integration-" + Math.random().toString(36).substring(7) + "@example.com";
  const testEmail2 = "integration2-" + Math.random().toString(36).substring(7) + "@example.com";
  const testPassword = "TestPassword123";
  const testUsername = "integrationtest" + Math.random().toString(36).substring(7);
  const testUsername2 = "integrationtest2" + Math.random().toString(36).substring(7);

  beforeAll(async () => {
    // Create test user 1
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    testUserId = await db.createVibeUser({
      email: testEmail,
      username: testUsername,
      password: hashedPassword,
      fullName: "Integration Test User",
      dateOfBirth: "1990-01-01",
    });
    
    // Verify email
    await db.verifyEmail(testEmail);

    // Create test user 2
    testUser2Id = await db.createVibeUser({
      email: testEmail2,
      username: testUsername2,
      password: hashedPassword,
      fullName: "Integration Test User 2",
      dateOfBirth: "1991-01-01",
    });
    
    await db.verifyEmail(testEmail2);

    // Create session token
    testToken = "test-token-" + Math.random().toString(36).substring(7);
    await db.createSession(testUserId, testToken, 24);
  });

  describe("1. User Authentication", () => {
    it("should create user with verified email", async () => {
      const user = await db.getUserByEmail(testEmail);
      expect(user).toBeDefined();
      expect(user?.isEmailVerified).toBe(1);
      expect(user?.email).toBe(testEmail);
    });

    it("should retrieve user by session token", async () => {
      const user = await db.getUserBySessionToken(testToken);
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
    });
  });

  describe("2. Profile Management", () => {
    it("should update user profile (bio and fullName)", async () => {
      const newBio = "Updated bio from test";
      const newFullName = "Updated Full Name";
      
      await db.updateUserProfile(testUserId, {
        bio: newBio,
        fullName: newFullName,
      });

      const user = await db.getUserById(testUserId);
      expect(user?.bio).toBe(newBio);
      expect(user?.fullName).toBe(newFullName);
    });

    it("should update profile photo", async () => {
      const photoUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRg...";
      
      await db.updateUserProfile(testUserId, {
        profilePhoto: photoUrl,
      });

      const user = await db.getUserById(testUserId);
      expect(user?.profilePhoto).toBe(photoUrl);
    });
  });

  describe("3. Posts Creation", () => {
    it("should create a post with image", async () => {
      const imageUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRg...";
      const caption = "Test post with image";
      
      const postId = await db.createPost({
        userId: testUserId,
        imageUrl: imageUrl,
        caption: caption,
      });

      expect(postId).toBeGreaterThan(0);
    });

    it("should retrieve user posts", async () => {
      const posts = await db.getUserPosts(testUserId);
      expect(posts.length).toBeGreaterThan(0);
      expect(posts[0].userId).toBe(testUserId);
    });

    it("should like a post", async () => {
      const posts = await db.getUserPosts(testUserId);
      const postId = posts[0].id;

      const likeId = await db.likePost({
        userId: testUser2Id,
        postId: postId,
      });

      expect(likeId).toBeGreaterThan(0);
    });
  });

  describe("4. Stories", () => {
    it("should create a story", async () => {
      const mediaUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRg...";
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const storyId = await db.createStory({
        userId: testUserId,
        mediaUrl: mediaUrl,
        mediaType: "image",
        expiresAt: expiresAt,
      });

      expect(storyId).toBeGreaterThan(0);
    });

    it("should retrieve user stories (not expired)", async () => {
      const stories = await db.getUserStories(testUserId);
      expect(stories.length).toBeGreaterThan(0);
      expect(stories[0].userId).toBe(testUserId);
    });
  });

  describe("5. Follow System", () => {
    it("should follow a user", async () => {
      const followId = await db.followUser(testUser2Id, testUserId);

      expect(followId).toBeGreaterThan(0);
    });

    it("should get followers", async () => {
      const followers = await db.getUserFollowers(testUserId);
      expect(followers.length).toBeGreaterThan(0);
      expect((followers[0] as any).followerId).toBe(testUser2Id);
    });

    it("should unfollow a user", async () => {
      await db.unfollowUser(testUser2Id, testUserId);
      
      const followers = await db.getUserFollowers(testUserId);
      const isFollowing = followers.some((f: any) => f.followerId === testUser2Id);
      expect(isFollowing).toBe(false);
    });
  });

  describe("6. Search", () => {
    it("should search users by username", async () => {
      const results = await db.searchUsers(testUsername);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].username).toBe(testUsername);
    });

    it("should search users by fullName", async () => {
      const results = await db.searchUsers("Integration Test User");
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("7. Messaging", () => {
    it("should send a message", async () => {
      const messageId = await db.sendMessage({
        senderId: testUserId,
        recipientId: testUser2Id,
        text: "Test message",
      });

      expect(messageId).toBeGreaterThan(0);
    });

    it("should get conversation between users", async () => {
      const messages = await db.getConversation(testUserId, testUser2Id);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].senderId).toBe(testUserId);
    });
  });

  describe("8. Notifications", () => {
    it("should create a notification", async () => {
      const notificationId = await db.createNotification({
        userId: testUser2Id,
        type: "follow",
        relatedUserId: testUserId,
      });

      expect(notificationId).toBeGreaterThan(0);
    });

    it("should get user notifications", async () => {
      const notifications = await db.getUserNotifications(testUser2Id);
      expect(notifications.length).toBeGreaterThan(0);
    });
  });
});
