import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Clinique modules
import { ClinicManagementModule } from './clinic-management/clinic-management.module';

// Patient modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PatientModule } from './patient/patient.module';
import { MedicinesModule } from './medicines/medicines.module';

// Fedibenman modules (Pharmacie, Delivery, Notifications)
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { DeliveryModule } from './delivery/delivery.module';
import { NotificationModule } from './notifications/notification.module';

// Lab module (Centre d'analyse)
import { LabModule } from './lab/lab.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Auth used by Clinic
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'votre-secret-jwt-super-secure-changez-moi',
      signOptions: { expiresIn: '7d' },
    }),

    // Modules
    ClinicManagementModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    PatientModule,
    MedicinesModule,
    PharmacyModule,
    DeliveryModule,
    NotificationModule,
    LabModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
