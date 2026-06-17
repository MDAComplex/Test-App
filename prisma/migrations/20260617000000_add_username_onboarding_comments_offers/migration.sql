-- AlterTable
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- CreateTable
CREATE TABLE "product_offers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "deliveryText" TEXT,
    "affiliateUrl" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_offers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_comments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "product_comments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comment_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_preferences" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "categoryWeights" TEXT NOT NULL DEFAULT '{}',
    "tagWeights" TEXT NOT NULL DEFAULT '{}',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "budgetRange" TEXT NOT NULL DEFAULT '[]',
    "styleVibes" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_preferences" ("categoryWeights", "tagWeights", "updatedAt", "userId") SELECT "categoryWeights", "tagWeights", "updatedAt", "userId" FROM "user_preferences";
DROP TABLE "user_preferences";
ALTER TABLE "new_user_preferences" RENAME TO "user_preferences";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "product_offers_productId_idx" ON "product_offers"("productId");

-- CreateIndex
CREATE INDEX "product_comments_productId_idx" ON "product_comments"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_commentId_userId_key" ON "comment_likes"("commentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

