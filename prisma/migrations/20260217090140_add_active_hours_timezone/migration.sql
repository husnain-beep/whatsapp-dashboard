-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "wasenderApiKey" TEXT,
    "defaultIntervalSeconds" INTEGER NOT NULL DEFAULT 300,
    "maxMessagesPerDay" INTEGER NOT NULL DEFAULT 288,
    "activeStartTime" TEXT NOT NULL DEFAULT '08:00',
    "activeEndTime" TEXT NOT NULL DEFAULT '22:00',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("createdAt", "defaultIntervalSeconds", "id", "maxMessagesPerDay", "updatedAt", "wasenderApiKey") SELECT "createdAt", "defaultIntervalSeconds", "id", "maxMessagesPerDay", "updatedAt", "wasenderApiKey" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
