import {
	BadRequestException,
	Controller,
	HttpException,
	HttpStatus,
	Post,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
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
		if (!file?.buffer?.length) {
			throw new BadRequestException('Fichier manquant ou vide (champ multipart: file)');
		}
		const userId: string | undefined = req?.user?.userId ?? req?.user?.sub;
		try {
			return await this.ocrMlService.analyzeBuffer(
				file.buffer,
				file.originalname || 'document',
				userId,
			);
		} catch (e: any) {
			const msg = e?.message ?? String(e);
			throw new HttpException(
				{
					message: 'Service OCR indisponible ou erreur Flask',
					detail: msg,
				},
				HttpStatus.BAD_GATEWAY,
			);
		}
	}
}

