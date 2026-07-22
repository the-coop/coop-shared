-- MySQL 8 schema for coop-bot / coop-shared
-- Converted from the Heroku Postgres dump (herokupgbackup).
-- Engine: InnoDB, charset utf8mb4 throughout (required so all FK columns share the
-- collation of users.discord_id). All identifiers are backticked to sidestep reserved
-- words (hour, time, change, value, date, ...).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `activity_hours`;
DROP TABLE IF EXISTS `adverts`;
DROP TABLE IF EXISTS `bases`;
DROP TABLE IF EXISTS `blog_posts`;
DROP TABLE IF EXISTS `candidates`;
DROP TABLE IF EXISTS `chicken`;
DROP TABLE IF EXISTS `competition_entries`;
DROP TABLE IF EXISTS `donations`;
DROP TABLE IF EXISTS `election_votes`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `hierarchy`;
DROP TABLE IF EXISTS `item_qty_change_history`;
DROP TABLE IF EXISTS `items`;
DROP TABLE IF EXISTS `open_trades`;
DROP TABLE IF EXISTS `post_drafts`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `propaganda_subscriptions`;
DROP TABLE IF EXISTS `reserves`;
DROP TABLE IF EXISTS `skills`;
DROP TABLE IF EXISTS `structures`;
DROP TABLE IF EXISTS `temp_login_codes`;
DROP TABLE IF EXISTS `temp_messages`;
DROP TABLE IF EXISTS `todos`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `users`;

-- ---------------------------------------------------------------------------
-- users must exist first: every foreign key references users(discord_id).
-- ---------------------------------------------------------------------------
CREATE TABLE `users` (
  `id`                   INT NOT NULL AUTO_INCREMENT,
  `discord_id`           VARCHAR(255) NOT NULL,
  `join_date`            BIGINT,
  `intro_link`           VARCHAR(512),
  `intro_time`           BIGINT,
  `max_trade_slots`      INT NOT NULL DEFAULT 5,
  `last_sacrificed_secs` INT,
  `last_msg_secs`        INT,
  `total_msgs`           INT DEFAULT 0,
  `historical_points`    DOUBLE,
  `health`               INT DEFAULT 100,
  `username`             VARCHAR(255),
  `image`                VARCHAR(512),
  `intro_content`        TEXT,
  `x`                    DOUBLE,
  `y`                    DOUBLE,
  `z`                    DOUBLE,
  `last_claim`           DATE,
  `wallet`               CHAR(58),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_discord_id_key` (`discord_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `activity_hours` (
  `hour`       INT NOT NULL,
  `active_num` INT,
  PRIMARY KEY (`hour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `adverts` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `owner_id`   VARCHAR(255),
  `target_url` VARCHAR(512),
  `image_url`  VARCHAR(512),
  PRIMARY KEY (`id`),
  KEY `adverts_owner_id` (`owner_id`),
  CONSTRAINT `adverts_owner_fk` FOREIGN KEY (`owner_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bases` (
  `face_id`    INT NOT NULL,
  `owner_id`   VARCHAR(255),
  `created_at` INT,
  PRIMARY KEY (`face_id`),
  KEY `bases_owner_id` (`owner_id`),
  CONSTRAINT `bases_owner_fk` FOREIGN KEY (`owner_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `blog_posts` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `date`            INT,
  `slug`            VARCHAR(50),
  `title`           TEXT,
  `content`         TEXT,
  `author_id`       VARCHAR(255),
  `author_username` VARCHAR(255),
  `category`        VARCHAR(255),
  `channel_id`      VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_posts_slug_key` (`slug`),
  KEY `blog_posts_author_id` (`author_id`),
  CONSTRAINT `blog_author_member` FOREIGN KEY (`author_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `candidates` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `campaign_msg_link` VARCHAR(512),
  `candidate_id`      VARCHAR(255),
  PRIMARY KEY (`id`),
  KEY `candidates_candidate_id` (`candidate_id`),
  CONSTRAINT `candidates_candidate_fk` FOREIGN KEY (`candidate_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chicken` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `attribute` VARCHAR(255) NOT NULL,
  `value`     VARCHAR(512),
  PRIMARY KEY (`id`),
  UNIQUE KEY `chicken_attribute_key` (`attribute`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `competition_entries` (
  `id`           INT NOT NULL AUTO_INCREMENT,
  `entrant_id`   VARCHAR(255),
  `competition`  VARCHAR(255),
  `entry_msg_id` VARCHAR(255),
  PRIMARY KEY (`id`),
  KEY `competition_entries_entrant_id` (`entrant_id`),
  CONSTRAINT `fk_entrant_id` FOREIGN KEY (`entrant_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `donations` (
  `id`                    INT NOT NULL AUTO_INCREMENT,
  `discord_full_username` VARCHAR(255),
  `acknowledged`          TINYINT(1),
  `amount`                FLOAT,
  `created_on`            DATETIME(3),
  `symbol`                VARCHAR(255),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `election_votes` (
  `id`           INT NOT NULL AUTO_INCREMENT,
  `candidate_id` VARCHAR(255),
  `voter_id`     VARCHAR(255),
  `time`         INT,
  PRIMARY KEY (`id`),
  KEY `election_votes_candidate_id` (`candidate_id`),
  KEY `election_votes_voter_id` (`voter_id`),
  CONSTRAINT `fk_candidate_id` FOREIGN KEY (`candidate_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_voter_id` FOREIGN KEY (`voter_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `events` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `event_code`    VARCHAR(255) NOT NULL,
  `last_occurred` BIGINT,
  `active`        TINYINT(1) DEFAULT 0,
  `description`   TEXT,
  `title`         VARCHAR(255),
  `message_link`  VARCHAR(512),
  `organiser`     VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `events_event_code_key` (`event_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `hierarchy` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `discord_id` VARCHAR(255),
  `username`   VARCHAR(255),
  `type`       VARCHAR(255),
  `image`      VARCHAR(512),
  PRIMARY KEY (`id`),
  KEY `hierarchy_discord_id` (`discord_id`),
  CONSTRAINT `hierarchy_member` FOREIGN KEY (`discord_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `item_qty_change_history` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `owner`         VARCHAR(255),
  `item`          VARCHAR(255),
  `running`       DOUBLE,
  `change`        DOUBLE,
  `note`          VARCHAR(512),
  `occurred_secs` INT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `items` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `item_code` VARCHAR(255),
  `quantity`  DOUBLE,
  `owner_id`  VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `items_item_code_owner_id_key` (`item_code`, `owner_id`),
  KEY `items_owner_id` (`owner_id`),
  CONSTRAINT `fk_owner_id_items` FOREIGN KEY (`owner_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `open_trades` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `trader_id`       VARCHAR(255),
  `offer_item`      VARCHAR(255),
  `receive_item`    VARCHAR(255),
  `offer_qty`       DOUBLE,
  `receive_qty`     DOUBLE,
  `trader_username` VARCHAR(255),
  PRIMARY KEY (`id`),
  KEY `open_trades_trader_id` (`trader_id`),
  CONSTRAINT `fk_trader_id` FOREIGN KEY (`trader_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `post_drafts` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(255),
  `description` TEXT,
  `channel_id`  VARCHAR(255),
  `owner_id`    VARCHAR(255),
  `created`     INT,
  `deadline`    INT,
  `content`     TEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_drafts_title_key` (`title`),
  KEY `post_drafts_owner_id` (`owner_id`),
  CONSTRAINT `post_drafts_project_member` FOREIGN KEY (`owner_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `projects` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(255),
  `description` TEXT,
  `channel_id`  VARCHAR(255),
  `owner_id`    VARCHAR(255),
  `created`     INT,
  `deadline`    INT,
  `slug`        VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `projects_title_key` (`title`),
  KEY `projects_owner_id` (`owner_id`),
  CONSTRAINT `projects_project_member` FOREIGN KEY (`owner_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `propaganda_subscriptions` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `level`         INT,
  `email`         VARCHAR(255),
  `owner_id`      VARCHAR(255),
  `subscribed_at` INT,
  PRIMARY KEY (`id`),
  KEY `propaganda_subscriptions_owner_id` (`owner_id`),
  CONSTRAINT `subscriber_member` FOREIGN KEY (`owner_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reserves` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `currency_code` VARCHAR(255),
  `running`       DOUBLE,
  `change`        DOUBLE,
  `note`          VARCHAR(512),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `skills` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `crafting`    INT,
  `magic`       INT,
  `mining`      INT,
  `woodcutting` INT,
  `fishing`     INT,
  `hunting`     INT,
  `player_id`   VARCHAR(255),
  `cooking`     INT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_skiller_id` (`player_id`),
  CONSTRAINT `fk_player_id` FOREIGN KEY (`player_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `structures` (
  `id`             INT NOT NULL AUTO_INCREMENT,
  `structure_code` VARCHAR(255),
  `health`         INT,
  `level`          INT,
  `owner_id`       VARCHAR(255),
  PRIMARY KEY (`id`),
  KEY `structures_owner_id` (`owner_id`),
  CONSTRAINT `fk_owner_id_structures` FOREIGN KEY (`owner_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `temp_login_codes` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `discord_id` VARCHAR(255),
  `code`       VARCHAR(255),
  `expires_at` INT,
  PRIMARY KEY (`id`),
  KEY `temp_login_codes_discord_id` (`discord_id`),
  CONSTRAINT `real_authenticating_user` FOREIGN KEY (`discord_id`) REFERENCES `users` (`discord_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `temp_messages` (
  `id`           INT NOT NULL AUTO_INCREMENT,
  `expiry_time`  INT,
  `message_link` VARCHAR(512),
  `note`         VARCHAR(30),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_msg_link` (`message_link`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `todos` (
  `id`       INT NOT NULL AUTO_INCREMENT,
  `user_id`  VARCHAR(255),
  `due`      INT,
  `title`    VARCHAR(255),
  `category` VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_title` (`user_id`, `title`),
  CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `role_code`  VARCHAR(255),
  `role_id`    VARCHAR(255),
  `discord_id` VARCHAR(255),
  PRIMARY KEY (`id`),
  KEY `user_roles_discord_id` (`discord_id`),
  CONSTRAINT `discord_member` FOREIGN KEY (`discord_id`) REFERENCES `users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
