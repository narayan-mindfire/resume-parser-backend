import express from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  getMe,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  deleteMe,
  editMe,
} from "../controllers/auth.controller";
import { upload } from "../middlewares/upload.middleware";

const authRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user profile routes
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     description: Registers a new user. Accepts multipart/form-data for profile image upload.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fname
 *               - lname
 *               - email
 *               - password
 *             properties:
 *               fname:
 *                 type: string
 *                 example: John
 *               lname:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: MyPassword123
 *               confirmPassword:
 *                 type: string
 *                 example: MyPassword123
 *               bio:
 *                 type: string
 *                 example: I'm a passionate home cook.
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Email already exists or validation error
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     description: Authenticates a user and returns JWT tokens in HTTP-only cookies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: MyPassword123
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       400:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: No refresh token provided
 *       400:
 *         description: Invalid or expired refresh token
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Auth]
 *     description: Clears refresh and access tokens from cookies
 *     responses:
 *       200:
 *         description: User logged out
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     description: Returns the authenticated user's profile (requires accessToken cookie)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /auth/me:
 *   delete:
 *     summary: Delete the current user account
 *     tags: [Auth]
 *     description: Deletes the user account associated with the current session
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: User deleted
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/me:
 *   put:
 *     summary: Update the current user's profile
 *     tags: [Auth]
 *     description: Updates user fields including profile image. Accepts multipart/form-data.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fname:
 *                 type: string
 *                 example: Jane
 *               lname:
 *                 type: string
 *                 example: Smith
 *               bio:
 *                 type: string
 *                 example: Updated bio content
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Validation or update failure
 */

authRouter.post("/register", upload.single("profileImage"), registerUser);

authRouter.post("/login", loginUser);

authRouter.post("/refresh-token", refreshToken);

authRouter.post("/logout", logoutUser);

authRouter.get("/me", protect, getMe);

authRouter.delete("/me", protect, deleteMe);

authRouter.put("/me", upload.single("profileImage"), protect, editMe);
export default authRouter;
