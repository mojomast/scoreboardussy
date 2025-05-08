import authRoutes from './routes';
import { authenticate, authorize } from './middleware';
import {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyToken,
  createUser,
  findUserByCredentials,
} from './utils';
import { setupInitialAdmin } from './setup';

export {
  authRoutes,
  authenticate,
  authorize,
  hashPassword,
  comparePassword,
  generateTokens,
  verifyToken,
  createUser,
  findUserByCredentials,
  setupInitialAdmin,
};