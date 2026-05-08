-- AlterEnum
ALTER TYPE "DebtStatus" ADD VALUE 'EM_NEGOCIACAO';

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "originalAmount" DECIMAL(10,2) NOT NULL,
    "negotiatedAmount" DECIMAL(10,2) NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "agreementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstDueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
