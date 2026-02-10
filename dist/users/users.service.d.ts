import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    findById(id: string): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findByPhone(phone: string): Promise<UserDocument | null>;
    create(userData: Partial<User>): Promise<UserDocument>;
    update(id: string, userData: Partial<User>): Promise<UserDocument>;
    updateLastLogin(id: string): Promise<void>;
    setResetPasswordToken(userId: string, token: string, expires: Date): Promise<void>;
    findByResetToken(token: string): Promise<UserDocument | null>;
    clearResetToken(userId: string): Promise<void>;
    markProfileCompleted(userId: string): Promise<void>;
}
