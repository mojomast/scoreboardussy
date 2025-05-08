import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../config';
import { User } from '../db/entities';
import { AppDataSource } from '../db/connection';

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
    // Get the user repository
    const userRepository = AppDataSource.getRepository(User);
    
    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User();
    user.username = username;
    user.password = hashedPassword;
    user.role = role as 'admin' | 'user';
    
    // Save user
    const savedUser = await userRepository.save(user);

    return {
      id: savedUser._id,
      username: savedUser.username,
      role: savedUser.role,
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
    // Get the user repository
    const userRepository = AppDataSource.getRepository(User);
    
    // Find user
    const user = await userRepository.findOne({ where: { username } });
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