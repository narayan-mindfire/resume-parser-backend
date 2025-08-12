import jwt from "jsonwebtoken";

/**
 * Generates an access token for the given user ID.
 * @param userId - The user ID to encode.
 * @returns A JWT access token (expires in 5 days).
 */
export function generateAccessToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "5d",
  });
}

/**
 * Generates a refresh token for the given user ID.
 * @param userId - The user ID to encode.
 * @returns A JWT refresh token (expires in 7 days).
 */
export function generateRefreshToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });
}

/**
 * Verifies and decodes a refresh token.
 * @param token - The refresh token to verify.
 * @returns The user ID if valid, or null if invalid/expired.
 */
export function verifyRefreshToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
    };
    return decoded.userId;
  } catch {
    return null;
  }
}
