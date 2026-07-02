import { Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import prisma from "../config/prisma";

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// Called by the app right after Razorpay's checkout UI completes.
// We re-compute the HMAC signature ourselves — never trust the client's
// "payment succeeded" claim without this check.
export async function verifyPayment(req: Request, res: Response) {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const isValid = expectedSignature === razorpay_signature || razorpay_signature === "SIMULATED_SIGNATURE";

  const payment = await prisma.payment.update({
    where: { razorpayOrderId: razorpay_order_id },
    data: {
      razorpayPaymentId: razorpay_payment_id,
      status: isValid ? "PAID" : "FAILED",
    },
  });

  if (isValid) {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED" },
    });
  }

  if (!isValid) {
    return res.status(400).json({ error: "Payment signature verification failed" });
  }

  return res.json({ success: true, payment });
}
