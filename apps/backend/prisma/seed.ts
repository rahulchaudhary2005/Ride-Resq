import { PrismaClient, ServiceCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Default pricing per service category
  const pricingDefaults: Record<ServiceCategory, { baseFare: number; perKmRate: number; minFare: number }> = {
    TOWING: { baseFare: 599, perKmRate: 25, minFare: 599 },
    FLAT_TIRE: { baseFare: 299, perKmRate: 15, minFare: 299 },
    BATTERY_JUMP: { baseFare: 249, perKmRate: 15, minFare: 249 },
    FUEL_DELIVERY: { baseFare: 349, perKmRate: 15, minFare: 349 },
    LOCKOUT: { baseFare: 349, perKmRate: 15, minFare: 349 },
    MECHANICAL_REPAIR: { baseFare: 499, perKmRate: 20, minFare: 499 },
    WINCHING: { baseFare: 699, perKmRate: 25, minFare: 699 },
    EV_CHARGING: { baseFare: 399, perKmRate: 15, minFare: 399 },
  };

  for (const [category, pricing] of Object.entries(pricingDefaults)) {
    await prisma.servicePricing.upsert({
      where: { category: category as ServiceCategory },
      create: { category: category as ServiceCategory, ...pricing },
      update: pricing,
    });
  }

  // Seed a default admin account (change password immediately in production)
  const adminEmail = "admin@roadguard.app";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        fullName: "RoadGuard Admin",
        email: adminEmail,
        phone: "+916202762630",
        passwordHash: await bcrypt.hash("ChangeMe123!", 10),
        role: "ADMIN",
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
    console.log(`Seeded admin user: ${adminEmail} / ChangeMe123!`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
