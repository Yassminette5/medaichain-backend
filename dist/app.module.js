"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const clinic_management_module_1 = require("./clinic-management/clinic-management.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const profiles_module_1 = require("./profiles/profiles.module");
const patient_module_1 = require("./patient/patient.module");
const medicines_module_1 = require("./medicines/medicines.module");
const pharmacy_module_1 = require("./pharmacy/pharmacy.module");
const delivery_module_1 = require("./delivery/delivery.module");
const notification_module_1 = require("./notifications/notification.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    uri: configService.get('MONGODB_URI'),
                }),
                inject: [config_1.ConfigService],
            }),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'votre-secret-jwt-super-secure-changez-moi',
                signOptions: { expiresIn: '7d' },
            }),
            clinic_management_module_1.ClinicManagementModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            profiles_module_1.ProfilesModule,
            patient_module_1.PatientModule,
            medicines_module_1.MedicinesModule,
            pharmacy_module_1.PharmacyModule,
            delivery_module_1.DeliveryModule,
            notification_module_1.NotificationModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map