/*
  Warnings:

  - A unique constraint covering the columns `[shop]` on the table `DealAiAppKey` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DealAiAppKey_shop_key" ON "DealAiAppKey"("shop");
