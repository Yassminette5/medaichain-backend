import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PatientModule } from './patient/patient.module';
import { MedicinesModule } from './medicines/medicines.module';
import { AiModule } from './ai/ai.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // MongoDB
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI'),
            }),
            inject: [ConfigService],
        }),

        // Modules
        AuthModule,
        UsersModule,
        ProfilesModule,
        PatientModule,
        MedicinesModule,
        AiModule,
    ],
})
export class AppModule { }
