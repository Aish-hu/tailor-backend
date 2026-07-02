import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";

const measurementSchema = z.object({
  unit: z.enum(["cm", "in"]).default("cm"),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hip: z.number().positive().optional(),
  shoulder: z.number().positive().optional(),
  sleeveLength: z.number().positive().optional(),
  inseam: z.number().positive().optional(),
  outseam: z.number().positive().optional(),
  neck: z.number().positive().optional(),
  topLength: z.number().positive().optional(),
  thigh: z.number().positive().optional(),
  bicep: z.number().positive().optional(),
  notes: z.string().optional(),
});

// Customer's own profile. Used to pre-fill the measurement form and
// to auto-attach measurements at checkout.
export async function getMyMeasurements(req: Request, res: Response) {
  const profile = await prisma.measurementProfile.findUnique({
    where: { userId: req.user!.userId },
  });
  return res.json({ profile }); // null if not set up yet — frontend should show the entry form
}

// Single endpoint handles both first-time entry and edits (upsert).
export async function upsertMyMeasurements(req: Request, res: Response) {
  const parsed = measurementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const profile = await prisma.measurementProfile.upsert({
    where: { userId: req.user!.userId },
    update: parsed.data,
    create: { ...parsed.data, userId: req.user!.userId },
  });

  return res.json({ profile });
}

// Admin/seller view of a specific customer's measurements (e.g. support lookup).
export async function getCustomerMeasurements(req: Request, res: Response) {
  const { userId } = req.params;
  const profile = await prisma.measurementProfile.findUnique({ where: { userId } });
  if (!profile) {
    return res.status(404).json({ error: "This customer hasn't set up measurements yet" });
  }
  return res.json({ profile });
}
