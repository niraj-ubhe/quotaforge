import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../errors";

import jwt from "jsonwebtoken";
import { isDemoEmail } from "../config/demo";
import { ensureDemoData, ensureDemoUser } from "./demo.service";

const toPublicUser = (user: {
  id: string;
  name: string;
  email: string;
  createdAt?: Date;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  isDemo: isDemoEmail(user.email),
});

const issueToken = (userId: string) =>
  jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    },
  );

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (isDemoEmail(data.email)) {
    throw new BadRequestError("This email is reserved for the demo account");
  }

  if (existingUser) {
    throw new BadRequestError("Email already exists");
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user with hashed password
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
};

export const loginUser = async (data: { email: string; password: string }) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  // User not found
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Compare entered password with stored hash
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return {
    token: issueToken(user.id),
    user: toPublicUser(user),
  };
};

export const loginDemoUser = async () => {
  const user = await ensureDemoUser();
  await ensureDemoData(user.id);

  return {
    token: issueToken(user.id),
    user: toPublicUser(user),
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return toPublicUser(user);
};
