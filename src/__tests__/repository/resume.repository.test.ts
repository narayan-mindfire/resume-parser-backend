import pool from "../../config/db";
import { UUID } from "crypto";
import {
  ResumeInsert,
  ResumeRepository,
} from "../../repositories/resumeRepository";

// Mock the entire database module to prevent real connections
jest.mock("../../config/db");

const mockPoolQuery = pool.query as jest.Mock;

describe("ResumeRepository", () => {
  // A sample resume to use in our tests
  const sampleResume: ResumeInsert = {
    user_id: 1,
    file_name: "test_resume.pdf",
    file_path: "/path/to/test_resume.pdf",
    file_type: "application/pdf",
    status: "PENDING",
  };

  // A mock resume with an ID, simulating a database result
  const mockDbResult = {
    Id: "d3e0b8a1-1c5c-4f51-b844-0b6c2d7e0f2a" as UUID,
    ...sampleResume,
    uploaded_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    // Clear all mocks before each test to ensure test isolation
    jest.clearAllMocks();
  });

  describe("create", () => {
    test("should successfully create a new resume and return the inserted row", async () => {
      // Arrange: Mock the pool.query to return a successful insert result
      mockPoolQuery.mockResolvedValue({
        rows: [mockDbResult],
      });

      // Act: Call the create method with the sample resume
      const result = await ResumeRepository.create(sampleResume);

      // Assert: Check that pool.query was called correctly and the result matches the mock
      expect(mockPoolQuery).toHaveBeenCalledWith(expect.any(String), [
        sampleResume.user_id,
        sampleResume.file_name,
        sampleResume.file_path,
        sampleResume.file_type,
        "PENDING",
      ]);
      expect(result).toEqual(mockDbResult);
    });

    test("should use the default PENDING status if not provided", async () => {
      // Arrange: Mock the pool.query
      mockPoolQuery.mockResolvedValue({
        rows: [mockDbResult],
      });
      const resumeWithoutStatus = { ...sampleResume, status: undefined };

      // Act: Call the create method with the resume that lacks a status
      await ResumeRepository.create(resumeWithoutStatus);

      // Assert: Check if the query values correctly include "PENDING"
      expect(mockPoolQuery).toHaveBeenCalledWith(expect.any(String), [
        resumeWithoutStatus.user_id,
        resumeWithoutStatus.file_name,
        resumeWithoutStatus.file_path,
        resumeWithoutStatus.file_type,
        "PENDING", // Should default to this value
      ]);
    });
  });

  describe("findById", () => {
    test("should find and return a resume by ID", async () => {
      // Arrange: Mock the pool.query to return a single row
      mockPoolQuery.mockResolvedValue({
        rows: [mockDbResult],
      });

      // Act: Call the findById method with a mock ID
      const result = await ResumeRepository.findById(mockDbResult.Id);

      // Assert: Check that pool.query was called with the correct ID and returned the right row
      expect(mockPoolQuery).toHaveBeenCalledWith(expect.any(String), [
        mockDbResult.Id,
      ]);
      expect(result).toEqual(mockDbResult);
    });

    test("should return undefined if no resume is found", async () => {
      // Arrange: Mock the pool.query to return no rows
      mockPoolQuery.mockResolvedValue({
        rows: [],
      });

      // Act: Call the findById method with an ID that won't match
      const result = await ResumeRepository.findById("non-existent-id" as UUID);

      // Assert: Check that the result is undefined
      expect(result).toBeUndefined();
    });
  });

  describe("findAll", () => {
    test("should return all resumes in the database", async () => {
      // Arrange: Mock the pool.query to return an array of resumes
      const mockResumes = [
        mockDbResult,
        {
          ...mockDbResult,
          Id: "another-mock-id" as UUID,
          file_name: "another_file.doc",
        },
      ];
      mockPoolQuery.mockResolvedValue({
        rows: mockResumes,
      });

      // Act: Call the findAll method
      const result = await ResumeRepository.findAll();

      // Assert: Check that the query was called and all mock resumes are returned
      expect(mockPoolQuery).toHaveBeenCalledWith(expect.any(String));
      expect(result).toEqual(mockResumes);
    });
  });
});
