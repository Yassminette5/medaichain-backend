"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicationRequest = exports.RequestedMedication = exports.Patient = exports.RequestStatus = void 0;
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["TOUT"] = "tout";
    RequestStatus["URGENT"] = "urgent";
    RequestStatus["EN_ATTENTE"] = "enAttente";
    RequestStatus["VALIDE"] = "valide";
    RequestStatus["NON_VALIDE"] = "nonValide";
    RequestStatus["TERMINE"] = "termine";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
class Patient {
    id;
    name;
    phoneNumber;
}
exports.Patient = Patient;
class RequestedMedication {
    id;
    name;
    dosage;
    quantity;
    unit;
    isValidated;
    validationNote;
}
exports.RequestedMedication = RequestedMedication;
class MedicationRequest {
    id;
    pharmacyId;
    patient;
    medications;
    status;
    requestDate;
    isUrgent;
    prescriptionImageUrl;
    doctorName;
    validationNote;
    deliveryConfirmedAt;
    createdAt;
    updatedAt;
    constructor(partial) {
        Object.assign(this, partial);
    }
}
exports.MedicationRequest = MedicationRequest;
//# sourceMappingURL=medication-request.entity.js.map