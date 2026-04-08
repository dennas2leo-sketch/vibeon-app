import { describe, it, expect, beforeAll } from "vitest";
import * as db from "../server/vibeon-db";
import bcrypt from "bcrypt";

describe("Follow System with Notifications", () => {
  let user1Id: number;
  let user2Id: number;
  const testEmail1 = "follow-test-1-" + Math.random().toString(36).substring(7) + "@example.com";
  const testEmail2 = "follow-test-2-" + Math.random().toString(36).substring(7) + "@example.com";
  const testPassword = "TestPassword123";
  const testUsername1 = "followtest1" + Math.random().toString(36).substring(7);
  const testUsername2 = "followtest2" + Math.random().toString(36).substring(7);

  beforeAll(async () => {
    // Create user 1
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    user1Id = await db.createVibeUser({
      email: testEmail1,
      username: testUsername1,
      password: hashedPassword,
      fullName: "Follow Test User 1",
      dateOfBirth: "1990-01-01",
    });
    
    await db.verifyEmail(testEmail1);

    // Create user 2
    user2Id = await db.createVibeUser({
      email: testEmail2,
      username: testUsername2,
      password: hashedPassword,
      fullName: "Follow Test User 2",
      dateOfBirth: "1991-01-01",
    });
    
    await db.verifyEmail(testEmail2);
  });

  describe("Follow Persistence", () => {
    it("should follow user and persist in database", async () => {
      const followId = await db.followUser(user1Id, user2Id);
      expect(followId).toBeGreaterThan(0);

      // Verify follow is persisted
      const followers = await db.getUserFollowers(user2Id);
      expect(followers.length).toBeGreaterThan(0);
      expect((followers[0] as any).followerId).toBe(user1Id);
      expect((followers[0] as any).followingId).toBe(user2Id);
    });

    it("should get following list correctly", async () => {
      const following = await db.getUserFollowing(user1Id);
      expect(following.length).toBeGreaterThan(0);
      expect((following[0] as any).followerId).toBe(user1Id);
      expect((following[0] as any).followingId).toBe(user2Id);
    });

    it("should not allow duplicate follows", async () => {
      // Try to follow again
      const followId = await db.followUser(user1Id, user2Id);
      expect(followId).toBeGreaterThan(0);

      // Should still have only 1 follower
      const followers = await db.getUserFollowers(user2Id);
      const followCount = followers.filter((f: any) => f.followerId === user1Id).length;
      expect(followCount).toBe(1);
    });

    it("should unfollow and remove from database", async () => {
      await db.unfollowUser(user1Id, user2Id);

      const followers = await db.getUserFollowers(user2Id);
      const isFollowing = followers.some((f: any) => f.followerId === user1Id);
      expect(isFollowing).toBe(false);

      const following = await db.getUserFollowing(user1Id);
      const isFollowingUser2 = following.some((f: any) => f.followingId === user2Id);
      expect(isFollowingUser2).toBe(false);
    });
  });

  describe("Follow Notifications", () => {
    it("should create notification when following", async () => {
      // Follow user
      await db.followUser(user1Id, user2Id);

      // Create notification
      const notificationId = await db.createNotification({
        userId: user2Id,
        type: "follow",
        relatedUserId: user1Id,
      });

      expect(notificationId).toBeGreaterThan(0);

      // Verify notification exists
      const notifications = await db.getUserNotifications(user2Id);
      const followNotification = notifications.find((n: any) => 
        n.type === "follow" && n.relatedUserId === user1Id
      );
      expect(followNotification).toBeDefined();
      expect(followNotification?.isRead).toBe(0);
    });

    it("should mark notification as read", async () => {
      const notifications = await db.getUserNotifications(user2Id);
      const notification = notifications[0];

      await db.markNotificationAsRead(notification.id);

      const updatedNotifications = await db.getUserNotifications(user2Id);
      const updatedNotification = updatedNotifications.find((n: any) => n.id === notification.id);
      expect(updatedNotification?.isRead).toBe(1);
    });
  });

  describe("Feed with Followers", () => {
    it("should show posts from followed users in feed", async () => {
      // User1 follows User2
      await db.followUser(user1Id, user2Id);

      // User2 creates a post
      const postId = await db.createPost({
        userId: user2Id,
        imageUrl: "data:image/jpeg;base64,test",
        caption: "Test post from followed user",
      });

      expect(postId).toBeGreaterThan(0);

      // User1 should see User2's post in feed
      const feedPosts = await db.getFeedPosts(user1Id);
      const userPost = feedPosts.find((p: any) => p.id === postId);
      expect(userPost).toBeDefined();
    });

    it("should not show posts from unfollowed users", async () => {
      // Create a new user
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      const user3Id = await db.createVibeUser({
        email: "follow-test-3-" + Math.random().toString(36).substring(7) + "@example.com",
        username: "followtest3" + Math.random().toString(36).substring(7),
        password: hashedPassword,
        fullName: "Follow Test User 3",
        dateOfBirth: "1992-01-01",
      });

      // User3 creates a post
      const postId = await db.createPost({
        userId: user3Id,
        imageUrl: "data:image/jpeg;base64,test",
        caption: "Test post from unfollowed user",
      });

      // User1 should NOT see User3's post (not following)
      const feedPosts = await db.getFeedPosts(user1Id);
      const user3Post = feedPosts.find((p: any) => p.id === postId);
      expect(user3Post).toBeUndefined();
    });
  });
});
