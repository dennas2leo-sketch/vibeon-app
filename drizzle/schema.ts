import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, mediumtext } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// VibeOn Users Table
export const vibeUsers = mysqlTable("vibe_users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }).notNull(),
  profilePhoto: mediumtext("profilePhoto"),
  bio: text("bio"),
  isEmailVerified: int("isEmailVerified").default(0).notNull(),
  verificationCode: varchar("verificationCode", { length: 6 }),
  verificationCodeExpiry: timestamp("verificationCodeExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VibeUser = typeof vibeUsers.$inferSelect;
export type InsertVibeUser = typeof vibeUsers.$inferInsert;

// VibeOn Posts Table
export const vibePosts = mysqlTable("vibe_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caption: text("caption"),
  imageUrl: mediumtext("imageUrl").notNull(),
  likesCount: int("likesCount").default(0).notNull(),
  commentsCount: int("commentsCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VibePost = typeof vibePosts.$inferSelect;
export type InsertVibePost = typeof vibePosts.$inferInsert;

// VibeOn Likes Table
export const vibeLikes = mysqlTable("vibe_likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VibeLike = typeof vibeLikes.$inferSelect;
export type InsertVibeLike = typeof vibeLikes.$inferInsert;

// VibeOn Comments Table
export const vibeComments = mysqlTable("vibe_comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VibeComment = typeof vibeComments.$inferSelect;
export type InsertVibeComment = typeof vibeComments.$inferInsert;

// VibeOn Followers Table
export const vibeFollowers = mysqlTable("vibe_followers", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VibeFollower = typeof vibeFollowers.$inferSelect;
export type InsertVibeFollower = typeof vibeFollowers.$inferInsert;

// VibeOn Messages Table
export const vibeMessages = mysqlTable("vibe_messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  text: text("text").notNull(),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VibeMessage = typeof vibeMessages.$inferSelect;
export type InsertVibeMessage = typeof vibeMessages.$inferInsert;

// VibeOn Notifications Table
export const vibeNotifications = mysqlTable("vibe_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  relatedUserId: int("relatedUserId"),
  relatedPostId: int("relatedPostId"),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VibeNotification = typeof vibeNotifications.$inferSelect;
export type InsertVibeNotification = typeof vibeNotifications.$inferInsert;

// VibeOn Stories Table
export const vibeStories = mysqlTable("vibe_stories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: varchar("mediaType", { length: 10 }).notNull(), // 'image' or 'video'
  expiresAt: timestamp("expiresAt").notNull(), // Stories expire after 24 hours
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VibeStory = typeof vibeStories.$inferSelect;
export type InsertVibeStory = typeof vibeStories.$inferInsert;

// VibeOn Sessions Table (for token-based auth)
export const vibeSessions = mysqlTable("vibe_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VibeSession = typeof vibeSessions.$inferSelect;
export type InsertVibeSession = typeof vibeSessions.$inferInsert;
