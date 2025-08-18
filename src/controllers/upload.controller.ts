import { Request, Response } from "express";
import { processChunkUpload } from "../services/upload.service";
import asyncHandler from "express-async-handler";
/**
 * @desc    Handles chunked ZIP uploads using service layer
 */
export const handleZipUpload = asyncHandler(
  async (req: Request, res: Response) => {
    await processChunkUpload(req, res);
  }
);
