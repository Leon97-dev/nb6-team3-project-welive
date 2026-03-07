/*
  Warnings:

  - The values [ADMIN_SIGNUP_REQUESTED,ADMIN_SIGNUP_APPROVED,ADMIN_SIGNUP_REJECTED,RESIDENT_SIGNUP_REQUESTED,RESIDENT_SIGNUP_APPROVED,RESIDENT_SIGNUP_REJECTED,COMPLAINT_CREATED,COMPLAINT_STATUS_CHANGED,NOTICE_CREATED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `deletedAt` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Complaint` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `relatedBoardId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `relatedBoardType` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `ResidentRoster` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isRegistered` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pollId]` on the table `ApartmentSchedule` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contact]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `boardType` to the `ApartmentSchedule` table without a default value. This is not possible if the table is not empty.
  - Made the column `boardId` on table `Complaint` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `boardId` to the `Notice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ApprovalStatus" ADD VALUE 'NEED_UPDATE';

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('GENERAL', 'SIGNUP_REQ', 'COMPLAINT_REQ', 'COMPLAINT_IN_PROGRESS', 'COMPLAINT_RESOLVED', 'COMPLAINT_REJECTED', 'NOTICE_REG', 'POLL_REG', 'POLL_CLOSED', 'POLL_RESULT', 'SYSTEM', 'TEST');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_boardId_fkey";

-- DropIndex
DROP INDEX "Notification_receiverId_isRead_createdAt_idx";

-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "ApartmentSchedule" ADD COLUMN     "boardType" "BoardType" NOT NULL,
ADD COLUMN     "pollId" TEXT;

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "apartmentId",
DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "Complaint" DROP COLUMN "deletedAt",
ALTER COLUMN "boardId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "deletedAt",
ADD COLUMN     "boardId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "createdAt",
DROP COLUMN "isRead",
DROP COLUMN "message",
DROP COLUMN "relatedBoardId",
DROP COLUMN "relatedBoardType",
DROP COLUMN "title",
ADD COLUMN     "complaintId" TEXT,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "isChecked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noticeId" TEXT,
ADD COLUMN     "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pollId" TEXT;

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "ResidentRoster" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "deletedAt",
DROP COLUMN "isRegistered",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "ApartmentSchedule_pollId_key" ON "ApartmentSchedule"("pollId");

-- CreateIndex
CREATE INDEX "ApartmentSchedule_boardType_startDate_endDate_idx" ON "ApartmentSchedule"("boardType", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Notification_receiverId_isChecked_notifiedAt_idx" ON "Notification"("receiverId", "isChecked", "notifiedAt");

-- CreateIndex
CREATE INDEX "Notification_complaintId_idx" ON "Notification"("complaintId");

-- CreateIndex
CREATE INDEX "Notification_noticeId_idx" ON "Notification"("noticeId");

-- CreateIndex
CREATE INDEX "Notification_pollId_idx" ON "Notification"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "User_contact_key" ON "User"("contact");

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApartmentSchedule" ADD CONSTRAINT "ApartmentSchedule_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE SET NULL ON UPDATE CASCADE;
