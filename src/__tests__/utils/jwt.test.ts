import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";

process.env.JWT_SECRET = "secret5432";
process.env.JWT_REFRESH_SECRET = "secret1234";

describe("JWT Utilities", () => {
  const userId = "test-user-id";

  describe("generateAccessToken", () => {
    it("should return a valid JWT signed with ACCESS_SECRET", () => {
      const token = generateAccessToken(userId);
      expect(typeof token).toBe("string");

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
      expect(decoded.userId).toBe(userId);
    });
  });

  describe("generateRefreshToken", () => {
    it("should return a valid JWT signed with REFRESH_SECRET", () => {
      const token = generateRefreshToken(userId);
      expect(typeof token).toBe("string");

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
        userId: string;
      };
      expect(decoded.userId).toBe(userId);
    });
  });

  describe("verifyRefreshToken", () => {
    it("should return userId if token is valid", () => {
      const token = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: "1h",
      });
      const result = verifyRefreshToken(token);
      expect(result).toBe(userId);
    });

    it("should return null if token is invalid", () => {
      const invalidToken = "invalid.token.value";
      const result = verifyRefreshToken(invalidToken);
      expect(result).toBeNull();
    });

    it("should return null if token is expired", () => {
      const expiredToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET!,
        {
          expiresIn: "-1s",
        },
      );
      const result = verifyRefreshToken(expiredToken);
      expect(result).toBeNull();
    });
  });
});
