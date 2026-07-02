const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

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

  console.log("Database cleared.");

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
  console.log("Created admin user:", admin.email);

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
  console.log("Created customer user:", customer.email);

  // Seed default Y2K custom products
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
                { label: "Acid Acid Blue", priceDelta: 0 },
                { label: "Deep Indigo Wash", priceDelta: 150 },
                { label: "Bubblegum Pink Wash", priceDelta: 300 }
              ]
            }
          },
          {
            name: "Back Star Applique",
            required: true,
            options: {
              create: [
                { label: "Silver Metallic Star", priceDelta: 0 },
                { label: "Pink Velvet Star", priceDelta: 100 },
                { label: "Glow in the Dark Star", priceDelta: 250 }
              ]
            }
          },
          {
            name: "Collar Lining",
            required: false,
            options: {
              create: [
                { label: "Standard Denim", priceDelta: 0 },
                { label: "Faux White Fur", priceDelta: 200 },
                { label: "Leopard Print Velvet", priceDelta: 300 }
              ]
            }
          }
        ]
      }
    },
    {
      name: "Butterfly Mesh Camisole Set",
      description: "Double layered mesh camisole with adjustable side strapping, butterfly motifs, and baby-lock hem details.",
      basePrice: 1299,
      category: "Shirt",
      images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80"],
      customizationGroups: {
        create: [
          {
            name: "Outer Mesh Fabric",
            required: true,
            options: {
              create: [
                { label: "Pastel Lavender Butterfly", priceDelta: 0 },
                { label: "Lime Grid Wave Print", priceDelta: 0 },
                { label: "Classic Cyber Black Mesh", priceDelta: 100 }
              ]
            }
          },
          {
            name: "Strap Style",
            required: true,
            options: {
              create: [
                { label: "Thin Spaghetti Straps", priceDelta: 0 },
                { label: "Double Cross-Back Ribbons", priceDelta: 80 }
              ]
            }
          }
        ]
      }
    },
    {
      name: "Cyber Web Utility Trousers",
      description: "Baggy parachute trousers with contrast stitches, 6 utility cargo pockets, and adjustable buckles.",
      basePrice: 3299,
      category: "Trousers",
      images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80"],
      customizationGroups: {
        create: [
          {
            name: "Pants Fabric",
            required: true,
            options: {
              create: [
                { label: "Nylon Crinkle Khaki", priceDelta: 0 },
                { label: "Cyber Punk Black Canvas", priceDelta: 150 },
                { label: "Acid Lime Tech-Fabric", priceDelta: 300 }
              ]
            }
          },
          {
            name: "Stitch & Details",
            required: true,
            options: {
              create: [
                { label: "Contrast Neon Pink Stitches", priceDelta: 0 },
                { label: "Reflective Silver Trim Stitches", priceDelta: 150 }
              ]
            }
          }
        ]
      }
    },
    {
      name: "Boho Lace Tiered Skirt",
      description: "Flouncy decora tiered skirt featuring delicate lace panels, cute ribbon bows, and elastic frill waistband.",
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
                { label: "White Linen & Eyelet Lace", priceDelta: 0 },
                { label: "Soft Pink Gingham & Lace", priceDelta: 100 },
                { label: "Black Grunge Tulle & Lace", priceDelta: 150 }
              ]
            }
          },
          {
            name: "Waist Tie Accent",
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
    });
    console.log("Created product:", product.name);
  }

  console.log("Database seed completed successfully! 🌱");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
