import { Request, Response, NextFunction } from "express";
import {
  fetchAllResumes,
  fetchResumeById,
  fetchResumeByBatch,
} from "../../services/resumes.service";
import {
  getAllResumes,
  getResumeById,
  getResumeByBatch,
} from "../../controllers/resume.controller";

jest.mock("../../services/resumes.service");

describe("Resume Controller (asyncHandler wrappers)", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {};
    mockResponse = {
      status: jest.fn(() => mockResponse as Response),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe("getAllResumes", () => {
    it("should call fetchAllResumes with req and res", async () => {
      await getAllResumes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(fetchAllResumes).toHaveBeenCalledWith(mockRequest, mockResponse);
    });

    it("should pass error to next if service throws", async () => {
      (fetchAllResumes as jest.Mock).mockImplementation(() => {
        throw new Error("Service error");
      });

      await getAllResumes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getResumeById", () => {
    it("should call fetchResumeById with req and res", async () => {
      mockRequest = { params: { id: "resume-1" } };

      await getResumeById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(fetchResumeById).toHaveBeenCalledWith(mockRequest, mockResponse);
    });

    it("should pass error to next if service throws", async () => {
      (fetchResumeById as jest.Mock).mockImplementation(() => {
        throw new Error("DB error");
      });

      await getResumeById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getResumeByBatch", () => {
    it("should call fetchResumeByBatch with req and res", async () => {
      mockRequest = { params: { batchId: "batch-1" } };

      await getResumeByBatch(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(fetchResumeByBatch).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
      );
    });

    it("should pass error to next if service throws", async () => {
      (fetchResumeByBatch as jest.Mock).mockImplementation(() => {
        throw new Error("Repo error");
      });

      await getResumeByBatch(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
