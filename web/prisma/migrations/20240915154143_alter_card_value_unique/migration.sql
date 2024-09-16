/*
  Warnings:

  - A unique constraint covering the columns `[card_value]` on the table `AccessCard` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AccessCard_card_value_key" ON "AccessCard"("card_value");
