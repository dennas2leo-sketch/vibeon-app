CREATE TABLE `vibe_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`text` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vibe_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vibe_followers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vibe_followers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vibe_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vibe_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vibe_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`text` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vibe_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vibe_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`relatedUserId` int,
	`relatedPostId` int,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vibe_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vibe_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caption` text,
	`imageUrl` text NOT NULL,
	`likesCount` int NOT NULL DEFAULT 0,
	`commentsCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vibe_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vibe_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`username` varchar(50) NOT NULL,
	`password` varchar(255) NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`dateOfBirth` varchar(10) NOT NULL,
	`profilePhoto` text,
	`bio` text,
	`isEmailVerified` int NOT NULL DEFAULT 0,
	`verificationCode` varchar(6),
	`verificationCodeExpiry` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vibe_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `vibe_users_email_unique` UNIQUE(`email`),
	CONSTRAINT `vibe_users_username_unique` UNIQUE(`username`)
);
