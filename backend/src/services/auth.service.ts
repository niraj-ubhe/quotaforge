import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../errors";

import jwt from "jsonwebtoken";

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

  // Generate JWT
  const token = jwt.sign(
    {
      userId: user.id,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
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

  return user;
};
