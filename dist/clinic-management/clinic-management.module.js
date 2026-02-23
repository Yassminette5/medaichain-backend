"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicManagementModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const clinic_management_controller_1 = require("./clinic-management.controller");
const clinic_management_service_1 = require("./clinic-management.service");
const clinic_schema_1 = require("./schemas/clinic.schema");
const clinic_doctor_schema_1 = require("./schemas/clinic-doctor.schema");
const appointment_schema_1 = require("./schemas/appointment.schema");
const admission_schema_1 = require("./schemas/admission.schema");
const medical_record_schema_1 = require("./schemas/medical-record.schema");
const invoice_schema_1 = require("./schemas/invoice.schema");
const user_schema_1 = require("../users/schemas/user.schema");
let ClinicManagementModule = class ClinicManagementModule {
};
exports.ClinicManagementModule = ClinicManagementModule;
exports.ClinicManagementModule = ClinicManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: clinic_schema_1.Clinic.name, schema: clinic_schema_1.ClinicSchema },
                { name: clinic_doctor_schema_1.ClinicDoctor.name, schema: clinic_doctor_schema_1.ClinicDoctorSchema },
                { name: appointment_schema_1.Appointment.name, schema: appointment_schema_1.AppointmentSchema },
                { name: admission_schema_1.Admission.name, schema: admission_schema_1.AdmissionSchema },
                { name: medical_record_schema_1.MedicalRecord.name, schema: medical_record_schema_1.MedicalRecordSchema },
                { name: invoice_schema_1.Invoice.name, schema: invoice_schema_1.InvoiceSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
        ],
        controllers: [clinic_management_controller_1.ClinicManagementController],
        providers: [clinic_management_service_1.ClinicManagementService],
        exports: [clinic_management_service_1.ClinicManagementService],
    })
], ClinicManagementModule);
//# sourceMappingURL=clinic-management.module.js.map