import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../config';
import { User } from '../db/models';

// Types
export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Constants
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a password with a hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT tokens (access and refresh)
 */
export const generateTokens = (payload: TokenPayload): AuthTokens => {
  const accessToken = jwt.sign(
    payload, 
    config.auth.jwtSecret as jwt.Secret, 
    {
      expiresIn: config.auth.jwtExpiration,
    } as SignOptions
  );

  const refreshToken = jwt.sign(
    payload, 
    config.auth.refreshTokenSecret as jwt.Secret, 
    {
      expiresIn: config.auth.refreshTokenExpiration,
    } as SignOptions
  );

  return { accessToken, refreshToken };
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string, isRefreshToken = false): TokenPayload => {
  try {
    const secret = isRefreshToken ? config.auth.refreshTokenSecret : config.auth.jwtSecret;
    const decoded = jwt.verify(token, secret as jwt.Secret);
    return decoded as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Create a new user
 */
export const createUser = async (username: string, password: string, role = 'user'): Promise<any> => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      role,
    });

    return {
      id: user._id,
      username: user.username,
      role: user.role,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Find user by credentials
 */
export const findUserByCredentials = async (username: string, password: string): Promise<any> => {
  try {
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return {
      id: user._id,
      username: user.username,
      role: user.role,
    };
  } catch (error) {
    throw error;
  }
};