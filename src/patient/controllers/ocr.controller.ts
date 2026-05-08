import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    Req,
    Res,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { OcrService } from '../services/ocr.service';
import { DeleteDocumentsDto } from '../dto/ocr.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('patient/ocr')
@UseGuards(JwtAuthGuard)
export class OcrController {
    constructor(private readonly ocrService: OcrService) { }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
                    return cb(
                        new HttpException(
                            'Only image and PDF files are allowed!',
                            HttpStatus.BAD_REQUEST,
                        ),
                        false,
                    );
                }
                cb(null, true);
            },
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
            },
        }),
    )
    async uploadDocument(@UploadedFile() file: Express.Multer.File, @Req() req) {
        try {
            if (!file) {
                throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
            }

            const userId = req.user?.userId;
            if (!userId) {
                throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
            }

            // Analyze the image using OCR (preview mode - no save)
            const extractedData = await this.ocrService.analyzeImage(
                './uploads',
                file.filename,
            );

            return {
                message: 'Document analyzed successfully',
                data: {
                    ...extractedData,
                    filename: file.filename,
                    userId: userId,
                },
            };
        } catch (error) {
            console.error('Error uploading document:', error);
            throw new HttpException(
                error.message || 'Error processing document',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('upload-raw')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
                    return cb(
                        new HttpException(
                            'Only image and PDF files are allowed!',
                            HttpStatus.BAD_REQUEST,
                        ),
                        false,
                    );
                }
                cb(null, true);
            },
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
            },
        }),
    )
    async uploadDocumentRaw(@UploadedFile() file: Express.Multer.File, @Req() req) {
        try {
            if (!file) {
                throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
            }

            const userId = req.user?.userId;
            if (!userId) {
                throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
            }

            // Return the uploaded file details without OCR analysis
            return {
                message: 'Document uploaded successfully',
                data: {
                    filename: file.filename,
                    userId: userId,
                },
            };
        } catch (error) {
            console.error('Error uploading raw document:', error);
            throw new HttpException(
                error.message || 'Error processing document',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('save')
    async saveDocument(@Body() body: any, @Req() req) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
            }

            const { filename, ...extractedData } = body;

            if (!filename) {
                throw new HttpException('Filename is required', HttpStatus.BAD_REQUEST);
            }

            // Save the extracted data
            const savedData = await this.ocrService.saveExtractedData(
                extractedData,
                userId,
                filename,
            );

            return {
                message: 'Document saved successfully',
                data: savedData,
            };
        } catch (error) {
            console.error('Error saving document:', error);
            throw new HttpException(
                error.message || 'Error saving document',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('save-after-upload')
    async saveAfterUpload(@Body() body: any, @Req() req) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
            }

            const uploadData = body.uploadData || body;
            const documentCategory = body.documentCategory || 'lab_analysis';
            const titleOverride = body.titleOverride;

            // Extract filename from uploadData
            const filename = uploadData.filename
                || uploadData.image_name
                || uploadData.originalName
                || `doc-${Date.now()}.jpg`;

            // Build extracted data for saving
            const extractedFields: Record<string, any> = {
                title: titleOverride || uploadData.title || 'Document Médical',
                description: uploadData.description || '',
                documentCategory,
            };

            // Merge details if present
            if (uploadData.details) {
                extractedFields.details = uploadData.details;
            }

            const savedData = await this.ocrService.saveExtractedData(
                extractedFields,
                userId,
                filename,
            );

            return {
                message: 'Document saved successfully',
                data: savedData,
            };
        } catch (error) {
            console.error('Error saving document (save-after-upload):', error);
            throw new HttpException(
                error.message || 'Error saving document',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('documents')
    async getAllDocuments(@Req() req) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
            }
            const documents = await this.ocrService.findAllByUserId(userId);
            return {
                message: 'Documents retrieved successfully',
                data: documents,
            };
        } catch (error) {
            console.error('Error retrieving documents:', error);
            throw new HttpException(
                'Error retrieving documents',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('documents/:id')
    async getDocumentDetail(@Param('id') id: string) {
        try {
            const document = await this.ocrService.getImageDetail(id);
            return {
                message: 'Document retrieved successfully',
                data: document,
            };
        } catch (error) {
            console.error('Error retrieving document:', error);
            throw new HttpException(
                'Error retrieving document',
                HttpStatus.NOT_FOUND,
            );
        }
    }

    @Delete('documents')
    async deleteDocuments(@Body() deleteDto: DeleteDocumentsDto) {
        try {
            const deletedCount = await this.ocrService.deleteImages(deleteDto.ids);
            return {
                message: `${deletedCount} document(s) deleted successfully`,
                deletedCount,
            };
        } catch (error) {
            console.error('Error deleting documents:', error);
            throw new HttpException(
                'Error deleting documents',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('export-pdf')
    async exportToPdf(@Req() req, @Res() res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
            }
            await this.ocrService.generatePDFFromOCRData(userId, res);
        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).send('Error generating PDF');
        }
    }
}
