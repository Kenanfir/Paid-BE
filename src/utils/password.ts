import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param password The plain password to hash
 * @returns The hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verify if a plain password matches a hashed password
 * @param plainPassword The plain password to verify
 * @param hashedPassword The hashed password to compare against
 * @returns True if the passwords match, false otherwise
 */
export const verifyPassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

/**
 * Alias for verifyPassword for backwards compatibility
 */
export const comparePassword = verifyPassword;
