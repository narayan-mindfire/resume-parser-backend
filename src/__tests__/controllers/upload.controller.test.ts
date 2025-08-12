import { Request, Response, NextFunction } from "express";
import { handleZipUpload } from "../../controllers/upload.controller";
import { processChunkUpload } from "../../services/upload.service";

jest.mock("../../services/upload.service");

jest.mock("../../config/redisClient", () => ({
  default: {},
}));

jest.mock("../../queues/fileProcessingQueue", () => ({
  fileProcessingQueue: {
    add: jest.fn(),
  },
}));

const mockProcessChunkUpload = processChunkUpload as jest.Mock;

describe("handleZipUpload", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson = jest.fn();
    mockStatus = jest.fn(() => ({ json: mockJson }));

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    mockRequest = {
      body: {
        uploadId: "test-upload-id",
        chunkIndex: "0",
        totalChunks: "1",
        fileName: "test.zip",
      },
    };

    mockNext = jest.fn();
  });

  test("should call the service and not call next on successful upload", async () => {
    mockProcessChunkUpload.mockResolvedValue(undefined);

    await handleZipUpload(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockProcessChunkUpload).toHaveBeenCalledWith(
      mockRequest,
      mockResponse,
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should call next with an error if the service throws an exception", async () => {
    const errorMessage = "Chunk upload failed.";
    const error = new Error(errorMessage);
    mockProcessChunkUpload.mockRejectedValue(error);

    await handleZipUpload(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(error);

    expect(mockStatus).not.toHaveBeenCalled();
    expect(mockJson).not.toHaveBeenCalled();
  });
});
