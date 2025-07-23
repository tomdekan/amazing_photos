-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "prompt" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sex" "Sex" NOT NULL,
    "seed" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isStarterPrompt" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "prompt_pkey" PRIMARY KEY ("id")
);
