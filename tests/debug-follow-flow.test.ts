import { describe, it, expect, beforeAll } from "vitest";
import * as db from "../server/vibeon-db";

describe("Debug Follow Flow", () => {
  let user1Id: number;
  let user2Id: number;

  beforeAll(async () => {
    // Create two test users
    user1Id = await db.createVibeUser({
      fullName: "Debug User 1",
      username: "debuguser1",
      email: "debug1@test.com",
      password: "hashed_password",
      dateOfBirth: "1990-01-01",
    });

    user2Id = await db.createVibeUser({
      fullName: "Debug User 2",
      username: "debuguser2",
      email: "debug2@test.com",
      password: "hashed_password",
      dateOfBirth: "1990-01-01",
    });

    console.log(`[DEBUG] Created user1: ${user1Id}, user2: ${user2Id}`);
  });

  it("should follow user and retrieve in getFollowing", async () => {
    // Step 1: User1 follows User2
    console.log(`[DEBUG] User1 (${user1Id}) following User2 (${user2Id})`);
    await db.followUser(user1Id, user2Id);

    // Step 2: Get User1's following list
    const following = await db.getUserFollowing(user1Id);
    console.log(`[DEBUG] User1 following list:`, following);
    expect(following).toBeDefined();
    expect(following.length).toBeGreaterThan(0);

    // Step 3: Check if User2 is in the list
    const followsUser2 = following.some((f: any) => f.followingId === user2Id);
    console.log(`[DEBUG] User1 follows User2?`, followsUser2);
    expect(followsUser2).toBe(true);

    // Step 4: Get User2 by ID
    const user2 = await db.getUserById(user2Id);
    console.log(`[DEBUG] User2 data:`, user2);
    expect(user2).toBeDefined();
    expect(user2?.username).toBe("debuguser2");
  });

  it("should retrieve followers correctly", async () => {
    // Step 1: Get User2's followers (should include User1)
    const followers = await db.getUserFollowers(user2Id);
    console.log(`[DEBUG] User2 followers list:`, followers);
    expect(followers).toBeDefined();
    expect(followers.length).toBeGreaterThan(0);

    // Step 2: Check if User1 is in the list
    const followedByUser1 = followers.some((f: any) => f.followerId === user1Id);
    console.log(`[DEBUG] User2 followed by User1?`, followedByUser1);
    expect(followedByUser1).toBe(true);
  });

  it("should fetch user by ID correctly", async () => {
    const user = await db.getUserById(user1Id);
    console.log(`[DEBUG] Fetched user:`, user);
    expect(user).toBeDefined();
    expect(user?.id).toBe(user1Id);
    expect(user?.username).toBe("debuguser1");
    expect(user?.fullName).toBe("Debug User 1");
  });

  it("should have all required fields for rendering", async () => {
    const user = await db.getUserById(user2Id);
    console.log(`[DEBUG] User fields:`, {
      id: user?.id,
      username: user?.username,
      fullName: user?.fullName,
      profilePhoto: user?.profilePhoto,
      bio: user?.bio,
    });

    expect(user?.id).toBeDefined();
    expect(user?.username).toBeDefined();
    expect(user?.fullName).toBeDefined();
    // profilePhoto and bio can be null
  });
});
