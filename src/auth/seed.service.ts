import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnModuleInit {
    constructor(private usersService: UsersService) {}

    async onModuleInit() {
        await this.createTestUsers();
    }

    private async createTestUsers() {
        const testUsers = [
            {
                email: 'admin@test.com',
                password: 'password123',
                phone: '+213555000001',
                role: UserRole.ADMIN,
            },
            {
                email: 'pharmacy@test.com',
                password: 'password123',
                phone: '+213555000002',
                role: UserRole.PHARMACIE,
            },
            {
                email: 'doctor@test.com',
                password: 'password123',
                phone: '+213555000003',
                role: UserRole.MEDECIN,
            },
        ];

        for (const userData of testUsers) {
            try {
                const existingUser = await this.usersService.findByEmail(userData.email);
                
                if (!existingUser) {
                    const hashedPassword = await bcrypt.hash(userData.password, 10);
                    
                    await this.usersService.create({
                        email: userData.email,
                        password: hashedPassword,
                        phone: userData.phone,
                        role: userData.role,
                        isProfileCompleted: true,
                        isEmailVerified: true,
                    });
                    
                    console.log(`✅ Test user created: ${userData.email}`);
                } else {
                    console.log(`ℹ️  Test user already exists: ${userData.email}`);
                }
            } catch (error) {
                console.error(`❌ Error creating test user ${userData.email}:`, error.message);
            }
        }
    }
}
