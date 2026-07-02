import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";

export async function getMyAddresses(req: Request, res: Response) {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.userId },
    orderBy: { isDefault: "desc" },
  });
  return res.json({ addresses });
}

const addressSchema = z.object({
  label: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(4),
  country: z.string().default("India"),
  isDefault: z.boolean().default(false),
});

export async function createAddress(req: Request, res: Response) {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const userId = req.user!.userId;

  // Only one default address per user — unset any existing default first.
  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({ data: { ...parsed.data, userId } });
  return res.status(201).json({ address });
}

export async function deleteAddress(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.address.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!existing) return res.status(404).json({ error: "Address not found" });

  await prisma.address.delete({ where: { id } });
  return res.status(204).send();
}
