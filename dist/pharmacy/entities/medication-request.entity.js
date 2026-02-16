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
}
exports.Patient = Patient;
class RequestedMedication {
}
exports.RequestedMedication = RequestedMedication;
class MedicationRequest {
    constructor(partial) {
        Object.assign(this, partial);
    }
}
exports.MedicationRequest = MedicationRequest;
//# sourceMappingURL=medication-request.entity.js.map