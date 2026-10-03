import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends Document, Omit<IUser, '_id'> {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please enter a valid phone number'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password if modified
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if mongoose model already exists (for HMR / reloads)
export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

// In-Memory Repository for seamless fallback and testing
class UserMemoryRepository {
  private users: (IUser & { _id: string; createdAt: Date; updatedAt: Date })[] = [];

  constructor() {
    this.seedDefaultUser();
  }

  private async seedDefaultUser() {
    const demoHashed = await bcrypt.hash('Password123!', 10);
    this.users.push({
      _id: 'user_demo_001',
      name: 'Alex Morgan',
      email: 'demo@taskflow.dev',
      password: demoHashed,
      phone: '+1 555-0199',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async findOne(query: { email?: string; _id?: string }): Promise<any | null> {
    const user = this.users.find((u) => {
      if (query.email && u.email.toLowerCase() === query.email.toLowerCase()) return true;
      if (query._id && u._id === query._id) return true;
      return false;
    });
    if (!user) return null;
    return this.wrapDoc(user);
  }

  async findById(id: string): Promise<any | null> {
    return this.findOne({ _id: id });
  }

  async create(userData: IUser): Promise<any> {
    const existing = await this.findOne({ email: userData.email });
    if (existing) {
      const err: any = new Error('E11000 duplicate key error: email already exists');
      err.code = 11000;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const doc: IUser & { _id: string; createdAt: Date; updatedAt: Date } = {
      _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      phone: userData.phone || '',
      role: userData.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(doc);
    return this.wrapDoc(doc);
  }

  async countDocuments(): Promise<number> {
    return this.users.length;
  }

  private wrapDoc(raw: IUser & { _id: string; createdAt: Date; updatedAt: Date }) {
    return {
      ...raw,
      toObject: () => ({ ...raw }),
      toJSON: () => {
        const { password, ...rest } = raw;
        return rest;
      },
      comparePassword: async (candidate: string) => {
        return bcrypt.compare(candidate, raw.password);
      },
    };
  }
}

export const userMemoryRepo = new UserMemoryRepository();
