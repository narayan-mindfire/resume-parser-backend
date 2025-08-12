// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../types/types";
import { User } from "../../generated/prisma";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const imagePath = req.file ? req.file.path : undefined;
    const { user, accessToken, refreshToken } = await authService.register({
      ...body,
      profileImage: imagePath,
    });

    res
      .status(201)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .json({ user, accessToken });
  } catch (error: unknown) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

/**
 * @desc    Login a user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(
      req.body.email,
      req.body.password,
    );
    res
      .status(200)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .json({ user, accessToken });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Something went wrong" });
    }
  }
};

/**
 * @desc    Refresh access token using refresh token
 * @route   GET /api/auth/refresh
 * @access  Public (with cookie)
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token)
      return res.status(401).json({ message: "No refresh token provided" });

    const { accessToken } = await authService.refresh(token);
    res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .end();
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Something went wrong" });
    }
  }
};

/**
 * @desc    Logout the current user
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = async (_req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  res.status(200).json({ message: "Logged out successfully" });
};

/**
 * @desc    Get current authenticated user details
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await authService.me((req as AuthRequest).user.id);
    res.status(200).json(user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Something went wrong" });
    }
  }
};

/**
 * @desc    Delete current user account
 * @route   DELETE /api/auth/me
 * @access  Private
 */
export const deleteMe = async (req: Request, res: Response) => {
  try {
    await authService.deleteMe((req as AuthRequest).user.id);
    res.status(204).end();
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Something went wrong" });
    }
  }
};

/**
 * @desc    Edit profile of the current user
 * @route   PUT /api/auth/me
 * @access  Private
 */
export const editMe = async (req: Request, res: Response) => {
  try {
    // You no longer need Zod for schema parsing here. Prisma handles it.
    // The request body can be directly passed to the service.
    // Ensure you're handling the file upload path correctly.

    const updateData: Partial<User> = {
      ...req.body,
    };

    if (req.file?.path) {
      updateData.profileImage = req.file.path;
    }

    const updatedUser = await authService.editMe(
      (req as AuthRequest).user.id,
      updateData,
    );

    res.status(200).json({ user: updatedUser });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Something went wrong" });
    }
  }
};
