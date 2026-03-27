import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ProfilesService } from '../profiles/profiles.service';
import { UserRole } from '../users/schemas/user.schema';
import { Gender } from '../profiles/schemas/patient_information.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private usersService: UsersService,
    private profilesService: ProfilesService,
  ) {}

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
        fullName: 'Admin User',
      },
      {
        email: 'pharmacy@test.com',
        password: 'password123',
        phone: '+213555000002',
        role: UserRole.PHARMACIE,
        fullName: 'Test Pharmacy',
      },
      {
        email: 'doctor@test.com',
        password: 'password123',
        phone: '+213555000003',
        role: UserRole.MEDECIN,
        fullName: 'Dr. Test Doctor',
      },
      {
        email: 'patient@test.com',
        password: 'password123',
        phone: '+213555000004',
        role: UserRole.PATIENT,
        fullName: 'Test Patient',
      },
    ];

    for (const userData of testUsers) {
      try {
        const existingUser = await this.usersService.findByEmail(
          userData.email,
        );

        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(userData.password, 10);

          const user = await this.usersService.create({
            email: userData.email,
            password: hashedPassword,
            phone: userData.phone,
            fullName: userData.fullName,
            role: userData.role,
            isProfileCompleted: true,
            isEmailVerified: true,
          });

          console.log(`✅ Test user created: ${userData.email}`);

          // Create profile based on role
          try {
            await this.createProfileForUser(
              user._id.toString(),
              userData.role,
              userData,
            );
            console.log(`✅ Profile created for: ${userData.email}`);
          } catch (profileError) {
            console.error(
              `⚠️ Error creating profile for ${userData.email}:`,
              profileError.message,
            );
          }
        } else {
          console.log(`ℹ️  Test user already exists: ${userData.email}`);
        }
      } catch (error) {
        console.error(
          `❌ Error creating test user ${userData.email}:`,
          error.message,
        );
      }
    }
  }

  private async createProfileForUser(
    userId: string,
    role: UserRole,
    userData: any,
  ) {
    switch (role) {
      case UserRole.PATIENT:
        // Create patient information profile
        await this.profilesService.upsertPatientInformation(userId, {
          fullName: userData.fullName,
          age: 34,
          gender: Gender.MALE,
          allergies: [],
          chronicDiseases: [],
          height: 175,
          weight: 70,
        });
        break;

      case UserRole.PHARMACIE:
        // Create pharmacy profile
        await this.profilesService.upsertPharmacyProfile(userId, {
          pharmacyName: 'Test Pharmacy',
          ownerName: userData.fullName,
          licenseNumber: 'LIC-TEST-2024',
          address: '456 Pharmacy Street',
          city: 'Algiers',
          wilaya: 'Algiers',
          postalCode: '16000',
          gpsLatitude: 36.7372,
          gpsLongitude: 3.0869,
          workingDays: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ],
          openingTime: '08:00',
          closingTime: '20:00',
          is24Hours: false,
          hasDelivery: true,
          deliveryRadius: 5,
          deliveryFee: 300,
          services: ['Vaccination', 'Consultation', 'Home Delivery'],
          isVerified: true,
          hasNotifications: true,
        });
        break;

      case UserRole.MEDECIN:
        // Create doctor profile
        await this.profilesService.upsertDoctorProfile(userId, {
          fullName: userData.fullName,
          speciality: 'General Practitioner',
          licenseNumber: 'LIC-DOC-2024',
          city: 'Algiers',
          wilaya: 'Algiers',
          consultationFee: 2000,
          yearsOfExperience: 5,
          isVerified: true,
        });
        break;

      case UserRole.CLINIQUE:
        // Create clinic profile
        await this.profilesService.upsertClinicProfile(userId, {
          clinicName: 'Test Clinic',
          directorName: userData.fullName,
          licenseNumber: 'LIC-CLINIC-2024',
          registrationNumber: 'REG-CLINIC-2024',
          address: '321 Clinic Avenue',
          city: 'Algiers',
          wilaya: 'Algiers',
          isVerified: true,
        });
        break;

      case UserRole.CENTRE_ANALYSE:
        // Create lab profile
        await this.profilesService.upsertLabProfile(userId, {
          centreName: 'Test Analysis Center',
          categorie: [],
          phone: userData.phone,
          email: userData.email,
          localisation: 'Algiers',
          isVerified: true,
        });
        break;

      // Admin doesn't need a profile
      case UserRole.ADMIN:
        break;

      default:
        break;
    }
  }
}
