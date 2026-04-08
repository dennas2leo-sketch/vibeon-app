CREATE TABLE `vibe_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vibe_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `vibe_sessions_token_unique` UNIQUE(`token`)
);
