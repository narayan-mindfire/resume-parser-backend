import { Router } from "express";
import uploadRouter from "./upload.routes";
import resumeRouter from "./resume.routes";
import jobRouter from "./job.routes";
import authRouter from "./auth.routes";
import batchRouter from "./batch.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/uploads", uploadRouter);
router.use("/resumes", resumeRouter);
router.use("/jobs", jobRouter);
router.use("/batches", batchRouter);

export default router;
