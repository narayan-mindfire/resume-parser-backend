import { Request, Response } from "express";
import { fetchAllResumes } from "../../services/resumes.service";
import { getAllResumes } from "../../controllers/resume.controller";

jest.mock("../../services/resumes.service");

const mockFetchAllResumes = fetchAllResumes as jest.Mock;

describe("getAllResumes", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockStatus = jest.fn(() => ({ json: mockJson }));

    mockResponse = {
      status: mockStatus,
    };
    mockRequest = {};
  });

  test("should call the service and return a 200 status", async () => {
    await getAllResumes(
      mockRequest as Request,
      mockResponse as Response,
      jest.fn(),
    );

    expect(mockFetchAllResumes).toHaveBeenCalledWith(mockRequest, mockResponse);
  });
});
