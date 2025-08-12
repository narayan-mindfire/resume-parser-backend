import { Request, Response } from "express";
import { matchJobController } from "../../controllers/job.controller";
import { matchJobService } from "../../services/jobs.service";

jest.mock("../../services/jobs.service");

jest.mock("../../config/redisClient", () => ({
  default: {},
}));

jest.mock("../../queues/jobMatchingQueue", () => ({
  jobMatchingQueue: {
    add: jest.fn(),
  },
}));

const mockMatchJobService = matchJobService as jest.Mock;

describe("matchJobController", () => {
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

  test("should return 200 with a trackingKey on successful match", async () => {
    mockMatchJobService.mockResolvedValue({
      trackingKey: "test-tracking-key-123",
    });
    mockRequest.query = { jobId: "job1", resumeId: "resume1" };

    await matchJobController(mockRequest as Request, mockResponse as Response);

    expect(mockMatchJobService).toHaveBeenCalledWith("job1", "resume1");
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      trackingKey: "test-tracking-key-123",
    });
  });

  test("should return 400 if the service throws an error", async () => {
    const errorMessage = "Service failed to queue the job.";
    mockMatchJobService.mockRejectedValue(new Error(errorMessage));
    mockRequest.query = { jobId: "job1", resumeId: "resume1" };

    await matchJobController(mockRequest as Request, mockResponse as Response);

    expect(mockMatchJobService).toHaveBeenCalledWith("job1", "resume1");
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
  });
});
