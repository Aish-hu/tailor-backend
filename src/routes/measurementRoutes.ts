import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  getMyMeasurements,
  upsertMyMeasurements,
  getCustomerMeasurements,
} from "../controllers/measurementController";

const router = Router();

router.get("/me", requireAuth, getMyMeasurements);
router.put("/me", requireAuth, upsertMyMeasurements);

// Admin lookup, e.g. for support or manual order corrections.
router.get("/customer/:userId", requireAuth, requireAdmin, getCustomerMeasurements);

export default router;
