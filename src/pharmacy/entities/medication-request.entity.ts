export enum RequestStatus {
  TOUT = 'tout',
  URGENT = 'urgent',
  EN_ATTENTE = 'enAttente',
  VALIDE = 'valide',
  NON_VALIDE = 'nonValide',
  TERMINE = 'termine',
}

export class Patient {
  id: string;
  name: string;
  phoneNumber?: string;
}

export class RequestedMedication {
  id: string;
  name: string;
  dosage: string;
  quantity: number;
  unit: string;
  isValidated?: boolean;
  validationNote?: string;
}

export class MedicationRequest {
  id: string;
  pharmacyId: string;
  patient: Patient;
  medications: RequestedMedication[];
  status: RequestStatus;
  requestDate: Date;
  isUrgent: boolean;
  prescriptionImageUrl?: string;
  doctorName?: string;
  validationNote?: string;
  deliveryConfirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<MedicationRequest>) {
    Object.assign(this, partial);
  }
}
