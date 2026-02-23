"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const prescriptions_controller_1 = require("./prescriptions.controller");
const prescriptions_service_1 = require("./prescriptions.service");
const prescription_schema_1 = require("./schemas/prescription.schema");
const notifications_module_1 = require("../notifications/notifications.module");
let PrescriptionsModule = class PrescriptionsModule {
};
exports.PrescriptionsModule = PrescriptionsModule;
exports.PrescriptionsModule = PrescriptionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: prescription_schema_1.Prescription.name, schema: prescription_schema_1.PrescriptionSchema },
            ]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [prescriptions_controller_1.PrescriptionsController],
        providers: [prescriptions_service_1.PrescriptionsService],
        exports: [prescriptions_service_1.PrescriptionsService],
    })
], PrescriptionsModule);
//# sourceMappingURL=prescriptions.module.js.map