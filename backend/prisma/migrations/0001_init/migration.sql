-- CreateTable
CREATE TABLE `User` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_artist` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login` DATETIME(3) NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Artist` (
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `country` VARCHAR(100) NULL,
    `is_band` BOOLEAN NOT NULL DEFAULT false,
    `band_member_ids` JSON NULL,
    `country_of_origin` VARCHAR(100) NULL,
    `production_house_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Artist_country_idx`(`country`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Production_House` (
    `production_house_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `Production_House_name_key`(`name`),
    PRIMARY KEY (`production_house_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Song` (
    `song_id` INTEGER NOT NULL AUTO_INCREMENT,
    `song_name` VARCHAR(255) NOT NULL,
    `duration` INTEGER NOT NULL,
    `publish_date` DATE NOT NULL,
    `genres` JSON NOT NULL,
    `listen_count` INTEGER NOT NULL DEFAULT 0,
    `is_published` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`song_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Song_Artist_Relationship` (
    `song_id` INTEGER NOT NULL,
    `artist_id` INTEGER NOT NULL,
    `role` VARCHAR(100) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`song_id`, `artist_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Playlist` (
    `playlist_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `created_by_user_id` INTEGER NOT NULL,
    `cover_art_url` VARCHAR(500) NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `release_type` ENUM('Single', 'EP', 'Album') NULL,
    `last_updated` DATETIME(3) NOT NULL,
    `is_shared` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`playlist_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Playlist_Song` (
    `playlist_id` INTEGER NOT NULL,
    `song_id` INTEGER NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`playlist_id`, `song_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Playlist_Collaborator` (
    `playlist_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    PRIMARY KEY (`playlist_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Follow` (
    `follower_user_id` INTEGER NOT NULL,
    `followed_user_id` INTEGER NOT NULL,

    PRIMARY KEY (`follower_user_id`, `followed_user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Listening_Activity` (
    `activity_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `song_id` INTEGER NOT NULL,
    `listening_time` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`activity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lyrics` (
    `lyrics_id` INTEGER NOT NULL AUTO_INCREMENT,
    `song_id` INTEGER NOT NULL,
    `lyrics_text` LONGTEXT NOT NULL,
    `lyrics_filename` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`lyrics_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Artist` ADD CONSTRAINT `Artist_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Artist` ADD CONSTRAINT `Artist_production_house_id_fkey` FOREIGN KEY (`production_house_id`) REFERENCES `Production_House`(`production_house_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Song_Artist_Relationship` ADD CONSTRAINT `Song_Artist_Relationship_song_id_fkey` FOREIGN KEY (`song_id`) REFERENCES `Song`(`song_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Song_Artist_Relationship` ADD CONSTRAINT `Song_Artist_Relationship_artist_id_fkey` FOREIGN KEY (`artist_id`) REFERENCES `Artist`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Playlist` ADD CONSTRAINT `Playlist_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Playlist_Song` ADD CONSTRAINT `Playlist_Song_playlist_id_fkey` FOREIGN KEY (`playlist_id`) REFERENCES `Playlist`(`playlist_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Playlist_Song` ADD CONSTRAINT `Playlist_Song_song_id_fkey` FOREIGN KEY (`song_id`) REFERENCES `Song`(`song_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Playlist_Collaborator` ADD CONSTRAINT `Playlist_Collaborator_playlist_id_fkey` FOREIGN KEY (`playlist_id`) REFERENCES `Playlist`(`playlist_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Playlist_Collaborator` ADD CONSTRAINT `Playlist_Collaborator_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_follower_user_id_fkey` FOREIGN KEY (`follower_user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_followed_user_id_fkey` FOREIGN KEY (`followed_user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Listening_Activity` ADD CONSTRAINT `Listening_Activity_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Listening_Activity` ADD CONSTRAINT `Listening_Activity_song_id_fkey` FOREIGN KEY (`song_id`) REFERENCES `Song`(`song_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lyrics` ADD CONSTRAINT `Lyrics_song_id_fkey` FOREIGN KEY (`song_id`) REFERENCES `Song`(`song_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
