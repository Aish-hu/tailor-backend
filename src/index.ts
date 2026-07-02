import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./config/prisma";

import authRoutes from "./routes/authRoutes";
import measurementRoutes from "./routes/measurementRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import addressRoutes from "./routes/addressRoutes";
import orderRoutes from "./routes/orderRoutes";
import paymentRoutes from "./routes/paymentRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/measurements", measurementRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // Test Prisma connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("✓ Prisma client ready");
    console.log("✓ Database connected");
    
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("✗ Database connection failed:", error);
    process.exit(1);
  }
};

startServer();
