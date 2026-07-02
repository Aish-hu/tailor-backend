import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Clean existing data
  await prisma.payment.deleteMany();
  await prisma.orderItemSelection.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItemSelection.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.customizationOption.deleteMany();
  await prisma.customizationGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.address.deleteMany();
  await prisma.measurementProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("✓ Database cleared.");

  // Create default admin user
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "DEA Tailor Admin",
      email: "admin@dea.com",
      phone: "9876543210",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });
  console.log("✓ Created admin user:", admin.email);

  // Create default customer user
  const customerPasswordHash = await bcrypt.hash("customer123", 10);
  const customer = await prisma.user.create({
    data: {
      name: "Cherry Dollhouse",
      email: "customer@dea.com",
      phone: "9876543211",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
    },
  });
  console.log("✓ Created customer user:", customer.email);

  // Seed Y2K products
  const productsToSeed = [
    {
      name: "Y2K Star Denim Jacket",
      description: "Oversized crop denim jacket with signature star applique patch on the back and metallic rivets.",
      basePrice: 2499,
      category: "Jacket",
      images: ["https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80"],
      customizationGroups: {
        create: [
          {
            name: "Denim Wash",
            required: true,
            options: {
              create: [
                { label: "Acid Blue", priceDelta: 0 },
                { label: "Deep Indigo", priceDelta: 150 },
                { label: "Bubblegum Pink", priceDelta: 300 }
              ]
            }
          },
          {
            name: "Star Applique",
            required: true,
            options: {
              create: [
                { label: "Silver Metallic", priceDelta: 0 },
                { label: "Pink Velvet", priceDelta: 100 },
                { label: "Glow in Dark", priceDelta: 250 }
              ]
            }
          }
        ]
      }
    },
    {
      name: "Butterfly Mesh Camisole",
      description: "Double layered mesh camisole with adjustable side ruching and butterfly motifs.",
      basePrice: 1299,
      category: "Shirt",
      images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80"],
      customizationGroups: {
        create: [
          {
            name: "Mesh Fabric",
            required: true,
            options: {
              create: [
                { label: "Lavender Butterfly", priceDelta: 0 },
                { label: "Lime Grid", priceDelta: 0 },
                { label: "Cyber Black", priceDelta: 100 }
              ]
            }
          },
          {
            name: "Strap Style",
            required: true,
            options: {
              create: [
                { label: "Spaghetti Straps", priceDelta: 0 },
                { label: "Cross-Back Ribbons", priceDelta: 80 }
              ]
            }
          }
        ]
      }
    },
    {
      name: "Cyber Web Utility Trousers",
      description: "Baggy parachute trousers with contrast stitches, 6 cargo pockets, and adjustable buckles.",
      basePrice: 3299,
      category: "Trousers",
      images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80"],
      customizationGroups: {
        create: [
          {
            name: "Fabric",
            required: true,
            options: {
              create: [
                { label: "Nylon Crinkle Khaki", priceDelta: 0 },
                { label: "Cyber Black Canvas", priceDelta: 150 },
                { label: "Acid Lime Tech", priceDelta: 300 }
              ]
            }
          },
          {
            name: "Details",
            required: true,
            options: {
              create: [
                { label: "Neon Pink Stitches", priceDelta: 0 },
                { label: "Silver Reflective Trim", priceDelta: 150 }
              ]
            }
          }
        ]
      }
    },
    {
      name: "Boho Lace Tiered Skirt",
      description: "Flouncy tiered skirt with delicate lace panels, ribbon bows, and elastic frill waistband.",
      basePrice: 1899,
      category: "Skirt",
      images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80"],
      customizationGroups: {
        create: [
          {
            name: "Tier Patterns",
            required: true,
            options: {
              create: [
                { label: "White Linen & Eyelet", priceDelta: 0 },
                { label: "Soft Pink Gingham", priceDelta: 100 },
                { label: "Black Grunge Tulle", priceDelta: 150 }
              ]
            }
          },
          {
            name: "Waist Tie",
            required: true,
            options: {
              create: [
                { label: "Satin Corset Ribbon", priceDelta: 0 },
                { label: "Beaded Hemp Cord", priceDelta: 50 }
              ]
            }
          }
        ]
      }
    }
  ];

  for (const productData of productsToSeed) {
    const product = await prisma.product.create({
      data: productData,
      include: {
        customizationGroups: {
          include: {
            options: true
          }
        }
      }
    });
    console.log(`✓ Seeded: ${product.name}`);
  }

  console.log("\n✅ Database seed completed successfully! All users and products ready.");
  console.log("\nLogin credentials:");
  console.log("  Admin:    admin@dea.com / admin123");
  console.log("  Customer: customer@dea.com / customer123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
