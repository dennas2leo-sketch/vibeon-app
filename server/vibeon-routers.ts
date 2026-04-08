import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import * as db from "./vibeon-db";
import * as email from "./email";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";

/**
 * Authentication Schemas
 */
const signUpSchema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  email: z.string().email("E-mail inválido"),
  username: z
    .string()
    .min(3, "Username deve ter pelo menos 3 caracteres")
    .max(50, "Username deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Username pode conter apenas letras, números e underscore"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const verifyEmailSchema = z.object({
  email: z.string().email("E-mail inválido"),
  code: z.string().length(6, "Código deve ter 6 dígitos"),
});

/**
 * VibeOn Authentication Router
 */
export const vibeAuthRouter = router({
  /**
   * Sign up - Create new user account
   */
  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input }) => {
      // Check if email already exists
      const existingEmail = await db.getUserByEmail(input.email);
      if (existingEmail) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este e-mail já está cadastrado" });
      }

      // Check if username already exists
      const existingUsername = await db.getUserByUsername(input.username);
      if (existingUsername) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este username já está em uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Generate verification code
      const verificationCode = email.generateVerificationCode();
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create user
      const userId = await db.createVibeUser({
        email: input.email,
        username: input.username,
        password: hashedPassword,
        fullName: input.fullName,
        dateOfBirth: input.dateOfBirth,
        isEmailVerified: 0,
        verificationCode,
        verificationCodeExpiry: expiryTime,
      });

      // Send verification email
      try {
        await email.sendVerificationEmail(input.email, verificationCode);
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao enviar e-mail de verificação" });
      }

      return {
        success: true,
        message: "Usuário criado com sucesso. Verifique seu e-mail.",
        userId,
      };
    }),

  /**
   * Verify email with 6-digit code
   */
  verifyEmail: publicProcedure
    .input(verifyEmailSchema)
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      if (user.isEmailVerified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "E-mail já foi verificado" });
      }

      // Check verification code
      if (user.verificationCode !== input.code) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Código de verificação inválido" });
      }

      // Check if code has expired
      if (
        user.verificationCodeExpiry &&
        new Date() > user.verificationCodeExpiry
      ) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Código de verificação expirou" });
      }

      // Mark email as verified
      await db.verifyEmail(input.email);

      return {
        success: true,
        message: "E-mail verificado com sucesso!",
      };
    }),

  /**
   * Resend verification code
   */
  resendVerificationCode: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      if (user.isEmailVerified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "E-mail já foi verificado" });
      }

      // Generate new verification code
      const verificationCode = email.generateVerificationCode();
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

      // Update verification code
      await db.updateVerificationCode(input.email, verificationCode, expiryTime);

      // Send verification email
      try {
        await email.sendVerificationEmail(input.email, verificationCode);
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao enviar e-mail de verificação" });
      }

      return {
        success: true,
        message: "Código de verificação reenviado",
      };
    }),

  /**
   * Login - Authenticate user
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos" });
      }

      if (!user.isEmailVerified) {
        throw new TRPCError({ code: "FORBIDDEN", message: "E-mail não verificado" });
      }

      // Compare password
      const passwordMatch = await bcrypt.compare(input.password, user.password);
      if (!passwordMatch) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos" });
      }

      // Generate session token
      const token = randomBytes(32).toString('hex');
      await db.createSession(user.id, token, 24); // 24 hours

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          profilePhoto: user.profilePhoto,
          bio: user.bio,
        },
      };
    }),

  /**
   * Get user by ID
   */
  getUserById: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
      };
    }),

  /**
   * Get user by username
   */
  getUserByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const user = await db.getUserByUsername(input.username);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
      };
    }),

  /**
   * Update user profile (public for onboarding)
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        profilePhoto: z.string().optional(), // No size limit
        bio: z.string().max(150).optional(),
        fullName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Note: No size validation - accepts any image size
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      await db.updateUserProfile(user.id, {
        profilePhoto: input.profilePhoto,
        bio: input.bio,
        fullName: input.fullName,
      });

      // Return updated user
      const updatedUser = await db.getUserByEmail(input.email);
      return {
        success: true,
        message: "Perfil atualizado com sucesso",
        user: updatedUser ? {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          profilePhoto: updatedUser.profilePhoto,
          bio: updatedUser.bio,
        } : null,
      };
    }),

  searchUsers: publicProcedure
    .input(z.object({ q: z.string().min(1) }))
    .query(async ({ input }) => {
      const query = input.q.toLowerCase();
      const users = await db.searchUsers(query);
      return users.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
      }));
    }),
});

/**
 * VibeOn Posts Router
 */
export const vibePostsRouter = router({
  /**
   * Create a new post
   */
  create: protectedProcedure
    .input(
      z.object({
        caption: z.string().optional(),
        imageUrl: z.string(), // No size limit
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate imageUrl size
      // Note: Removed size validation to allow larger images
      console.log("[Posts] Creating post...");
      console.log("[Posts] ctx.vibeUser:", ctx.vibeUser ? ctx.vibeUser.username : "null");
      console.log("[Posts] ctx.user:", ctx.user ? ctx.user.email : "null");
      console.log("[Posts] input.imageUrl length:", input.imageUrl?.length);
      console.log("[Posts] input.caption:", input.caption);
      
      if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      console.log("[Posts] User found:", user.username);
      console.log("[Posts] Creating post with userId:", user.id);
      
      if (!input.imageUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "imageUrl é obrigatório" });
      }
      
      const postId = await db.createPost({
        userId: user.id,
        caption: input.caption || null,
        imageUrl: input.imageUrl,
      });

      console.log("[Posts] Post created with id:", postId);
      
      return {
        success: true,
        postId,
        message: "Post criado com sucesso",
      };
    }),

  /**
   * Get user posts
   */
  getUserPosts: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const viewerId = ctx.vibeUser?.id || (ctx.user ? (await db.getUserByEmail(ctx.user.email || ""))?.id : undefined);
      return db.getUserPosts(input.userId, viewerId);
    }),

  /**
   * Get feed (all posts)
   */
  getFeed: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }
      const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      return db.getFeedPosts(user.id, input.limit);
    }),

  /**
   * Like a post
   */
  like: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      await db.likePost({ userId: user.id, postId: input.postId });

      // Create notification for post owner
      const post = await db.getPostById(input.postId);
      if (post && post.userId !== user.id) {
        await db.createNotification({
          userId: post.userId,
          type: "like",
          relatedUserId: user.id,
          relatedPostId: input.postId,
        });
      }

      return {
        success: true,
        message: "Post curtido",
      };
    }),

  /**
   * Unlike a post
   */
  unlike: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      await db.unlikePost(user.id, input.postId);

      return {
        success: true,
        message: "Curtida removida",
      };
    }),

  /**
   * Create a comment
   */
  /**
   * Create a comment with notification
   */
  createComment: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        text: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      const commentId = await db.createComment({
        userId: user.id,
        postId: input.postId,
        text: input.text,
      });

      // Create notification for post owner
      const post = await db.getPostById(input.postId);
      if (post && post.userId !== user.id) {
        await db.createNotification({
          userId: post.userId,
          type: "comment",
          relatedUserId: user.id,
          relatedPostId: input.postId,
        });
      }

      return {
        success: true,
        commentId,
        message: "Comentário adicionado",
      };
    }),

  /**
   * Get post comments
   */
  getComments: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      return db.getPostComments(input.postId);
    }),

  addComment: protectedProcedure
    .input(z.object({ postId: z.number(), text: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.vibeUser) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please login" });
      
      const commentId = await db.createComment({
        userId: ctx.vibeUser.id,
        postId: input.postId,
        text: input.text,
      });

      // Create notification for post owner
      const post = await db.getPostById(input.postId);
      if (post && post.userId !== ctx.vibeUser.id) {
        await db.createNotification({
          userId: post.userId,
          type: "comment",
          relatedUserId: ctx.vibeUser.id,
          relatedPostId: input.postId,
        });
      }

      return commentId;
    }),

  /**
   * Delete a post
   */
  delete: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      console.log("[Delete Post] Starting delete mutation");
      console.log("[Delete Post] ctx.vibeUser:", ctx.vibeUser ? ctx.vibeUser.username : "null");
      console.log("[Delete Post] ctx.user:", ctx.user ? ctx.user.email : "null");
      console.log("[Delete Post] postId:", input.postId);

      if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      console.log("[Delete Post] User resolved:", user.id, user.username);

      try {
        const result = await db.deletePost(input.postId, user.id);
        console.log("[Delete Post] Post deleted successfully");
        return result;
      } catch (error: any) {
        console.error("[Delete Post] Error deleting post:", error.message);
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }
    }),
});

/**
 * VibeOn Followers Router
 */
export const vibeFollowersRouter = router({
  /**
   * Follow a user
   */
  follow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      await db.followUser(user.id, input.userId);
      
      // Create notification for the followed user
      try {
        await db.createNotification({
          userId: input.userId,
          type: "follow",
          relatedUserId: user.id,
        });
      } catch (error) {
        console.error("Erro ao criar notificação:", error);
      }

      return {
        success: true,
        message: "Usuário seguido",
      };
    }),

  /**
   * Unfollow a user
   */
  unfollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      await db.unfollowUser(user.id, input.userId);

      return {
        success: true,
        message: "Usuário deixado de seguir",
      };
    }),

  /**
   * Get user followers
   */
  getFollowers: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getUserFollowers(input.userId);
    }),

  /**
   * Get user following
   */
  getFollowing: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getUserFollowing(input.userId);
    }),
});

/**
 * VibeOn Messages Router
 */
export const vibeMessagesRouter = router({
  /**
   * Send a message
   */
  send: protectedProcedure
    .input(
      z.object({
        recipientId: z.number(),
        text: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      const messageId = await db.sendMessage({
        senderId: user.id,
        recipientId: input.recipientId,
        text: input.text,
      });

      return {
        success: true,
        messageId,
        message: "Mensagem enviada",
      };
    }),

  /**
   * Get all conversations
   */
  getConversations: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      return db.getConversations(user.id);
    }),

  /**
   * Get conversation
   */
  getConversation: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      return db.getConversation(user.id, input.userId);
    }),
});

/**
 * VibeOn Notifications Router
 */
export const vibeNotificationsRouter = router({
  /**
   * Get user notifications
   */
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.vibeUser && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
    }

    const user = ctx.vibeUser || (ctx.user ? await db.getUserByEmail(ctx.user.email || "") : null);
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
    }

    return db.getUserNotifications(user.id);
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationAsRead(input.notificationId);

      return {
        success: true,
        message: "Notificação marcada como lida",
      };
    }),
});
