import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getMyAddresses, createAddress, deleteAddress } from "../controllers/addressController";

const router = Router();

router.use(requireAuth);

router.get("/", getMyAddresses);
router.post("/", createAddress);
router.delete("/:id", deleteAddress);

export default router;
