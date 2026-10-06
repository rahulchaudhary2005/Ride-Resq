import bcrypt from "bcryptjs";
import { createHmac, randomInt } from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db";
import { env } from "../../config/env";
import { redis } from "../../config/redis";
import { ApiError } from "../../utils/errors";
import { logger } from "../../utils/logger";

const OTP_TTL_SECONDS = 5 * 60;
const OTP_MAX_ATTEMPTS = 5;

const verifyOtpScript = `
  local storedHash = redis.call("HGET", KEYS[1], "hash")
  if not storedHash then return -1 end
  if storedHash == ARGV[1] then
    redis.call("DEL", KEYS[1])
    return 1
  end
  local attempts = redis.call("HINCRBY", KEYS[1], "attempts", 1)
  if attempts >= tonumber(ARGV[2]) then
    redis.call("DEL", KEYS[1])
    return -2
  end
  return 0
`;

interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: "CUSTOMER" | "MECHANIC";
  phoneVerificationToken: string;
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
  async startPhoneOtp(phone: string) {
    const mobileNumber = getFast2SmsMobileNumber(phone);
    const apiKey = getFast2SmsApiKey();
    const code = randomInt(100_000, 1_000_000).toString();
    const key = getOtpRedisKey(phone);

    try {
      await redis.eval(
        `redis.call("HSET", KEYS[1], "hash", ARGV[1], "attempts", 0)
         redis.call("EXPIRE", KEYS[1], tonumber(ARGV[2]))
         return 1`,
        1,
        key,
        hashOtp(phone, code),
        OTP_TTL_SECONDS,
      );
    } catch (error) {
      logger.error("Unable to store phone verification code", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      throw ApiError.internal("Unable to start phone verification. Please try again.");
    }

    try {
      await requestFast2SmsOtp(apiKey, mobileNumber, code);
    } catch (error) {
      try {
        await redis.del(key);
      } catch (cleanupError) {
        logger.error("Unable to remove an unsent phone verification code", {
          errorName: cleanupError instanceof Error ? cleanupError.name : "UnknownError",
        });
      }
      throw error;
    }
    return true;
  },

  async verifyPhoneOtp(phone: string, code: string) {
    getFast2SmsMobileNumber(phone);
    let result: number;
    try {
      result = Number(await redis.eval(
        verifyOtpScript,
        1,
        getOtpRedisKey(phone),
        hashOtp(phone, code),
        OTP_MAX_ATTEMPTS,
      ));
    } catch (error) {
      logger.error("Unable to verify phone verification code", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      throw ApiError.internal("Unable to verify the code right now. Please try again.");
    }

    if (result !== 1) {
      throw ApiError.unauthorized("The verification code is invalid or expired");
    }
    return jwt.sign({ phone, purpose: "phone-verification" }, env.JWT_ACCESS_SECRET, { expiresIn: "10m" });
  },

  async register(input: RegisterInput) {
    let verification: { phone?: string; purpose?: string };
    try {
      verification = jwt.verify(input.phoneVerificationToken, env.JWT_ACCESS_SECRET) as typeof verification;
    } catch {
      throw ApiError.unauthorized("Verify your phone before creating an account");
    }
    if (verification.phone !== input.phone || verification.purpose !== "phone-verification") {
      throw ApiError.unauthorized("Phone verification does not match this account");
    }

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
        isPhoneVerified: true,
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

function getFast2SmsApiKey() {
  if (!env.FAST2SMS_API_KEY) {
    throw ApiError.internal("Phone verification is not configured. Set FAST2SMS_API_KEY in the backend environment.");
  }
  return env.FAST2SMS_API_KEY;
}

function getFast2SmsMobileNumber(phone: string) {
  const match = /^\+91([6-9]\d{9})$/.exec(phone);
  if (!match) {
    throw ApiError.badRequest("Fast2SMS phone verification supports Indian mobile numbers in +91 format only.");
  }
  return match[1];
}

function getOtpRedisKey(phone: string) {
  const phoneHash = createHmac("sha256", env.JWT_ACCESS_SECRET).update(phone).digest("hex");
  return `phone-otp:${phoneHash}`;
}

function hashOtp(phone: string, code: string) {
  return createHmac("sha256", env.JWT_ACCESS_SECRET).update(`${phone}:${code}`).digest("hex");
}

async function requestFast2SmsOtp(apiKey: string, mobileNumber: string, code: string) {
  let response: Response;

  try {
    response = await fetch(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: code,
          flash: 0,
          numbers: mobileNumber,
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch (error) {
    logger.error("Fast2SMS OTP request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    throw ApiError.internal("Unable to reach Fast2SMS. Check the backend internet connection and try again.");
  }

  let payload: { return?: unknown; status_code?: unknown } | undefined;
  try {
    payload = await response.json() as typeof payload;
  } catch {
    // A malformed provider response is handled as a failed SMS request below.
  }

  if (response.ok && payload?.return === true) return;

  const providerCode = typeof payload?.status_code === "number" ? payload.status_code : response.status;
  logger.warn("Fast2SMS rejected an OTP request", {
    status: response.status,
    providerCode,
  });

  if (response.status >= 500) {
    throw ApiError.internal(`Fast2SMS is temporarily unavailable (error ${providerCode}). Try again shortly.`);
  }
  if (response.status === 401 || response.status === 403) {
    throw ApiError.internal(`Fast2SMS rejected the backend API key (error ${providerCode}). Check the Fast2SMS account configuration.`);
  }
  throw ApiError.badRequest(`Fast2SMS could not send the SMS (error ${providerCode}). Check the phone number and Fast2SMS account configuration.`);
}

function sanitizeUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash, ...rest } = user;
  return rest;
}
