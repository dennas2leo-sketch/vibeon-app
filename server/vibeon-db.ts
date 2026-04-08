import { eq, or, like, and, gt, lt, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  vibeUsers,
  vibePosts,
  vibeLikes,
  vibeComments,
  vibeFollowers,
  vibeMessages,
  vibeNotifications,
  vibeStories,
  vibeSessions,
  InsertVibeUser,
  InsertVibePost,
  InsertVibeLike,
  InsertVibeComment,
  InsertVibeFollower,
  InsertVibeMessage,
  InsertVibeNotification,
  InsertVibeSession,
  InsertVibeStory,
} from "../drizzle/schema";

/**
 * Create a new VibeOn user
 */
export async function createVibeUser(data: InsertVibeUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vibeUsers).values(data);
  // MySQL returns insertId in the result
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  if (!insertId) {
    // If insertId not available, query the latest user
    const users = await db.select().from(vibeUsers).orderBy(desc(vibeUsers.id)).limit(1);
    return users[0]?.id || 0;
  }
  return insertId;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(vibeUsers)
    .where(eq(vibeUsers.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(vibeUsers)
    .where(eq(vibeUsers.username, username))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(vibeUsers)
    .where(eq(vibeUsers.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Update user verification code
 */
export async function updateVerificationCode(
  email: string,
  code: string,
  expiryTime: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(vibeUsers)
    .set({
      verificationCode: code,
      verificationCodeExpiry: expiryTime,
    })
    .where(eq(vibeUsers.email, email));
}

/**
 * Verify email
 */
export async function verifyEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(vibeUsers)
    .set({
      isEmailVerified: 1,
      verificationCode: null,
      verificationCodeExpiry: null,
    })
    .where(eq(vibeUsers.email, email));
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  data: Partial<InsertVibeUser>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Note: Removed size validation to allow larger images

  await db
    .update(vibeUsers)
    .set(data)
    .where(eq(vibeUsers.id, userId));

  return true;
}

/**
 * Create a new post
 */
export async function createPost(data: InsertVibePost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  console.log("[DB] createPost input:", { userId: data.userId, captionLen: data.caption?.length || 0, imageUrlLen: data.imageUrl?.length || 0 });
  
  try {
    const result = await db.insert(vibePosts).values(data);
    console.log("[DB] createPost result:", result);
    
    // MySQL returns insertId in the result
    const insertId = (result as any)[0]?.insertId || (result as any).insertId;
    if (!insertId) {
      // If insertId not available, query the latest post
      const posts = await db.select().from(vibePosts).orderBy(desc(vibePosts.id)).limit(1);
      return posts[0]?.id || 0;
    }
    return insertId;
  } catch (error: any) {
    console.error("[DB] createPost error:", error.message);
    console.error("[DB] createPost error code:", error.code);
    console.error("[DB] createPost error errno:", error.errno);
    console.error("[DB] createPost error sqlState:", error.sqlState);
    console.error("[DB] createPost error sql:", error.sql);
    throw error;
  }
}

/**
 * Get user posts
 */
export async function getUserPosts(userId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];

  const posts = await db
    .select()
    .from(vibePosts)
    .where(eq(vibePosts.userId, userId))
    .orderBy(desc(vibePosts.createdAt));

  // If viewerId provided, add isLiked for each post
  if (viewerId) {
    return await Promise.all(
      posts.map(async (post: any) => {
        const userLike = await db
          .select()
          .from(vibeLikes)
          .where(and(eq(vibeLikes.userId, viewerId), eq(vibeLikes.postId, post.id)))
          .limit(1);
        
        return {
          ...post,
          isLiked: userLike.length > 0,
        };
      })
    );
  }

  return posts;
}

/**
 * Get feed posts (all posts from followed users)
 */
export async function getFeedPosts(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  // Get all users that the current user follows
  const followingResult = await db
    .select()
    .from(vibeFollowers)
    .where(eq(vibeFollowers.followerId, userId));

  const followingIds = followingResult.map((f: any) => f.followingId);
  followingIds.push(userId); // Include own posts

  if (followingIds.length === 0) {
    return [];
  }

  // Get posts from followed users (excluding test users)
  const { inArray } = require("drizzle-orm");
  const posts = await db
    .select({
      post: vibePosts,
      user: vibeUsers,
    })
    .from(vibePosts)
    .innerJoin(vibeUsers, eq(vibePosts.userId, vibeUsers.id))
    .where(inArray(vibePosts.userId, followingIds))
    .orderBy(desc(vibePosts.createdAt))
    .limit(limit);

  // Batch check likes for all posts (avoid N+1 query)
  const postIds = posts.map((p: any) => p.post.id);
  const userLikes = await db
    .select({ postId: vibeLikes.postId })
    .from(vibeLikes)
    .where(and(eq(vibeLikes.userId, userId), inArray(vibeLikes.postId, postIds)));
  
  const likedPostIds = new Set(userLikes.map((l: any) => l.postId));
  
  return posts.map((p: any) => ({
    ...p.post,
    isLiked: likedPostIds.has(p.post.id),
    user: {
      id: p.user.id,
      username: p.user.username,
      fullName: p.user.fullName,
      profilePhoto: p.user.profilePhoto,
    },
  }));
}

/**
 * Like a post
 */
export async function likePost(data: InsertVibeLike) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already liked
  const existing = await db
    .select()
    .from(vibeLikes)
    .where(and(eq(vibeLikes.userId, data.userId), eq(vibeLikes.postId, data.postId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id; // Already liked, return existing ID
  }

  const result = await db.insert(vibeLikes).values(data);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  
  // Increment post likes count
  try {
    const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(vibeLikes).where(eq(vibeLikes.postId, data.postId));
    const newCount = (countResult[0]?.count as number) || 0;
    await db
      .update(vibePosts)
      .set({ likesCount: newCount })
      .where(eq(vibePosts.id, data.postId));
  } catch (error) {
    console.error("Erro ao atualizar likesCount:", error);
  }
  
  if (!insertId) {
    const likes = await db.select().from(vibeLikes).orderBy(desc(vibeLikes.id)).limit(1);
    return likes[0]?.id || 0;
  }
  return insertId;
}

/**
 * Unlike a post
 */
export async function unlikePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(vibeLikes)
    .where(and(eq(vibeLikes.userId, userId), eq(vibeLikes.postId, postId)));

  // Decrement likes count
  const post = await db
    .select()
    .from(vibePosts)
    .where(eq(vibePosts.id, postId))
    .limit(1);
  
  if (post.length > 0) {
    await db
      .update(vibePosts)
      .set({ likesCount: Math.max(0, post[0].likesCount - 1) })
      .where(eq(vibePosts.id, postId));
  }
}

/**
 * Get post likes
 */
export async function getPostLikes(postId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(vibeLikes)
    .where(eq(vibeLikes.postId, postId));
}

/**
 * Create a comment
 */
export async function createComment(data: InsertVibeComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vibeComments).values(data);

  // Increment comments count
  const post = await db
    .select()
    .from(vibePosts)
    .where(eq(vibePosts.id, data.postId))
    .limit(1);
  
  if (post.length > 0) {
    await db
      .update(vibePosts)
      .set({ commentsCount: post[0].commentsCount + 1 })
      .where(eq(vibePosts.id, data.postId));
  }

  return (result as any).insertId || 0;
}

/**
 * Get post by ID
 */
export async function getPostById(postId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(vibePosts)
    .where(eq(vibePosts.id, postId))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Get post comments
 */
export async function getPostComments(postId: number) {
  const db = await getDb();
  if (!db) return [];

  const comments = await db
    .select({
      comment: vibeComments,
      user: vibeUsers,
    })
    .from(vibeComments)
    .innerJoin(vibeUsers, eq(vibeComments.userId, vibeUsers.id))
    .where(eq(vibeComments.postId, postId))
    .orderBy(vibeComments.createdAt);

  return comments.map((c: any) => ({
    ...c.comment,
    user: {
      id: c.user.id,
      username: c.user.username,
      fullName: c.user.fullName,
      profilePhoto: c.user.profilePhoto,
    },
  }));
}

/**
 * Follow a user
 */
export async function followUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already following
  const existing = await db
    .select()
    .from(vibeFollowers)
    .where(
      and(
        eq(vibeFollowers.followerId, followerId),
        eq(vibeFollowers.followingId, followingId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id; // Already following, return existing ID
  }

  const result = await db
    .insert(vibeFollowers)
    .values({ followerId, followingId });
  
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  if (!insertId) {
    const followers = await db.select().from(vibeFollowers).orderBy(desc(vibeFollowers.id)).limit(1);
    return followers[0]?.id || 0;
  }
  return insertId;
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(vibeFollowers)
    .where(
      and(
        eq(vibeFollowers.followerId, followerId),
        eq(vibeFollowers.followingId, followingId)
      )
    );
}

/**
 * Get user followers with user data
 */
export async function getUserFollowers(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const followers = await db
    .select()
    .from(vibeFollowers)
    .where(eq(vibeFollowers.followingId, userId));

  // Fetch user data for each follower
  return Promise.all(
    followers.map(async (f) => {
      const user = await db.select().from(vibeUsers).where(eq(vibeUsers.id, f.followerId)).limit(1);
      return {
        ...f,
        user: user[0] || null,
      };
    })
  );
}

/**
 * Get user following with user data
 */
export async function getUserFollowing(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const following = await db
    .select()
    .from(vibeFollowers)
    .where(eq(vibeFollowers.followerId, userId));

  // Fetch user data for each following
  return Promise.all(
    following.map(async (f) => {
      const user = await db.select().from(vibeUsers).where(eq(vibeUsers.id, f.followingId)).limit(1);
      return {
        ...f,
        user: user[0] || null,
      };
    })
  );
}

/**
 * Send a message
 */
export async function sendMessage(data: InsertVibeMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vibeMessages).values(data);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  if (!insertId) {
    const messages = await db.select().from(vibeMessages).orderBy(desc(vibeMessages.id)).limit(1);
    return messages[0]?.id || 0;
  }
  return insertId;
}

/**
 * Get all conversations for a user
 */
export async function getConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all messages sent or received by the user
  const messages = await db
    .select()
    .from(vibeMessages)
    .where(
      or(
        eq(vibeMessages.senderId, userId),
        eq(vibeMessages.recipientId, userId)
      )
    )
    .orderBy(desc(vibeMessages.createdAt));

  // Group by conversation partner and get last message
  const conversationMap = new Map<number, any>();
  
  for (const msg of messages) {
    const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
    
    if (!conversationMap.has(partnerId)) {
      // Fetch partner user data
      const partner = await db
        .select()
        .from(vibeUsers)
        .where(eq(vibeUsers.id, partnerId))
        .limit(1);
      
      if (partner[0]) {
        conversationMap.set(partnerId, {
          id: partnerId,
          userId: partnerId,
          username: partner[0].username,
          fullName: partner[0].fullName,
          profilePhoto: partner[0].profilePhoto,
          lastMessage: msg.text,
          timestamp: new Date(msg.createdAt).toLocaleDateString("pt-BR"),
          unread: msg.recipientId === userId && msg.isRead === 0,
        });
      }
    }
  }

  return Array.from(conversationMap.values());
}

/**
 * Get conversation between two users (bidirectional)
 */
export async function getConversation(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(vibeMessages)
    .where(
      or(
        and(
          eq(vibeMessages.senderId, userId1),
          eq(vibeMessages.recipientId, userId2)
        ),
        and(
          eq(vibeMessages.senderId, userId2),
          eq(vibeMessages.recipientId, userId1)
        )
      )
    )
    .orderBy(vibeMessages.createdAt);
}

/**
 * Create a notification
 */
export async function createNotification(data: InsertVibeNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vibeNotifications).values(data);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  if (!insertId) {
    const notifications = await db.select().from(vibeNotifications).orderBy(desc(vibeNotifications.id)).limit(1);
    return notifications[0]?.id || 0;
  }
  return insertId;
}

/**
 * Get user notifications with user data
 */
export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const notifications = await db
    .select()
    .from(vibeNotifications)
    .where(eq(vibeNotifications.userId, userId))
    .orderBy(desc(vibeNotifications.createdAt));

  // Fetch user data for each notification
  return Promise.all(
    notifications.map(async (notif) => {
      if (notif.relatedUserId) {
        const user = await db
          .select()
          .from(vibeUsers)
          .where(eq(vibeUsers.id, notif.relatedUserId))
          .limit(1);
        return {
          ...notif,
          user: user[0] || null,
        };
      }
      return notif;
    })
  );
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(vibeNotifications)
    .set({ isRead: 1 })
    .where(eq(vibeNotifications.id, notificationId));
}


/**
 * Search users by username or fullName
 */
export async function searchUsers(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(vibeUsers)
    .where(
      or(
        like(vibeUsers.username, `%${query}%`),
        like(vibeUsers.fullName, `%${query}%`)
      )
    )
    .limit(20);
}

/**
 * Create a story
 */
export async function createStory(data: InsertVibeStory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vibeStories).values(data);
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  if (!insertId) {
    const stories = await db.select().from(vibeStories).orderBy(desc(vibeStories.id)).limit(1);
    return stories[0]?.id || 0;
  }
  return insertId;
}

/**
 * Get user stories (not expired)
 */
export async function getUserStories(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(vibeStories)
    .where(
      and(
        eq(vibeStories.userId, userId),
        gt(vibeStories.expiresAt, new Date())
      )
    )
    .orderBy(desc(vibeStories.createdAt));
}

/**
 * Delete expired stories
 */
export async function deleteExpiredStories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(vibeStories)
    .where(lt(vibeStories.expiresAt, new Date()));
}


/**
 * Create a session token for a VibeOn user
 */
export async function createSession(userId: number, token: string, expiresInHours: number = 24) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const result = await db.insert(vibeSessions).values({
    userId,
    token,
    expiresAt,
  });
  // MySQL returns insertId in the result
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  if (!insertId) {
    // If insertId not available, query the latest session
    const sessions = await db.select().from(vibeSessions).orderBy(desc(vibeSessions.id)).limit(1);
    return sessions[0]?.id || 0;
  }
  return insertId;
}

/**
 * Get user by session token
 */
export async function getUserBySessionToken(token: string) {
  const db = await getDb();
  if (!db) return null;

  const session = await db
    .select()
    .from(vibeSessions)
    .where(
      and(
        eq(vibeSessions.token, token),
        gt(vibeSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session || session.length === 0) {
    return null;
  }

  const user = await db
    .select()
    .from(vibeUsers)
    .where(eq(vibeUsers.id, session[0].userId))
    .limit(1);

  return user && user.length > 0 ? user[0] : null;
}

/**
 * Delete session token
 */
export async function deleteSession(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(vibeSessions)
    .where(eq(vibeSessions.token, token));

  return true;
}

/**
 * Delete expired sessions
 */
export async function deleteExpiredSessions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(vibeSessions)
    .where(lt(vibeSessions.expiresAt, new Date()));
}

/**
 * Delete a post by ID (only the post owner can delete)
 */
export async function deletePost(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  console.log("[deletePost] Attempting to delete post:", postId, "by user:", userId);

  // Verify post exists and belongs to the user
  const post = await db
    .select()
    .from(vibePosts)
    .where(eq(vibePosts.id, postId))
    .limit(1);

  console.log("[deletePost] Post found:", post.length > 0 ? post[0] : "not found");

  if (!post || post.length === 0) {
    throw new Error("Post não encontrado");
  }

  console.log("[deletePost] Post userId:", post[0].userId, "Current userId:", userId);

  if (post[0].userId !== userId) {
    throw new Error("Você não tem permissão para excluir este post");
  }

  // Delete associated likes
  await db.delete(vibeLikes).where(eq(vibeLikes.postId, postId));

  // Delete associated comments
  await db.delete(vibeComments).where(eq(vibeComments.postId, postId));

  // Delete associated notifications
  await db.delete(vibeNotifications).where(eq(vibeNotifications.relatedPostId, postId));

  // Delete the post
  await db.delete(vibePosts).where(eq(vibePosts.id, postId));

  return { success: true, message: "Post excluído com sucesso" };
}
