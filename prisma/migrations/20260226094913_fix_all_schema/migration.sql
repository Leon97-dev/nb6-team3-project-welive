/*
  Warnings:

  - The values [RESIDING,MOVED_OUT] on the enum `ResidentOccupancyStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `occupancyStatus` on the `ResidentRoster` table. All the data in the column will be lost.

*/
BEGIN;

-- 1) 신규 enum 생성
CREATE TYPE "ResidentOccupancyStatus_new" AS ENUM ('RESIDENCE', 'NO_RESIDENCE');

-- 2) 신규 컬럼 추가 (임시 기본값)
ALTER TABLE "ResidentRoster"
  ADD COLUMN "residenceStatus" "ResidentOccupancyStatus_new" NOT NULL DEFAULT 'RESIDENCE';

-- 3) 기존 occupancyStatus 데이터를 신규 컬럼으로 매핑
UPDATE "ResidentRoster"
SET "residenceStatus" = CASE
  WHEN "occupancyStatus" = 'RESIDING' THEN 'RESIDENCE'::"ResidentOccupancyStatus_new"
  WHEN "occupancyStatus" = 'MOVED_OUT' THEN 'NO_RESIDENCE'::"ResidentOccupancyStatus_new"
  ELSE 'RESIDENCE'::"ResidentOccupancyStatus_new"
END;

-- 4) 기존 인덱스/컬럼 제거
DROP INDEX IF EXISTS "public"."ResidentRoster_occupancyStatus_idx";
ALTER TABLE "ResidentRoster" DROP COLUMN "occupancyStatus";

-- 5) enum 이름 교체 (스키마 타입명 유지)
ALTER TYPE "ResidentOccupancyStatus" RENAME TO "ResidentOccupancyStatus_old";
ALTER TYPE "ResidentOccupancyStatus_new" RENAME TO "ResidentOccupancyStatus";
DROP TYPE "ResidentOccupancyStatus_old";

-- 6) 신규 컬럼 기본값/인덱스 확정
ALTER TABLE "ResidentRoster"
  ALTER COLUMN "residenceStatus" SET DEFAULT 'RESIDENCE'::"ResidentOccupancyStatus";

CREATE INDEX "ResidentRoster_residenceStatus_idx" ON "ResidentRoster"("residenceStatus");

COMMIT;
