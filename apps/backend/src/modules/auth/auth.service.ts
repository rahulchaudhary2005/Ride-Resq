import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db";
import { env } from "../../config/env";
import { ApiError } from "../../utils/errors";

interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: "CUSTOMER" | "MECHANIC";
}

function signTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
  const refreshToken = jwt.sign({ sub: userId, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { phone: input.phone }] },
    });
    if (existing) throw ApiError.conflict("Email or phone already registered");

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: input.role,
        ...(input.role === "MECHANIC" && {
          mechanicProfile: { create: {} },
        }),
      },
    });

    const tokens = signTokens(user.id, user.role);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return { user: sanitizeUser(user), ...tokens };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.unauthorized("Invalid credentials");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized("Invalid credentials");

    if (!user.isActive) throw ApiError.forbidden("Account has been deactivated");

    const tokens = signTokens(user.id, user.role);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return { user: sanitizeUser(user), ...tokens };
  },

  async refresh(refreshToken: string) {
    let payload: { sub: string; role: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as typeof payload;
    } catch {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized("Refresh token expired or revoked");
    }

    const tokens = signTokens(payload.sub, payload.role);

    // Rotate: revoke old, persist new
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    await this.persistRefreshToken(payload.sub, tokens.refreshToken);

    return tokens;
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  },

  async persistRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // matches JWT_REFRESH_EXPIRES_IN default

    await prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  },
};

function sanitizeUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash, ...rest } = user;
  return rest;
}
