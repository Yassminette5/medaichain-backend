export declare class UploadDocumentDto {
    userId: string;
}
export declare class DeleteDocumentsDto {
    ids: string[];
}
export declare class OcrResponseDto {
    id: string;
    userId: string;
    title: string;
    image_name: string;
    description?: string;
    extractedData: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
