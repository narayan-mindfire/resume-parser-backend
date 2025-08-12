import { Request, Response, NextFunction } from "express";
import { authService } from "../../services/auth.service";
import { AuthRequest } from "../../types/types";
import { User } from "../../../generated/prisma";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  deleteMe,
  editMe,
} from "../../controllers/auth.controller";

// Mock the authService to isolate the controller logic
jest.mock("../../services/auth.service", () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    me: jest.fn(),
    deleteMe: jest.fn(),
    editMe: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe("Auth Controller", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let mockCookie: jest.Mock;
  let mockClearCookie: jest.Mock;
  let mockEnd: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockEnd = jest.fn();
    mockClearCookie = jest.fn();

    // Chain the response methods
    mockCookie = jest.fn(() => ({
      json: mockJson,
      end: mockEnd,
      cookie: mockCookie,
    }));

    mockStatus = jest.fn(() => ({
      json: mockJson,
      end: mockEnd,
      cookie: mockCookie,
    }));

    mockResponse = {
      status: mockStatus,
      cookie: mockCookie,
      clearCookie: mockClearCookie,
      end: mockEnd,
    };

    mockRequest = {};
  });

  describe("registerUser", () => {
    test("should register a new user and return 201 with tokens on success", async () => {
      const mockUser = {
        id: "test-uuid-1",
        fname: "Test",
        lname: "User",
        email: "test@example.com",
        password: "hashedpassword",
      } as User;
      const mockTokens = {
        user: mockUser,
        accessToken: "mockAccessToken",
        refreshToken: "mockRefreshToken",
      };

      mockAuthService.register.mockResolvedValue(mockTokens);
      mockRequest.body = { ...mockUser };
      mockRequest.file = { path: "uploads/image.jpg" } as Express.Multer.File;

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.register).toHaveBeenCalledWith({
        ...mockUser,
        profileImage: "uploads/image.jpg",
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockCookie).toHaveBeenCalledTimes(2);
      expect(mockCookie).toHaveBeenCalledWith(
        "refreshToken",
        "mockRefreshToken",
        expect.any(Object),
      );
      expect(mockCookie).toHaveBeenCalledWith(
        "accessToken",
        "mockAccessToken",
        expect.any(Object),
      );
      expect(mockJson).toHaveBeenCalledWith({
        user: mockUser,
        accessToken: "mockAccessToken",
      });
    });

    test("should return 400 on registration failure", async () => {
      const errorMessage = "Email already in use";
      mockAuthService.register.mockRejectedValue(new Error(errorMessage));
      mockRequest.body = { email: "existing@example.com" };

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe("loginUser", () => {
    test("should log in a user and return 200 with tokens on success", async () => {
      const mockUser = {
        id: "test-uuid-2",
        email: "test@example.com",
      } as User;
      const mockTokens = {
        user: mockUser,
        accessToken: "mockAccessToken",
        refreshToken: "mockRefreshToken",
      };

      mockAuthService.login.mockResolvedValue(mockTokens);
      mockRequest.body = { email: "test@example.com", password: "password123" };

      await loginUser(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockCookie).toHaveBeenCalledTimes(2);
      expect(mockJson).toHaveBeenCalledWith({
        user: mockUser,
        accessToken: "mockAccessToken",
      });
    });

    test("should return 400 on login failure", async () => {
      const errorMessage = "Invalid credentials";
      mockAuthService.login.mockRejectedValue(new Error(errorMessage));
      mockRequest.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      await loginUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe("refreshToken", () => {
    test("should refresh token and return 200 with new accessToken cookie on success", async () => {
      const mockAccessToken = "newMockAccessToken";
      mockAuthService.refresh.mockResolvedValue({
        accessToken: mockAccessToken,
      });
      mockRequest.cookies = { refreshToken: "mockRefreshToken" };

      await refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.refresh).toHaveBeenCalledWith("mockRefreshToken");
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockCookie).toHaveBeenCalledWith(
        "accessToken",
        mockAccessToken,
        expect.any(Object),
      );
      expect(mockEnd).toHaveBeenCalled();
    });

    test("should return 401 if no refresh token is provided", async () => {
      mockRequest.cookies = {};

      await refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.refresh).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        message: "No refresh token provided",
      });
    });
  });

  describe("logoutUser", () => {
    test("should clear cookies and return 200 on success", async () => {
      await logoutUser(mockRequest as Request, mockResponse as Response);

      expect(mockClearCookie).toHaveBeenCalledWith("refreshToken");
      expect(mockClearCookie).toHaveBeenCalledWith("accessToken");
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Logged out successfully",
      });
    });
  });

  describe("getMe", () => {
    test("should return user details on success", async () => {
      const mockUser = { id: "test-uuid-3", email: "me@example.com" } as Omit<
        User,
        "password"
      >;
      mockAuthService.me.mockResolvedValue(mockUser);
      mockRequest.user = { id: "test-uuid-3" };

      await getMe(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockAuthService.me).toHaveBeenCalledWith("test-uuid-3");
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockUser);
    });

    test("should return 400 if user not found", async () => {
      const errorMessage = "User not found";
      mockAuthService.me.mockRejectedValue(new Error(errorMessage));
      mockRequest.user = { id: "invalid-uuid" };

      await getMe(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe("deleteMe", () => {
    test("should delete user and return 204 on success", async () => {
      mockAuthService.deleteMe.mockResolvedValue();
      mockRequest.user = { id: "test-uuid-4" };

      await deleteMe(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockAuthService.deleteMe).toHaveBeenCalledWith("test-uuid-4");
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockEnd).toHaveBeenCalled();
    });

    test("should return 400 on deletion failure", async () => {
      const errorMessage = "User not found";
      mockAuthService.deleteMe.mockRejectedValue(new Error(errorMessage));
      mockRequest.user = { id: "invalid-uuid" };

      await deleteMe(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe("editMe", () => {
    test("should edit user profile and return 200 on success", async () => {
      const mockUpdatedUser = {
        id: "test-uuid-5",
        fname: "Updated",
        lname: "User",
      } as Omit<User, "password">;
      const updateData = { fname: "Updated" };
      mockAuthService.editMe.mockResolvedValue(mockUpdatedUser);
      mockRequest.user = { id: "test-uuid-5" };
      mockRequest.body = updateData;

      await editMe(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockAuthService.editMe).toHaveBeenCalledWith(
        "test-uuid-5",
        updateData,
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ user: mockUpdatedUser });
    });

    test("should handle file upload and edit user profile on success", async () => {
      const mockUpdatedUser = {
        id: "test-uuid-6",
        fname: "File",
        profileImage: "uploads/new_image.jpg",
      } as Omit<User, "password">;
      const updateData = { fname: "File" };
      mockAuthService.editMe.mockResolvedValue(mockUpdatedUser);
      mockRequest.user = { id: "test-uuid-6" };
      mockRequest.body = updateData;
      mockRequest.file = {
        path: "uploads/new_image.jpg",
      } as Express.Multer.File;

      await editMe(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockAuthService.editMe).toHaveBeenCalledWith("test-uuid-6", {
        ...updateData,
        profileImage: "uploads/new_image.jpg",
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ user: mockUpdatedUser });
    });

    test("should return 400 on edit failure", async () => {
      const errorMessage = "Failed to update user";
      mockAuthService.editMe.mockRejectedValue(new Error(errorMessage));
      mockRequest.user = { id: "invalid-uuid" };
      mockRequest.body = { fname: "Invalid" };

      await editMe(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: errorMessage });
    });
  });
});
