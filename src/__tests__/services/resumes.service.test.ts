import { Request, Response } from "express";
import {
  fetchAllResumes,
  fetchResumeById,
} from "../../services/resumes.service";
import { resumeRepository } from "../../repositories/resumeRepository";
import { Resume } from "../../../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

jest.mock("../../repositories/resumeRepository", () => ({
  resumeRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
  },
}));

describe("Resume Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  const mockResumes: Resume[] = [
    {
      id: "another-mock-id",
      fileName: "another_file.doc",
      processingStatus: "COMPLETED",
      rawText: "some text",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "123-456-7890",
      skills: ["JS"],
      education: ["University"],
      experience: ["2", "e"],
      totalExperienceYears: Decimal(2),
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
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
  });

  describe("fetchResumeById", () => {
    it("should return a single resume with a 200 status code if found", async () => {
      (resumeRepository.findById as jest.Mock).mockResolvedValue(
        mockResumes[0],
      );

      mockRequest = {
        params: { id: mockResumes[0].id },
      };

      await fetchResumeById(mockRequest as Request, mockResponse as Response);

      expect(resumeRepository.findById).toHaveBeenCalledWith(mockResumes[0].id);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ resume: mockResumes[0] });
    });

    it("should return a 404 status code if the resume is not found", async () => {
      (resumeRepository.findById as jest.Mock).mockResolvedValue(null);

      mockRequest = {
        params: { id: "non-existent-id" },
      };

      await fetchResumeById(mockRequest as Request, mockResponse as Response);

      expect(resumeRepository.findById).toHaveBeenCalledWith("non-existent-id");
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).not.toHaveBeenCalled();
    });

    it("should not call the repository or send a response if ID is missing", async () => {
      mockRequest = {
        params: {},
      };

      await fetchResumeById(mockRequest as Request, mockResponse as Response);

      expect(resumeRepository.findById).not.toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });
});
