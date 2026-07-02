import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";

// Public: browse active products, with customization options included
// so the app can render the design + options in one call.
export async function listProducts(req: Request, res: Response) {
  const { category } = req.query;
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category: String(category) } : {}),
    },
    include: { customizationGroups: { include: { options: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ products });
}

export async function getProduct(req: Request, res: Response) {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { customizationGroups: { include: { options: true } } },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  return res.json({ product });
}

const optionSchema = z.object({
  label: z.string().min(1),
  priceDelta: z.number().default(0),
});

const groupSchema = z.object({
  name: z.string().min(1),
  required: z.boolean().default(true),
  options: z.array(optionSchema).min(1),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  category: z.string().min(1),
  images: z.array(z.string()).default([]),
  customizationGroups: z.array(groupSchema).default([]),
});

// Admin only: create a design with its customization groups (fabric, color, etc.)
// in a single call using a nested Prisma write.
export async function createProduct(req: Request, res: Response) {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { customizationGroups, ...productData } = parsed.data;

  const product = await prisma.product.create({
    data: {
      ...productData,
      customizationGroups: {
        create: customizationGroups.map((g) => ({
          name: g.name,
          required: g.required,
          options: { create: g.options },
        })),
      },
    },
    include: { customizationGroups: { include: { options: true } } },
  });

  return res.status(201).json({ product });
}

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  basePrice: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function updateProduct(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const product = await prisma.product.update({ where: { id }, data: parsed.data });
  return res.json({ product });
}

export async function deleteProduct(req: Request, res: Response) {
  const { id } = req.params;
  // Soft delete — keeps history intact for past orders referencing this product.
  const product = await prisma.product.update({ where: { id }, data: { isActive: false } });
  return res.json({ product });
}
