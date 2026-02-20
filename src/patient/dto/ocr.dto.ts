import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class UploadDocumentDto {
    @IsString()
    @IsNotEmpty()
    userId: string;
}

export class DeleteDocumentsDto {
    @IsArray()
    @IsNotEmpty()
    ids: string[];
}

export class OcrResponseDto {
    id: string;
    userId: string;
    title: string;
    image_name: string;
    description?: string;
    extractedData: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
