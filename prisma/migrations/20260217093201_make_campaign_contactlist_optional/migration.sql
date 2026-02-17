-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "contactListId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" DATETIME NOT NULL,
    "spreadOverDays" INTEGER NOT NULL DEFAULT 1,
    "intervalSeconds" INTEGER NOT NULL DEFAULT 300,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_contactListId_fkey" FOREIGN KEY ("contactListId") REFERENCES "ContactList" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("contactListId", "createdAt", "failedCount", "id", "intervalSeconds", "messageTemplate", "name", "sentCount", "spreadOverDays", "startDate", "status", "totalMessages", "updatedAt") SELECT "contactListId", "createdAt", "failedCount", "id", "intervalSeconds", "messageTemplate", "name", "sentCount", "spreadOverDays", "startDate", "status", "totalMessages", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
