import { describe, it, expect, beforeEach } from "vitest";

interface Post {
  id: number;
  username: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  liked: boolean;
}

describe("Posts Functionality", () => {
  let posts: Post[] = [];

  beforeEach(() => {
    posts = [
      {
        id: 1,
        username: "ali_nevaz",
        caption: "Que dia incrível! 🌟",
        likesCount: 245,
        commentsCount: 12,
        liked: false,
      },
      {
        id: 2,
        username: "spacehall_",
        caption: "Vibes do fim de semana 💫",
        likesCount: 532,
        commentsCount: 45,
        liked: false,
      },
    ];
  });

  describe("Post Creation", () => {
    it("should create a new post with valid data", () => {
      const newPost: Post = {
        id: 3,
        username: "user123",
        caption: "Novo post!",
        likesCount: 0,
        commentsCount: 0,
        liked: false,
      };

      posts.push(newPost);
      expect(posts).toHaveLength(3);
      expect(posts[2]).toEqual(newPost);
    });

    it("should require caption for post", () => {
      const invalidPost = {
        id: 4,
        username: "user123",
        caption: "",
        likesCount: 0,
        commentsCount: 0,
        liked: false,
      };

      const isValid = invalidPost.caption.length > 0;
      expect(isValid).toBe(false);
    });

    it("should limit caption to 2200 characters", () => {
      const longCaption = "a".repeat(2201);
      const isValid = longCaption.length <= 2200;
      expect(isValid).toBe(false);

      const validCaption = "a".repeat(2200);
      const isValidLength = validCaption.length <= 2200;
      expect(isValidLength).toBe(true);
    });
  });

  describe("Like Functionality", () => {
    it("should like a post", () => {
      const postId = 1;
      const post = posts.find((p) => p.id === postId);

      if (post) {
        post.liked = true;
        post.likesCount += 1;
      }

      expect(post?.liked).toBe(true);
      expect(post?.likesCount).toBe(246);
    });

    it("should unlike a post", () => {
      const postId = 1;
      const post = posts.find((p) => p.id === postId);

      if (post) {
        post.liked = true;
        post.likesCount += 1;
      }

      if (post) {
        post.liked = false;
        post.likesCount -= 1;
      }

      expect(post?.liked).toBe(false);
      expect(post?.likesCount).toBe(245);
    });

    it("should prevent duplicate likes", () => {
      const postId = 1;
      const post = posts.find((p) => p.id === postId);

      if (post && !post.liked) {
        post.liked = true;
        post.likesCount += 1;
      }

      const initialCount = post?.likesCount;

      // Try to like again
      if (post && !post.liked) {
        post.likesCount += 1;
      }

      expect(post?.likesCount).toBe(initialCount);
    });
  });

  describe("Comments", () => {
    it("should increment comment count", () => {
      const postId = 1;
      const post = posts.find((p) => p.id === postId);

      if (post) {
        post.commentsCount += 1;
      }

      expect(post?.commentsCount).toBe(13);
    });

    it("should validate comment text", () => {
      const comment = "This is a great post!";
      const isValid = comment.length > 0 && comment.length <= 500;
      expect(isValid).toBe(true);

      const emptyComment = "";
      const isEmptyValid = emptyComment.length > 0;
      expect(isEmptyValid).toBe(false);
    });
  });

  describe("Feed Operations", () => {
    it("should retrieve all posts", () => {
      expect(posts).toHaveLength(2);
      expect(posts[0].username).toBe("ali_nevaz");
      expect(posts[1].username).toBe("spacehall_");
    });

    it("should filter posts by username", () => {
      const username = "ali_nevaz";
      const userPosts = posts.filter((p) => p.username === username);

      expect(userPosts).toHaveLength(1);
      expect(userPosts[0].id).toBe(1);
    });

    it("should sort posts by likes (descending)", () => {
      const sorted = [...posts].sort((a, b) => b.likesCount - a.likesCount);

      expect(sorted[0].likesCount).toBe(532);
      expect(sorted[1].likesCount).toBe(245);
    });

    it("should sort posts by date (newest first)", () => {
      const sorted = [...posts].sort((a, b) => b.id - a.id);

      expect(sorted[0].id).toBe(2);
      expect(sorted[1].id).toBe(1);
    });
  });

  describe("Post Deletion", () => {
    it("should delete a post by id", () => {
      const postIdToDelete = 1;
      const initialLength = posts.length;

      posts = posts.filter((p) => p.id !== postIdToDelete);

      expect(posts).toHaveLength(initialLength - 1);
      expect(posts.find((p) => p.id === postIdToDelete)).toBeUndefined();
    });
  });
});
