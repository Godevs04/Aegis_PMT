import { User, IUser } from './user.model';

export class UserRepository {
  /**
   * Find user by ID.
   */
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  /**
   * Find user by Email (includes password field for auth verification).
   */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+password');
  }

  /**
   * Find user by Email (does not include password).
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  /**
   * Find user by Verification Token.
   */
  async findByVerificationToken(token: string): Promise<IUser | null> {
    return User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() },
    });
  }

  /**
   * Find user by Password Reset Token.
   */
  async findByResetToken(token: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
  }

  /**
   * Create a new user.
   */
  async create(userData: Partial<IUser>): Promise<IUser> {
    return User.create(userData);
  }

  /**
   * Save a user document.
   */
  async save(user: IUser): Promise<IUser> {
    return user.save();
  }
}

export default UserRepository;
