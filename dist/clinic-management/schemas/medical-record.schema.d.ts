import { Document, Types } from 'mongoose';
export type MedicalRecordDocument = MedicalRecord & Document;
export declare enum RecordType {
    CONSULTATION = "consultation",
    ANALYSE = "analyse",
    CHIRURGIE = "chirurgie",
    URGENCE = "urgence",
    SUIVI = "suivi",
    VACCINATION = "vaccination"
}
export declare class VitalSigns {
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
    oxygenSaturation: number;
    bloodSugar: number;
}
export declare class Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}
export declare class MedicalRecord {
    clinicId: Types.ObjectId;
    patientId: Types.ObjectId;
    doctorId: Types.ObjectId;
    appointmentId: Types.ObjectId;
    type: RecordType;
    date: Date;
    chiefComplaint: string;
    symptoms: string[];
    physicalExamination: string;
    diagnosis: string;
    differentialDiagnosis: string[];
    vitalSigns: VitalSigns;
    prescription: Medication[];
    labTestsRequested: string[];
    labResults: string;
    imagingRequested: string[];
    imagingResults: string;
    attachments: string[];
    followUpDate: Date;
    followUpNotes: string;
    doctorNotes: string;
    patientName: string;
    doctorName: string;
}
export declare const MedicalRecordSchema: import("mongoose").Schema<MedicalRecord, import("mongoose").Model<MedicalRecord, any, any, any, Document<unknown, any, MedicalRecord, any, {}> & MedicalRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MedicalRecord, Document<unknown, {}, import("mongoose").FlatRecord<MedicalRecord>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MedicalRecord> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
