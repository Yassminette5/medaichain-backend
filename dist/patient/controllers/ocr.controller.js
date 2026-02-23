"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const ocr_service_1 = require("../services/ocr.service");
const ocr_dto_1 = require("../dto/ocr.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
let OcrController = class OcrController {
    ocrService;
    constructor(ocrService) {
        this.ocrService = ocrService;
    }
    async uploadDocument(file, req) {
        try {
            if (!file) {
                throw new common_1.HttpException('No file uploaded', common_1.HttpStatus.BAD_REQUEST);
            }
            const userId = req.user?.userId;
            if (!userId) {
                throw new common_1.HttpException('User ID not found in token', common_1.HttpStatus.UNAUTHORIZED);
            }
            const extractedData = await this.ocrService.analyzeImage('./uploads', file.filename);
            return {
                message: 'Document analyzed successfully',
                data: {
                    ...extractedData,
                    filename: file.filename,
                    userId: userId,
                },
            };
        }
        catch (error) {
            console.error('Error uploading document:', error);
            throw new common_1.HttpException(error.message || 'Error processing document', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async saveDocument(body, req) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new common_1.HttpException('User ID not found in token', common_1.HttpStatus.UNAUTHORIZED);
            }
            const { filename, ...extractedData } = body;
            if (!filename) {
                throw new common_1.HttpException('Filename is required', common_1.HttpStatus.BAD_REQUEST);
            }
            const savedData = await this.ocrService.saveExtractedData(extractedData, userId, filename);
            return {
                message: 'Document saved successfully',
                data: savedData,
            };
        }
        catch (error) {
            console.error('Error saving document:', error);
            throw new common_1.HttpException(error.message || 'Error saving document', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllDocuments(req) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new common_1.HttpException('User ID not found in token', common_1.HttpStatus.UNAUTHORIZED);
            }
            const documents = await this.ocrService.findAllByUserId(userId);
            return {
                message: 'Documents retrieved successfully',
                data: documents,
            };
        }
        catch (error) {
            console.error('Error retrieving documents:', error);
            throw new common_1.HttpException('Error retrieving documents', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getDocumentDetail(id) {
        try {
            const document = await this.ocrService.getImageDetail(id);
            return {
                message: 'Document retrieved successfully',
                data: document,
            };
        }
        catch (error) {
            console.error('Error retrieving document:', error);
            throw new common_1.HttpException('Error retrieving document', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async deleteDocuments(deleteDto) {
        try {
            const deletedCount = await this.ocrService.deleteImages(deleteDto.ids);
            return {
                message: `${deletedCount} document(s) deleted successfully`,
                deletedCount,
            };
        }
        catch (error) {
            console.error('Error deleting documents:', error);
            throw new common_1.HttpException('Error deleting documents', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async exportToPdf(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new common_1.HttpException('User ID not found in token', common_1.HttpStatus.UNAUTHORIZED);
            }
            await this.ocrService.generatePDFFromOCRData(userId, res);
        }
        catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).send('Error generating PDF');
        }
    }
};
exports.OcrController = OcrController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join('');
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
                return cb(new common_1.HttpException('Only image and PDF files are allowed!', common_1.HttpStatus.BAD_REQUEST), false);
            }
            cb(null, true);
        },
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OcrController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Post)('save'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OcrController.prototype, "saveDocument", null);
__decorate([
    (0, common_1.Get)('documents'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OcrController.prototype, "getAllDocuments", null);
__decorate([
    (0, common_1.Get)('documents/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OcrController.prototype, "getDocumentDetail", null);
__decorate([
    (0, common_1.Delete)('documents'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ocr_dto_1.DeleteDocumentsDto]),
    __metadata("design:returntype", Promise)
], OcrController.prototype, "deleteDocuments", null);
__decorate([
    (0, common_1.Get)('export-pdf'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OcrController.prototype, "exportToPdf", null);
exports.OcrController = OcrController = __decorate([
    (0, common_1.Controller)('patient/ocr'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ocr_service_1.OcrService])
], OcrController);
//# sourceMappingURL=ocr.controller.js.map