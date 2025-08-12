import bcrypt from "bcrypt";
import { authService } from "../../services/auth.service";
import { authRepository } from "../../repositories/auth.repository";
import * as jwtUtils from "../../utils/jwt";

jest.mock("../../repositories/auth.repository");
jest.mock("bcrypt");
jest.mock("../../utils/jwt");

const mockUser = {
  id: "user123",
  fname: "Narayan",
  lname: "Pradhan",
  email: "narayan@example.com",
  password: "hashedpass",
  toObject: () => ({
    fname: "Narayan",
    lname: "Pradhan",
    email: "narayan@example.com",
  }),
};

describe("AuthService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user", async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpass");
      (authRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue(
        "access-token",
      );
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue(
        "refresh-token",
      );

      const result = await authService.register({
        fname: "Narayan",
        lname: "Pradhan",
        email: "narayan@example.com",
        password: "1234",
        bio: null,
        profileImage: null,
      });

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.user.email).toBe("narayan@example.com");
    });

    it("should throw if email exists", async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      await expect(
        authService.register({
          fname: "N",
          lname: "P",
          email: mockUser.email,
          password: "123",
          bio: null,
          profileImage: null,
        }),
      ).rejects.toThrow("Email already in use");
    });
  });

  describe("login", () => {
    it("should login a user", async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue(
        "access-token",
      );
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue(
        "refresh-token",
      );

      const result = await authService.login(mockUser.email, "1234");

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.user.email).toBe(mockUser.email);
    });

    it("should throw if email not found", async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      await expect(authService.login("no@mail.com", "pass")).rejects.toThrow(
        "Invalid credentials",
      );
    });

    it("should throw if password is incorrect", async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        authService.login(mockUser.email, "wrongpass"),
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("refresh", () => {
    it("should refresh access token", async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue("user123");
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue(
        "access-token",
      );

      const result = await authService.refresh("refresh-token");
      expect(result.accessToken).toBe("access-token");
    });

    it("should throw if token is invalid", async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(null);
      await expect(authService.refresh("bad-token")).rejects.toThrow(
        "Invalid or expired refresh token",
      );
    });
  });

  describe("me", () => {
    it("should return user data without password", async () => {
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      const result = await authService.me("user123");
      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty("password");
    });
  });

  describe("editMe", () => {
    it("should update user", async () => {
      const updatedUser = {
        ...mockUser,
        fname: "Updated",
        toObject: () => ({ email: "narayan@example.com", fname: "Updated" }),
      };

      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.editMe as jest.Mock).mockResolvedValue(updatedUser);

      const result = await authService.editMe("user123", { fname: "Updated" });
      expect(result.fname).toBe("Updated");
    });
  });

  describe("deleteMe", () => {
    it("should delete user", async () => {
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.deleteMe as jest.Mock).mockResolvedValue(undefined);

      await expect(authService.deleteMe("user123")).resolves.toBeUndefined();
    });
  });
});
