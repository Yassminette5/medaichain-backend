import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MedicalRecordDocument = MedicalRecord & Document;

export enum RecordType {
    CONSULTATION = 'consultation',
    ANALYSE = 'analyse',
    CHIRURGIE = 'chirurgie',
    URGENCE = 'urgence',
    SUIVI = 'suivi',
    VACCINATION = 'vaccination',
}

@Schema({ _id: false })
export class VitalSigns {
    @Prop()
    bloodPressureSystolic: number; // mmHg

    @Prop()
    bloodPressureDiastolic: number; // mmHg

    @Prop()
    heartRate: number; // bpm

    @Prop()
    temperature: number; // °C

    @Prop()
    weight: number; // kg

    @Prop()
    height: number; // cm

    @Prop()
    oxygenSaturation: number; // %

    @Prop()
    bloodSugar: number; // g/L
}

@Schema({ _id: false })
export class Medication {
    @Prop({ required: true })
    name: string; // Nom du médicament

    @Prop()
    dosage: string; // "500mg"

    @Prop()
    frequency: string; // "3 fois par jour"

    @Prop()
    duration: string; // "7 jours"

    @Prop()
    instructions: string; // "Après les repas"
}

@Schema({ timestamps: true })
export class MedicalRecord {
    @Prop({ type: Types.ObjectId, ref: 'Clinic', required: false })
    clinicId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    patientId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    doctorId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Appointment' })
    appointmentId: Types.ObjectId; // Lié au RDV si applicable

    @Prop({ enum: RecordType, default: RecordType.CONSULTATION })
    type: RecordType;

    @Prop({ required: true })
    date: Date;

    // Informations cliniques
    @Prop()
    chiefComplaint: string; // Motif principal de consultation

    @Prop([String])
    symptoms: string[]; // Liste des symptômes

    @Prop()
    physicalExamination: string; // Examen physique

    @Prop()
    diagnosis: string; // Diagnostic

    @Prop([String])
    differentialDiagnosis: string[]; // Diagnostics différentiels

    // Signes vitaux
    @Prop({ type: VitalSigns })
    vitalSigns: VitalSigns;

    // Prescription / Ordonnance
    @Prop({ type: [Medication], default: [] })
    prescription: Medication[];

    // Analyses demandées
    @Prop([String])
    labTestsRequested: string[]; // Analyses demandées

    @Prop()
    labResults: string; // Résultats des analyses

    // Imagerie
    @Prop([String])
    imagingRequested: string[]; // Radio, IRM, Scanner...

    @Prop()
    imagingResults: string;

    // Fichiers joints
    @Prop([String])
    attachments: string[]; // URLs des fichiers (images, PDF)

    // Suivi
    @Prop()
    followUpDate: Date; // Date de prochain RDV

    @Prop()
    followUpNotes: string; // Instructions de suivi

    // IA - Prédiction d'Adhérence au traitement
    @Prop()
    adherenceRiskScore: number; // Probabilité en %

    @Prop()
    adherenceRiskStatus: string; // "RISQUE_FAIBLE" ou "RISQUE_ELEVÉ_ABANDON"

    @Prop({ default: false })
    requiresFollowUpCall: boolean; // Si True, déclenche une tâche pour la clinique

    @Prop([String])
    riskFactors: string[]; // Ex: ["Âge avancé", "3 comorbidités"]

    @Prop()
    aiRecommendation: string; // Recommandation IA personnalisée

    @Prop()
    aiConfidence: number; // Confiance du modèle en %

    @Prop()
    lastAiAnalysisDate: Date;

    // Notes
    @Prop()
    doctorNotes: string; // Notes privées du médecin

    @Prop()
    patientName: string; // Dénormalisé pour affichage rapide

    @Prop()
    doctorName: string; // Dénormalisé pour affichage rapide
}

export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord);

// Indexes pour performance
MedicalRecordSchema.index({ clinicId: 1, patientId: 1, date: -1 });
MedicalRecordSchema.index({ clinicId: 1, doctorId: 1, date: -1 });
MedicalRecordSchema.index({ patientId: 1, date: -1 });
