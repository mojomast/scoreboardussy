import { createUser } from './utils';
import { config } from '../config';

/**
 * Create an initial admin user if none exists
 */
export const setupInitialAdmin = async (): Promise<void> => {
  try {
    // Check if admin credentials are provided in environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (!adminUsername || !adminPassword) {
      console.log('⚠️ No admin credentials provided in environment variables. Skipping admin setup.');
      return;
    }

    // Create admin user
    console.log(`🔑 Creating initial admin user: ${adminUsername}`);
    await createUser(adminUsername, adminPassword, 'admin');
    console.log('✅ Admin user created successfully');
  } catch (error: any) {
    // If the error is "Username already exists", that's fine
    if (error.message === 'Username already exists') {
      console.log('✅ Admin user already exists');
    } else {
      console.error('❌ Error creating admin user:', error);
    }
  }
};