import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";

export async function getMyCart(req: Request, res: Response) {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.userId },
    include: {
      product: true,
      selections: { include: { option: { include: { group: true } } } },
    },
  });

  // Compute price per line so the frontend doesn't have to.
  const itemsWithPrice = items.map((item) => {
    const optionsTotal = item.selections.reduce((sum, s) => sum + s.option.priceDelta, 0);
    const unitPrice = item.product.basePrice + optionsTotal;
    return { ...item, unitPrice, lineTotal: unitPrice * item.quantity };
  });

  const cartTotal = itemsWithPrice.reduce((sum, i) => sum + i.lineTotal, 0);

  return res.json({ items: itemsWithPrice, cartTotal });
}

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  optionIds: z.array(z.string().uuid()).default([]), // chosen CustomizationOption ids
});

export async function addToCart(req: Request, res: Response) {
  const parsed = addToCartSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { productId, quantity, optionIds } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return res.status(404).json({ error: "Product not available" });
  }

  const cartItem = await prisma.cartItem.create({
    data: {
      userId: req.user!.userId,
      productId,
      quantity,
      selections: { create: optionIds.map((optionId) => ({ optionId })) },
    },
    include: { selections: { include: { option: true } }, product: true },
  });

  return res.status(201).json({ cartItem });
}

const updateCartSchema = z.object({
  quantity: z.number().int().positive(),
});

export async function updateCartItem(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const parsed = updateCartSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // Ownership check — make sure the cart item actually belongs to this user.
  const existing = await prisma.cartItem.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!existing) return res.status(404).json({ error: "Cart item not found" });

  const cartItem = await prisma.cartItem.update({
    where: { id },
    data: { quantity: parsed.data.quantity },
  });
  return res.json({ cartItem });
}

export async function removeCartItem(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const existing = await prisma.cartItem.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!existing) return res.status(404).json({ error: "Cart item not found" });

  await prisma.cartItem.delete({ where: { id } });
  return res.status(204).send();
}
