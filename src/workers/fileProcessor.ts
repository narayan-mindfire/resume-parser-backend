import { Job, Worker } from "bullmq";
import redisClient from "../config/redisClient";
import minioClient from "../config/minioClient";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import pdf from "pdf-parse";
import { parseResumeText } from "./extractor.service";
import { resumeRepository } from "../repositories/resumeRepository";

export interface CombinedJob {
  fileName: string;
  minioPath: string;
  uploadId: string;
  trackingKey: string;
}

/**
 * Executes OCR on an image file using a Tesseract Docker container.
 * @param {string} imagePath The path to the image file.
 * @param {string} tempDir The temporary directory where the file is located.
 * @returns {Promise<string>} A promise that resolves with the extracted text.
 */
async function runOCR(imagePath: string, tempDir: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      `docker run --rm -v ${tempDir}:/data jitesoft/tesseract-ocr /data/${path.basename(imagePath)} stdout --psm 6 --oem 1`,
      (err, stdout, stderr) => {
        if (err) {
          console.error("Tesseract error:", stderr);
          return reject(err);
        }
        resolve(stdout);
      },
    );
  });
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[\s()]/g, "_").replace(/_+/g, "_");
}

export const processor = async (job: Job<CombinedJob>) => {
  const { fileName, minioPath, uploadId, trackingKey } = job.data;
  console.log(`Start processing: ${fileName}`);

  // --- File Processing and OCR ---
  await redisClient.set(
    `status:${trackingKey}`,
    JSON.stringify({
      fileName,
      uploadId,
      status: "processing-ocr",
      timestamp: Date.now(),
    }),
    "EX",
    24 * 60 * 60,
  );

  const tempDir = path.join(__dirname, "../../temp_ocr");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const localFilePath = path.join(tempDir, fileName);
  const baseName = path.parse(fileName).name;

  try {
    // Download file from MinIO
    const stream = await minioClient.getObject("resumes", minioPath);
    await new Promise<void>((resolve, reject) => {
      const ws = fs.createWriteStream(localFilePath);
      stream.pipe(ws);
      ws.on("finish", resolve);
      ws.on("error", reject);
    });
  } catch (err) {
    console.error("Error fetching file from MinIO:", err);
    await redisClient.set(
      `status:${trackingKey}`,
      JSON.stringify({
        fileName,
        uploadId,
        status: "failed",
        error: "Failed to download from MinIO",
        timestamp: Date.now(),
      }),
      "EX",
      24 * 60 * 60,
    );
    return;
  }
  console.log(`Downloaded to ${localFilePath}`);

  let fullText = "";

  if (fileName.toLowerCase().endsWith(".pdf")) {
    try {
      const pdfBuffer = fs.readFileSync(localFilePath);
      const pdfData = await pdf(pdfBuffer);
      if (pdfData.text && pdfData.text.trim().length > 50) {
        console.log("Extracted text directly from PDF (no OCR needed).");
        fullText = pdfData.text;
      } else {
        console.log("PDF text too short, falling back to OCR...");
        await new Promise<void>((resolve, reject) => {
          exec(
            `docker run --rm -v ${tempDir}:/data minidocks/poppler pdftoppm /data/${fileName} /data/${baseName} -png`,
            (err, _stdout, stderr) => {
              if (err) {
                console.error("PDF -> image conversion error:", stderr);
                return reject(err);
              }
              resolve();
            },
          );
        });

        const pngFiles = fs
          .readdirSync(tempDir)
          .filter((f) => f.startsWith(baseName) && f.endsWith(".png"));

        for (const img of pngFiles) {
          const text = await runOCR(path.join(tempDir, img), tempDir);
          fullText += text + "\n";
        }
      }
    } catch (err) {
      console.error("Error processing PDF:", err);
      await redisClient.set(
        `status:${trackingKey}`,
        JSON.stringify({
          fileName,
          uploadId,
          status: "failed",
          error: "OCR processing failed",
          timestamp: Date.now(),
        }),
        "EX",
        24 * 60 * 60,
      );
      return;
    }
  } else {
    try {
      fullText = await runOCR(localFilePath, tempDir);
    } catch (err) {
      console.error("Error running OCR on image:", err);
      await redisClient.set(
        `status:${trackingKey}`,
        JSON.stringify({
          fileName,
          uploadId,
          status: "failed",
          error: "OCR processing failed",
          timestamp: Date.now(),
        }),
        "EX",
        24 * 60 * 60,
      );
      return;
    }
  }

  console.log(`Extracted text:\n${fullText}`);

  fs.readdirSync(tempDir)
    .filter((f) => f.startsWith(baseName))
    .forEach((f) => fs.unlinkSync(path.join(tempDir, f)));

  let resumeId: string | null = null;
  const sanitizedFileName = sanitizeFilename(fileName);

  try {
    await redisClient.set(
      `status:${trackingKey}`,
      JSON.stringify({
        fileName,
        uploadId,
        status: "parsing-text",
        timestamp: Date.now(),
      }),
      "EX",
      24 * 60 * 60,
    );

    const text = fullText;

    if (!text || typeof text !== "string") {
      throw new Error(`Invalid text data for ${fileName}`);
    }

    let resume = await resumeRepository.findByFileName(sanitizedFileName);

    if (resume) {
      resume = await resumeRepository.update(resume.id, {
        rawText: text,
        processingStatus: "processing",
      });
      resumeId = resume.id;
      console.log(
        `Resuming processing for ${sanitizedFileName} with DB ID: ${resumeId}`,
      );
    } else {
      resume = await resumeRepository.create({
        fileName: sanitizedFileName,
        rawText: text,
        processingStatus: "processing",
      });
      resumeId = resume.id;
      console.log(
        `Started processing for ${sanitizedFileName} with DB ID: ${resumeId}`,
      );
    }

    // Parse the resume text
    const parsed = parseResumeText(text);

    // Update the resume with parsed data
    await resumeRepository.update(resumeId, {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      skills: parsed.skills,
      education: parsed.education,
      experience: parsed.experience,
      totalExperienceYears: parsed.totalExperienceYears,
      processingStatus: "completed",
    });

    console.log(
      `Successfully parsed and stored resume for ${sanitizedFileName} in PostgreSQL.`,
    );

    await redisClient.set(
      `status:${trackingKey}`,
      JSON.stringify({
        fileName,
        uploadId,
        status: "completed",
        resumeId,
        timestamp: Date.now(),
      }),
      "EX",
      24 * 60 * 60,
    );

    // Publish notification with uploadId for Socket.io routing
    await redisClient.publish(
      "job-updates",
      JSON.stringify({
        jobId: job.id,
        fileName: sanitizedFileName,
        uploadId,
        trackingKey,
        status: "completed",
        resumeId: resumeId,
        data: parsed,
        timestamp: Date.now(),
      }),
    );

    return parsed;
  } catch (error) {
    console.error(`Error processing resume ${sanitizedFileName}:`, error);

    if (resumeId) {
      await resumeRepository.updateStatusAndError(
        resumeId,
        "failed",
        error instanceof Error ? error.message : "Unknown error",
      );

      await redisClient.set(
        `status:${trackingKey}`,
        JSON.stringify({
          fileName,
          uploadId,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          resumeId,
          timestamp: Date.now(),
        }),
        "EX",
        24 * 60 * 60,
      );

      await redisClient.publish(
        "job-updates",
        JSON.stringify({
          jobId: job?.id,
          fileName: sanitizedFileName,
          uploadId,
          trackingKey,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          resumeId: resumeId,
          timestamp: Date.now(),
        }),
      );
    }

    throw error;
  }
};

new Worker<CombinedJob>("file-processing", processor, {
  connection: redisClient,
});
