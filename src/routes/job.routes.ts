import express from "express";
import { matchJobByBatch } from "../controllers/job.controller";
import { protect } from "../middlewares/auth.middleware";

const jobRouter = express.Router();

jobRouter.get("/match-batch-job", protect, matchJobByBatch);

export default jobRouter;
