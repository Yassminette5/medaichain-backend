import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OcrMlService } from './ocr-ml.service';

@Controller('ml')
export class OcrMlController {
	constructor(private readonly ocrMlService: OcrMlService) {}

	// Même style que /patient/ocr/upload, mais proxifié vers Flask OCR
	@UseGuards(JwtAuthGuard)
	@Post('ocr-analyze')
	@UseInterceptors(FileInterceptor('file'))
	async analyze(@UploadedFile() file: Express.Multer.File, @Req() req) {
		const userId: string | undefined = req?.user?.userId ?? req?.user?.sub;
		const result = await this.ocrMlService.analyzeBuffer(
			file.buffer,
			file.originalname || 'document',
			userId,
		);
		return result;
	}
}

