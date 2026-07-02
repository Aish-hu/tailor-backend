import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import razorpay from "../config/razorpay";

const checkoutSchema = z.object({
  addressId: z.string().uuid(),
});

// Checkout: takes everything in the customer's cart, snapshots their
// CURRENT measurement profile onto each order item, computes the total,
// creates the Order + a Razorpay order for payment, then clears the cart.
export async function checkout(req: Request, res: Response) {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { addressId } = parsed.data;
  const userId = req.user!.userId;

  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) return res.status(404).json({ error: "Address not found" });

  // Custom-order business rule: you can't check out without measurements on file.
  const measurements = await prisma.measurementProfile.findUnique({ where: { userId } });
  if (!measurements) {
    return res.status(400).json({
      error: "Please add your measurements before placing a custom order",
    });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true, selections: { include: { option: true } } },
  });
  if (cartItems.length === 0) {
    return res.status(400).json({ error: "Your cart is empty" });
  }

  // Build order items with frozen price + frozen measurements.
  const orderItemsData = cartItems.map((item) => {
    const optionsTotal = item.selections.reduce((sum, s) => sum + s.option.priceDelta, 0);
    const unitPrice = item.product.basePrice + optionsTotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      measurementsSnapshot: measurements, // frozen copy — future profile edits won't touch this
      selections: { create: item.selections.map((s) => ({ optionId: s.optionId })) },
    };
  });

  const totalAmount = orderItemsData.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      userId,
      addressId,
      totalAmount,
      items: { create: orderItemsData },
    },
    include: { items: true },
  });

  // Razorpay expects amount in the smallest currency unit (paise for INR).
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100),
    currency: "INR",
    receipt: order.id,
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
    },
  });

  // Cart is now converted into an order — clear it.
  await prisma.cartItem.deleteMany({ where: { userId } });

  return res.status(201).json({
    order,
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  });
}

export async function getMyOrders(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.userId },
    include: { items: { include: { product: true } }, payment: true, address: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ orders });
}

export async function getOrder(req: Request, res: Response) {
  const { id } = req.params;
  const order = await prisma.order.findFirst({
    where: { id, userId: req.user!.userId },
    include: {
      items: { include: { product: true, selections: { include: { option: true } } } },
      payment: true,
      address: true,
    },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json({ order });
}

// Admin: see every order with full measurements attached — this is the
// "seller automatically gets the measurements" requirement.
export async function listAllOrders(req: Request, res: Response) {
  const { status } = req.query;
  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: { include: { product: true, selections: { include: { option: true } } } },
      payment: true,
      address: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ orders });
}

const updateStatusSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "CONFIRMED",
    "IN_PRODUCTION",
    "READY_FOR_DELIVERY",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export async function updateOrderStatus(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const order = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return res.json({ order });
}
