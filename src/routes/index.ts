import { Router } from "express";
import uploadRouter from "./upload.routes";

const router = Router();
router.use("/uploads", uploadRouter);

export default router;
