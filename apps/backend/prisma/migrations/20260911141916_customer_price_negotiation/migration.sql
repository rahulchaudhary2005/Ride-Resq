-- CreateEnum
CREATE TYPE "FareMode" AS ENUM ('AUTOMATIC', 'CUSTOMER_OFFER');

-- CreateEnum
CREATE TYPE "FareOfferStatus" AS ENUM ('NONE', 'PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "ServicePricing" ADD COLUMN     "pricingVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "agreedFare" DECIMAL(10,2),
ADD COLUMN     "customerRequestedFare" DECIMAL(10,2),
ADD COLUMN     "distanceKm" DECIMAL(10,3),
ADD COLUMN     "fareMode" "FareMode" NOT NULL DEFAULT 'AUTOMATIC',
ADD COLUMN     "fareOfferStatus" "FareOfferStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "pricingBaseFareSnapshot" DECIMAL(10,2),
ADD COLUMN     "pricingMinFareSnapshot" DECIMAL(10,2),
ADD COLUMN     "pricingPerKmRateSnapshot" DECIMAL(10,2),
ADD COLUMN     "pricingSurgeSnapshot" DOUBLE PRECISION,
ADD COLUMN     "pricingVersionSnapshot" INTEGER;
