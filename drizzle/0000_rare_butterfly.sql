CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`offer_id` text NOT NULL,
	`clipper_email` text NOT NULL,
	`message` text NOT NULL,
	`portfolio_url` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_offer_clipper_unique` ON `applications` (`offer_id`,`clipper_email`);--> statement-breakpoint
CREATE INDEX `applications_offer_idx` ON `applications` (`offer_id`);--> statement-breakpoint
CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`title` text NOT NULL,
	`client_name` text NOT NULL,
	`description` text NOT NULL,
	`platforms` text NOT NULL,
	`budget_cents` integer NOT NULL,
	`cpm_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `offers_status_created_idx` ON `offers` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`skills` text DEFAULT '' NOT NULL,
	`portfolio_url` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);