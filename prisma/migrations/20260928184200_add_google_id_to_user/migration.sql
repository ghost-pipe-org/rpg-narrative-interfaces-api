ALTER TABLE "User" ADD COLUMN "googleId" VARCHAR(255);
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
