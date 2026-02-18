import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const generateSecureOTP = (): string => {
    return crypto.randomInt(100000, 999999).toString();
};

export const hashValue = async (value: string): Promise<string> => {
    return bcrypt.hash(value, 10);
};

export const verifyHash = async (value: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(value, hash);
};
