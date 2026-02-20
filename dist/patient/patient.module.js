"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const ocr_service_1 = require("./services/ocr.service");
const ocr_controller_1 = require("./controllers/ocr.controller");
const ocr_entity_1 = require("./entities/ocr.entity");
const auth_module_1 = require("../auth/auth.module");
let PatientModule = class PatientModule {
};
exports.PatientModule = PatientModule;
exports.PatientModule = PatientModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: 'OCRData', schema: ocr_entity_1.OCRDataSchema }]),
            auth_module_1.AuthModule,
        ],
        controllers: [ocr_controller_1.OcrController],
        providers: [ocr_service_1.OcrService],
        exports: [ocr_service_1.OcrService],
    })
], PatientModule);
//# sourceMappingURL=patient.module.js.map