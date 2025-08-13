import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { once } from "events";
import minioClient from "../config/minioClient";
import redisClient from "../config/redisClient";
import { extractZipEntries } from "../utils/zipUtils";
import { validExtensions, bucketName } from "../constants/fileConstants";
import { fileProcessingQueue } from "../queues/fileProcessingQueue";
import { AuthRequest } from "../types/types";
import { create as createBatch } from "../repositories/batch.repository";

export const processChunkUpload = async (req: Request, res: Response) => {
  console.log("checking in!");
  const { uploadId, chunkIndex, totalChunks, fileName } = req.body;
  const userId = (req as AuthRequest).user?.id;

  console.log("user id: ", userId);

  if (
    !req.file ||
    !uploadId ||
    !chunkIndex ||
    !totalChunks ||
    !fileName ||
    !userId
  ) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  const chunkDir = path.join(__dirname, `../../temp_chunks/${uploadId}`);
  if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir, { recursive: true });

  const chunkPath = path.join(chunkDir, `${chunkIndex}`);
  fs.renameSync(req.file.path, chunkPath);

  if (+chunkIndex !== +totalChunks - 1) {
    return res
      .status(200)
      .json({ message: "Chunk received, awaiting more chunks" });
  }

  const outputPath = path.join(__dirname, `../../uploads/${fileName}`);
  const writeStream = fs.createWriteStream(outputPath);

  for (let i = 0; i < +totalChunks; i++) {
    const partPath = path.join(chunkDir, `${i}`);
    const data = fs.readFileSync(partPath);
    writeStream.write(data);
    fs.unlinkSync(partPath);
  }

  writeStream.end();
  await once(writeStream, "finish");
  fs.rmSync(chunkDir, { recursive: true, force: true });

  const extractTo = path.join(__dirname, "../../extracted");
  if (!fs.existsSync(extractTo)) {
    fs.mkdirSync(extractTo, { recursive: true });
  }

  const extractedFiles = extractZipEntries(
    outputPath,
    extractTo,
    validExtensions,
  );

  fs.unlinkSync(outputPath);

  const urls: string[] = [];
  const fileList: string[] = [];
  const bucketExists = await minioClient.bucketExists(bucketName);

  if (!bucketExists) await minioClient.makeBucket(bucketName);

  const batch = await createBatch(userId);
  const batchId = batch.id;
  const totalFiles = extractedFiles.length;

  await redisClient.set(
    `batch_count:${batchId}`,
    totalFiles,
    "EX",
    24 * 60 * 60,
  );

  for (const file of extractedFiles) {
    const filePath = path.join(extractTo, file);
    const objectName = `${uploadId}/${file}`;
    const trackingKey = `${uploadId}:${file}`;

    await minioClient.fPutObject(bucketName, objectName, filePath);

    const presignedUrl = await minioClient.presignedUrl(
      "GET",
      bucketName,
      objectName,
      24 * 60 * 60 * 5,
    );

    urls.push(presignedUrl);
    fileList.push(file);

    await redisClient.set(
      `file:${presignedUrl}`,
      JSON.stringify({
        status: "uploaded",
        timestamp: Date.now(),
        trackingKey,
      }),
    );

    // Store file status for tracking
    await redisClient.set(
      `status:${trackingKey}`,
      JSON.stringify({
        fileName: file,
        uploadId,
        status: "uploaded",
        timestamp: Date.now(),
      }),
      "EX",
      24 * 60 * 60,
    );

    await fileProcessingQueue.add("processFile", {
      fileName: file,
      minioPath: objectName,
      uploadId,
      trackingKey,
      userId,
      batchId,
    });

    fs.unlinkSync(filePath);
  }

  return res.status(200).json({
    message: "Upload, extraction, and upload to MinIO complete",
    files: urls,
    uploadId,
    fileList,
    totalFiles,
    batchId,
  });
};
