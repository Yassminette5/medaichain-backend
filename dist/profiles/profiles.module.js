"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const profiles_service_1 = require("./profiles.service");
const profiles_controller_1 = require("./profiles.controller");
const doctor_profile_schema_1 = require("./schemas/doctor-profile.schema");
const patient_profile_schema_1 = require("./schemas/patient-profile.schema");
const pharmacy_profile_schema_1 = require("./schemas/pharmacy-profile.schema");
const lab_profile_schema_1 = require("./schemas/lab-profile.schema");
const clinic_profile_schema_1 = require("./schemas/clinic-profile.schema");
const users_module_1 = require("../users/users.module");
const auth_module_1 = require("../auth/auth.module");
let ProfilesModule = class ProfilesModule {
};
exports.ProfilesModule = ProfilesModule;
exports.ProfilesModule = ProfilesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: doctor_profile_schema_1.DoctorProfile.name, schema: doctor_profile_schema_1.DoctorProfileSchema },
                { name: patient_profile_schema_1.PatientProfile.name, schema: patient_profile_schema_1.PatientProfileSchema },
                { name: pharmacy_profile_schema_1.PharmacyProfile.name, schema: pharmacy_profile_schema_1.PharmacyProfileSchema },
                { name: lab_profile_schema_1.LabProfile.name, schema: lab_profile_schema_1.LabProfileSchema },
                { name: clinic_profile_schema_1.ClinicProfile.name, schema: clinic_profile_schema_1.ClinicProfileSchema },
            ]),
            users_module_1.UsersModule,
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
        ],
        controllers: [profiles_controller_1.ProfilesController],
        providers: [profiles_service_1.ProfilesService],
        exports: [profiles_service_1.ProfilesService],
    })
], ProfilesModule);
//# sourceMappingURL=profiles.module.js.map