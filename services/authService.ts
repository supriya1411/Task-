import jwt from 'jsonwebtoken';
import { UserModel, userMemoryRepo, IUser } from '../models/User.ts';
import { getDatabaseStatus } from '../config/db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_cognifyz_secret_jwt_key_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export class AuthService {
  private static getRepo() {
    const status = getDatabaseStatus();
    return status.type === 'mongodb' ? UserModel : userMemoryRepo;
  }

  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });
  }

  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  static async register(userData: { name: string; email: string; password: string; phone?: string }) {
    const repo = this.getRepo();

    // Check if user already exists
    const existing = await repo.findOne({ email: userData.email.toLowerCase().trim() });
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    // Create user (hashing is handled by model pre-save hook / repo)
    const user = await repo.create({
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      phone: userData.phone ? userData.phone.trim() : '',
      role: 'user',
    });

    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user',
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async login(credentials: { email: string; password: string }) {
    const repo = this.getRepo();
    const user = await repo.findOne({ email: credentials.email.toLowerCase().trim() });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(credentials.password);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user',
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async findById(userId: string) {
    const repo = this.getRepo();
    const user = await repo.findById(userId);
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
