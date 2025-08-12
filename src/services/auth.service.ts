import bcrypt from "bcrypt";
import { authRepository } from "../repositories/auth.repository";
import { User } from "../../generated/prisma";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

class AuthService {
  private async checkUserPresence(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async register(data: Omit<User, "id" | "createdAt" | "updatedAt">) {
    const existing = await authRepository.findByEmail(data.email);
    if (existing) {
      throw new Error("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await authRepository.create({
      ...data,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken(user.id.toString());
    const refreshToken = generateRefreshToken(user.id.toString());

    return { user, accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error("Invalid credentials");
    }
    const accessToken = generateAccessToken(user.id.toString());
    const refreshToken = generateRefreshToken(user.id.toString());

    return { user, accessToken, refreshToken };
  }

  async refresh(token: string) {
    const userId = verifyRefreshToken(token);
    if (!userId) {
      throw new Error("Invalid or expired refresh token");
    }

    const accessToken = generateAccessToken(userId);
    return { accessToken };
  }

  async me(userId: string) {
    const user = await this.checkUserPresence(userId);
    const { password: _password, ...rest } = user;
    return rest;
  }

  async deleteMe(userId: string) {
    await this.checkUserPresence(userId);
    await authRepository.deleteMe(userId);
  }

  async editMe(userId: string, newUser: Partial<User>) {
    await this.checkUserPresence(userId);
    const updatedUser = await authRepository.editMe(userId, newUser);

    if (!updatedUser) {
      throw new Error("Failed to update user");
    }
    const { password: _password, ...rest } = updatedUser;
    return rest;
  }
}

export const authService = new AuthService();
