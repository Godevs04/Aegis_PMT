import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import UserRepository from '../users/user.repository';
import AppError from '../../shared/utils/appError';
import { IUser } from '../users/user.model';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../emails/mail.service';
import { UserRole } from '../../config/roles';

interface TokenPayload {
  userId: string;
  role: string;
  tokenVersion: number;
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Helper: Generate Access Token
   */
  generateAccessToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'dev_jwt_access_secret_key',
      { expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '15m') as any }
    );
  }

  /**
   * Helper: Generate Refresh Token
   */
  generateRefreshToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_key',
      { expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || '30d') as any }
    );
  }

  /**
   * Register a new user and send verification email.
   */
  async register(name: string, email: string, password: string): Promise<IUser> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email address is already in use', 400);
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Note: The first registered user could optionally be SUPER_ADMIN, but for this SaaS platform
    // we default to Developer and let them promote / invite later, or Organization Owner if workspace is built.
    const user = await this.userRepository.create({
      name,
      email,
      password,
      role: UserRole.DEVELOPER,
      isVerified: false,
      verificationToken,
      verificationExpires,
    });

    // Send verification email asynchronously
    sendVerificationEmail(user.email, verificationToken);

    return user;
  }

  /**
   * Authenticate user with email and password.
   */
  async login(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isVerified) {
      throw new AppError('Please verify your email address before logging in', 403);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { user, accessToken, refreshToken };
  }

  /**
   * Verify User email using verification token.
   */
  async verifyEmail(token: string): Promise<IUser> {
    const user = await this.userRepository.findByVerificationToken(token);
    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await this.userRepository.save(user);

    return user;
  }

  /**
   * Handle forgot password request.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Return quietly for security reasons to prevent email enumeration
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepository.save(user);

    sendPasswordResetEmail(user.email, resetToken);
  }

  /**
   * Reset User password using reset token.
   */
  async resetPassword(token: string, password: string): Promise<void> {
    const user = await this.userRepository.findByResetToken(token);
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Invalidate existing sessions on password change
    user.tokenVersion += 1;

    await this.userRepository.save(user);
  }

  /**
   * Refresh token rotation flow.
   */
  async refreshTokens(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_key'
      ) as TokenPayload;
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await this.userRepository.findById(decoded.userId);
    if (!user) {
      throw new AppError('User belonging to this token no longer exists', 401);
    }

    // Refresh token rotation: verify token version matches current DB version
    if (decoded.tokenVersion !== user.tokenVersion) {
      // Re-use detected! Mark all sessions invalid as a security compromise mitigation
      user.tokenVersion += 1;
      await this.userRepository.save(user);
      throw new AppError('Token compromise detected. Please sign in again.', 401);
    }

    // Rotate refresh token: increment version, save, and sign new pair
    user.tokenVersion += 1;
    await this.userRepository.save(user);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }
}

export default AuthService;
