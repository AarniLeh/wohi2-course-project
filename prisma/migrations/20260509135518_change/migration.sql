-- AlterTable
ALTER TABLE `attempts` ADD COLUMN `correct` BOOLEAN NULL,
    ADD COLUMN `submittedAnswer` VARCHAR(191) NULL;
