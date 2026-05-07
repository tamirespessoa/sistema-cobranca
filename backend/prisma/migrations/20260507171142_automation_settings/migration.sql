-- CreateTable
CREATE TABLE "AutomationSetting" (
    "id" TEXT NOT NULL,
    "automaticReminders" BOOLEAN NOT NULL DEFAULT true,
    "automaticEmail" BOOLEAN NOT NULL DEFAULT false,
    "runHour" INTEGER NOT NULL DEFAULT 8,
    "runMinute" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationSetting_pkey" PRIMARY KEY ("id")
);
