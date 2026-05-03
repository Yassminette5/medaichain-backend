import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ProfilesService } from '../profiles/profiles.service';
import { UserRole } from '../users/schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class SeedService implements OnModuleInit {
    constructor(
        private usersService: UsersService,
        private profilesService: ProfilesService,
        private walletService: WalletService,
    ) {}

    async onModuleInit() {
        await this.createTestUsers();
        await this.createTestPharmacyProfile();
        await this.createTestLabProfile();
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
            {
                email: 'lab@test.com',
                password: 'password123',
                phone: '+213555000004',
                role: UserRole.CENTRE_ANALYSE,
            },
        ];

        for (const userData of testUsers) {
            try {
                const existingUser = await this.usersService.findByEmail(userData.email);

                if (!existingUser) {
                    const hashedPassword = await bcrypt.hash(userData.password, 10);
                    const wallet = await this.walletService.createWallet();
                    await this.usersService.create({
                        email: userData.email,
                        password: hashedPassword,
                        phone: userData.phone,
                        role: userData.role,
                        isProfileCompleted: true,
                        isEmailVerified: true,
                        walletAddress: wallet.address,
                        walletChainId: wallet.chainId,
                        walletEncryptedPrivateKey: wallet.encryptedPrivateKey,
                        walletCreatedAt: wallet.createdAt,
                        walletRegistrationTxHash: wallet.walletRegistrationTxHash,
                        walletRegisteredOnChainAt: wallet.walletRegisteredOnChainAt,
                    });
                    console.log(`✅ Test user created: ${userData.email}`);
                } else {
                    console.log(`ℹ️ Test user already exists: ${userData.email}`);
                }
            } catch (error) {
                console.error(`❌ Error creating test user ${userData.email}:`, error.message);
            }
        }
    }

    private async createTestPharmacyProfile() {
        try {
            const pharmacyUser = await this.usersService.findByEmail('pharmacy@test.com');
            if (!pharmacyUser) {
                console.warn('⚠️ Pharmacy user not found, skipping pharmacy profile seeding.');
                return;
            }

            const existingProfile = await this.profilesService.getProfile(
                pharmacyUser._id.toString(),
                UserRole.PHARMACIE,
            );

            if (existingProfile) {
                console.log('ℹ️ Pharmacy profile already exists for pharmacy@test.com');
                return;
            }

            await this.profilesService.upsertPharmacyProfile(pharmacyUser._id.toString(), {
                pharmacyName: 'Pharmacie Demo Medaichain',
                ownerName: 'Pharmacie Demo',
                licenseNumber: 'PHARM-0001',
                address: '123 Rue de la Santé',
                city: 'Alger',
                wilaya: 'Alger',
                postalCode: '16000',
                gpsLatitude: 36.7538,
                gpsLongitude: 3.0588,
                workingDays: [
                    'Lundi',
                    'Mardi',
                    'Mercredi',
                    'Jeudi',
                    'Vendredi',
                    'Samedi',
                ],
                openingTime: '08:00',
                closingTime: '20:00',
                is24Hours: false,
                hasDelivery: true,
                deliveryRadius: 10,
                deliveryFee: 250,
                services: ['Médicaments génériques', 'Conseils pharmaceutiques', 'Livraison à domicile'],
                profilePhoto: '',
                isVerified: true,
                verifiedAt: new Date(),
            });

            console.log('✅ Pharmacy profile seeded for pharmacy@test.com');
        } catch (error) {
            console.error('❌ Error seeding pharmacy profile:', error.message || error);
        }
    }

    private async createTestLabProfile() {
        try {
            const labUser = await this.usersService.findByEmail('lab@test.com');
            if (!labUser) {
                console.warn('⚠️ Lab user not found, skipping lab profile seeding.');
                return;
            }

            const existingProfile = await this.profilesService.getProfile(
                labUser._id.toString(),
                UserRole.CENTRE_ANALYSE,
            );

            if (existingProfile) {
                console.log('ℹ️ Lab profile already exists for lab@test.com');
                return;
            }

            await this.profilesService.upsertLabProfile(labUser._id.toString(), {
                centreName: 'Centre d\'Analyse Medaichain Demo',
                categorie: ['Biologie', 'Radiologie', 'Imagerie'],
                phone: '+213555000004',
                email: 'lab@test.com',
                localisation: 'Alger, Algérie',
                profilePhoto: '',
                isVerified: true,
                verifiedAt: new Date(),
                isActive: true,
                openingHours: {
                    lundi: { open: '08:00', close: '18:00', isOpen: true },
                    mardi: { open: '08:00', close: '18:00', isOpen: true },
                    mercredi: { open: '08:00', close: '18:00', isOpen: true },
                    jeudi: { open: '08:00', close: '18:00', isOpen: true },
                    vendredi: { open: '08:00', close: '18:00', isOpen: true },
                    samedi: { open: '09:00', close: '13:00', isOpen: true },
                    dimanche: { open: '00:00', close: '00:00', isOpen: false },
                },
            });

            console.log('✅ Lab profile seeded for lab@test.com');
        } catch (error) {
            console.error('❌ Error seeding lab profile:', error.message || error);
        }
    }
}
