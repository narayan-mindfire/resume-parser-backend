import { Request, Response } from "express";
import {
  fetchAllResumes,
  fetchResumeById,
  fetchResumeByBatch,
} from "../../services/resumes.service"; // adjust path if needed
import { resumeRepository } from "../../repositories/resumeRepository";
import { Resume } from "../../../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

jest.mock("../../repositories/resumeRepository", () => ({
  resumeRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByBatchId: jest.fn(),
  },
}));

describe("Resume Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  const mockResumes: Resume[] = [
    {
      id: "mock-id",
      fileName: "file.doc",
      processingStatus: "COMPLETED",
      rawText: "some text",
      name: "Jane Doe",
      email: "jane.doe@example.com",
      phone: "123-456-7890",
      skills: ["JS"],
      education: ["University"],
      experience: ["2 years"],
      totalExperienceYears: new Decimal(2),
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "userid",
      batchId: "batchid",
      url: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockStatus = jest.fn(() => mockResponse as Response);
    mockJson = jest.fn();
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  describe("fetchAllResumes", () => {
    it("should return all resumes with a 200 status code", async () => {
      (resumeRepository.findAll as jest.Mock).mockResolvedValue(mockResumes);

      mockRequest = {};

      await fetchAllResumes(mockRequest as Request, mockResponse as Response);

      expect(resumeRepository.findAll).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ resumes: mockResumes });
    });

    it("should return an empty array if no resumes exist", async () => {
      (resumeRepository.findAll as jest.Mock).mockResolvedValue([]);

      mockRequest = {};

      await fetchAllResumes(mockRequest as Request, mockResponse as Response);

      expect(resumeRepository.findAll).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ resumes: [] });
    });
  });

  describe("fetchResumeById", () => {
    it("should return a single resume with a 200 status code if found", async () => {
      (resumeRepository.findById as jest.Mock).mockResolvedValue(
        mockResumes[0],
      );

      mockRequest = { params: { id: mockResumes[0].id } };

      await fetchResumeById(mockRequest as Request, mockResponse as Response);

      expect(resumeRepository.findById).toHaveBeenCalledWith(mockResumes[0].id);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ resume: mockResumes[0] });
    });

    it("should return a 404 status code if the resume is not found", async () => {
      (resumeRepository.findById as jest.Mock).mockResolvedValue(null);

      mockRequest = { params: { id: "non-existent-id" } };

      await fetchResumeById(mockRequest as Request, mockResponse as Response);

      expect(resumeRepository.findById).toHaveBeenCalledWith("non-existent-id");
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).not.toHaveBeenCalled();
    });

    it("should not call the repository if ID is missing", async () => {
      mockRequest = { params: {} };

      await fetchResumeById(mockRequest as Request, mockResponse as Response);

      expect(resumeRepository.findById).not.toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe("fetchResumeByBatch", () => {
    it("should return resumes by batch with a 200 status code", async () => {
      (resumeRepository.findByBatchId as jest.Mock).mockResolvedValue(
        mockResumes,
      );

      mockRequest = { params: { batchId: "batchid" } };

      await fetchResumeByBatch(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(resumeRepository.findByBatchId).toHaveBeenCalledWith("batchid");
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ resumes: mockResumes });
    });

    it("should return 404 if no resumes found for batch", async () => {
      (resumeRepository.findByBatchId as jest.Mock).mockResolvedValue(null);

      mockRequest = { params: { batchId: "empty-batch" } };

      await fetchResumeByBatch(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(resumeRepository.findByBatchId).toHaveBeenCalledWith(
        "empty-batch",
      );
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).not.toHaveBeenCalled();
    });

    it("should not call repository if batchId is missing", async () => {
      mockRequest = { params: {} };

      await fetchResumeByBatch(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(resumeRepository.findByBatchId).not.toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });
});
