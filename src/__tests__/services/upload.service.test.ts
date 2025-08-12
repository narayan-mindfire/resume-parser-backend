import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { once } from "events";
import minioClient from "../../config/minioClient";
import redisClient from "../../config/redisClient";
import { extractZipEntries } from "../../utils/zipUtils";
import { fileProcessingQueue } from "../../queues/fileProcessingQueue";
import { processChunkUpload } from "../../services/upload.service";
import { validExtensions, bucketName } from "../../constants/fileConstants";
import stream from "stream";

jest.mock("fs");
jest.mock("path");
jest.mock("events");
jest.mock("../../config/minioClient");
jest.mock("../../utils/zipUtils");
jest.mock("../../queues/fileProcessingQueue");

jest.mock("../../config/redisClient", () => ({
  set: jest.fn(),
  quit: jest.fn(),
}));

describe("processChunkUpload", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson = jest.fn();
    mockStatus = jest.fn(() => ({ json: mockJson }));
    mockResponse = { status: mockStatus, json: mockJson };
    mockRequest = {
      body: {
        uploadId: "test-upload-id",
        chunkIndex: "0",
        totalChunks: "1",
        fileName: "test.zip",
      },
      file: {
        fieldname: "file",
        originalname: "test.zip",
        encoding: "7bit",
        mimetype: "application/zip",
        size: 1024,
        destination: "/mock/destination",
        filename: "mock-filename",
        path: "/mock/path/to/chunk",
        buffer: Buffer.from("mock data"),
        stream: new stream.Readable(),
      },
    };

    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.renameSync as jest.Mock).mockReturnValue(undefined);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      Buffer.from("mock chunk data"),
    );
    (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
    (fs.rmSync as jest.Mock).mockReturnValue(undefined);
    (fs.createWriteStream as jest.Mock).mockReturnValue({
      write: jest.fn(),
      end: jest.fn(),
    });

    (once as jest.Mock).mockResolvedValue(undefined);

    (minioClient.bucketExists as jest.Mock).mockResolvedValue(true);
    (minioClient.fPutObject as jest.Mock).mockResolvedValue(undefined);
    (minioClient.presignedUrl as jest.Mock).mockResolvedValue(
      "http://mock.minio.url/file.zip",
    );

    (redisClient.set as jest.Mock).mockResolvedValue(undefined);

    (extractZipEntries as jest.Mock).mockReturnValue([
      "file1.pdf",
      "file2.jpg",
    ]);

    (fileProcessingQueue.add as jest.Mock).mockResolvedValue(undefined);

    (path.join as jest.Mock).mockImplementation((...args) => args.join("/"));
  });

  test("should return early if not the last chunk", async () => {
    mockRequest.body = {
      ...mockRequest.body,
      chunkIndex: "0",
      totalChunks: "2",
    };

    await processChunkUpload(mockRequest as Request, mockResponse as Response);

    expect(fs.createWriteStream).not.toHaveBeenCalled();
    expect(extractZipEntries).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Chunk received, awaiting more chunks",
    });
  });

  test("should throw an error if required fields are missing", async () => {
    mockRequest.body = {
      uploadId: undefined,
      chunkIndex: "0",
      totalChunks: "1",
      fileName: "test.zip",
    };

    await expect(
      processChunkUpload(mockRequest as Request, mockResponse as Response),
    ).rejects.toThrow("Missing required fields");
    expect(mockStatus).toHaveBeenCalledWith(400);
  });
  test("should process final chunk, extract files, upload to MinIO, store in Redis, and enqueue jobs", async () => {
    // Make it the last chunk
    mockRequest.body = {
      uploadId: "test-upload-id",
      chunkIndex: "0",
      totalChunks: "1",
      fileName: "test.zip",
    };

    const mockWrite = jest.fn();
    (fs.createWriteStream as jest.Mock).mockReturnValue({
      write: mockWrite,
      end: jest.fn(),
    });

    (minioClient.bucketExists as jest.Mock).mockResolvedValue(false);

    await processChunkUpload(mockRequest as Request, mockResponse as Response);

    expect(fs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining("temp_chunks/test-upload-id"),
    );
    expect(fs.mkdirSync).toHaveBeenCalled();

    expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining("0"));
    expect(mockWrite).toHaveBeenCalledWith(Buffer.from("mock chunk data"));

    expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining("0"));
    expect(fs.rmSync).toHaveBeenCalledWith(
      expect.stringContaining("temp_chunks/test-upload-id"),
      { recursive: true, force: true },
    );

    expect(extractZipEntries).toHaveBeenCalledWith(
      expect.stringContaining("uploads/test.zip"),
      expect.stringContaining("extracted"),
      validExtensions,
    );

    expect(minioClient.bucketExists).toHaveBeenCalledWith(bucketName);
    expect(minioClient.makeBucket).toHaveBeenCalledWith(bucketName);

    for (const file of ["file1.pdf", "file2.jpg"]) {
      expect(minioClient.fPutObject).toHaveBeenCalledWith(
        bucketName,
        expect.stringContaining(file),
        expect.stringContaining(file),
      );

      expect(minioClient.presignedUrl).toHaveBeenCalledWith(
        "GET",
        bucketName,
        expect.stringContaining(file),
        24 * 60 * 60 * 5,
      );

      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining("file:http://mock.minio.url/file.zip"),
        expect.any(String),
      );

      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining(`status:test-upload-id:${file}`),
        expect.any(String),
        "EX",
        24 * 60 * 60,
      );

      expect(fileProcessingQueue.add).toHaveBeenCalledWith(
        "processFile",
        expect.objectContaining({ fileName: file }),
      );
    }

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Upload, extraction, and upload to MinIO complete",
        files: expect.any(Array),
        fileList: ["file1.pdf", "file2.jpg"],
        totalFiles: 2,
      }),
    );
  });
});
