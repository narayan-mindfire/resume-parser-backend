import express from "express";
import { matchJobController } from "../controllers/job.controller";

const resumeRouter = express.Router();

resumeRouter.get("/match-job", matchJobController);

export default resumeRouter;
