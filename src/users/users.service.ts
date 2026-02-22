import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async findById(id: string): Promise<UserDocument> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }
        return user;
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findByPhone(phone: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ phone }).exec();
    }

    async create(userData: Partial<User>): Promise<UserDocument> {
        const user = new this.userModel(userData);
        return user.save();
    }

    async update(id: string, userData: Partial<User>): Promise<UserDocument> {
        const user = await this.userModel
            .findByIdAndUpdate(id, userData, { new: true })
            .exec();
        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }
        return user;
    }

    async updateLastLogin(id: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() }).exec();
    }

    async setResetPasswordToken(userId: string, token: string, expires: Date): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, {
            resetPasswordToken: token,
            resetPasswordExpires: expires,
        }).exec();
    }

    async findByResetToken(token: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ resetPasswordToken: token }).exec();
    }

    async clearResetToken(userId: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, {
            resetPasswordToken: null,
            resetPasswordExpires: null,
        }).exec();
    }

    async markProfileCompleted(userId: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, { isProfileCompleted: true }).exec();
    }
}
