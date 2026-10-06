CREATE TYPE "VehicleClass" AS ENUM ('SMALL', 'MEDIUM', 'HEAVY');

ALTER TABLE "ServiceRequest"
ADD COLUMN "vehicleClass" "VehicleClass" NOT NULL DEFAULT 'SMALL',
ADD COLUMN "distanceTaxSnapshot" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "distanceTaxRateSnapshot" DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE "Payment"
ADD COLUMN "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE TABLE "VehicleTaxRule" (
    "vehicleClass" "VehicleClass" NOT NULL,
    "perKmRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleTaxRule_pkey" PRIMARY KEY ("vehicleClass")
);