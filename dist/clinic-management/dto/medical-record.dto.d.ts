import { RecordType } from '../schemas/medical-record.schema';
export declare class VitalSignsDto {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
    bloodSugar?: number;
}
export declare class MedicationDto {
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
}
export declare class CreateMedicalRecordDto {
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    type?: RecordType;
    chiefComplaint?: string;
    symptoms?: string[];
    physicalExamination?: string;
    diagnosis?: string;
    differentialDiagnosis?: string[];
    vitalSigns?: VitalSignsDto;
    prescription?: MedicationDto[];
    labTestsRequested?: string[];
    labResults?: string;
    imagingRequested?: string[];
    imagingResults?: string;
    attachments?: string[];
    followUpDate?: string;
    followUpNotes?: string;
    doctorNotes?: string;
    patientName?: string;
    doctorName?: string;
}
declare const UpdateMedicalRecordDto_base: import("@nestjs/common").Type<Partial<CreateMedicalRecordDto>>;
export declare class UpdateMedicalRecordDto extends UpdateMedicalRecordDto_base {
}
export {};
