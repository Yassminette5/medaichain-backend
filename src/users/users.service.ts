import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async onModuleInit() {
        await this.seedAdmin();
    }

    async seedAdmin() {
        const adminEmail = 'admin@medaichain.com';
        const adminExists = await this.userModel.findOne({ email: adminEmail }).exec();
        if (!adminExists) {
            console.log('Seeding admin user...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await this.userModel.create({
                email: adminEmail,
                password: hashedPassword,
                phone: '00000000',
                role: UserRole.ADMIN,
                isProfileCompleted: true,
                isEmailVerified: true,
            });
            console.log('Admin user created: admin@medaichain.com / admin123');
        }
    }

    async getStats() {
        const totalUsers = await this.userModel.countDocuments().exec();
        const byRole = await this.userModel.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]).exec();

        // Format stats mapping
        const stats = {
            total: totalUsers,
            medecin: 0,
            patient: 0,
            pharmacie: 0,
            centre_analyse: 0,
            clinique: 0,
            admin: 0
        };

        byRole.forEach(item => {
            if (stats.hasOwnProperty(item._id)) {
                stats[item._id] = item.count;
            }
        });

        return stats;
    }

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

    async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, {
            fcmToken,
            fcmTokenUpdatedAt: new Date(),
        }).exec();
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

    async findAll(): Promise<UserDocument[]> {
        return this.userModel.find().sort({ createdAt: -1 }).exec();
    }

    async markProfileCompleted(userId: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, { isProfileCompleted: true }).exec();
    }

    async toggleActive(id: string): Promise<UserDocument> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }
        user.isActive = !user.isActive;
        return user.save();
    }

    async deleteUser(id: string): Promise<{ message: string }> {
        const result = await this.userModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Utilisateur non trouvé');
        }
        return { message: 'Utilisateur supprimé avec succès' };
    }

    async findAllByRole(role: UserRole): Promise<UserDocument[]> {
        return this.userModel.find({ role }).sort({ fullName: 1 }).exec();
    }
}
