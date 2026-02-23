"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceSchema = exports.Invoice = exports.InsuranceDetails = exports.InvoiceItem = exports.PaymentMethod = exports.PaymentStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["PARTIAL"] = "partial";
    PaymentStatus["CANCELLED"] = "cancelled";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["CARD"] = "card";
    PaymentMethod["INSURANCE"] = "insurance";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["CHEQUE"] = "cheque";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
let InvoiceItem = class InvoiceItem {
    label;
    quantity;
    unitPrice;
    total;
};
exports.InvoiceItem = InvoiceItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], InvoiceItem.prototype, "label", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], InvoiceItem.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], InvoiceItem.prototype, "unitPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], InvoiceItem.prototype, "total", void 0);
exports.InvoiceItem = InvoiceItem = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], InvoiceItem);
let InsuranceDetails = class InsuranceDetails {
    provider;
    policyNumber;
    coveragePercentage;
    amountCovered;
};
exports.InsuranceDetails = InsuranceDetails;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], InsuranceDetails.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], InsuranceDetails.prototype, "policyNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], InsuranceDetails.prototype, "coveragePercentage", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], InsuranceDetails.prototype, "amountCovered", void 0);
exports.InsuranceDetails = InsuranceDetails = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], InsuranceDetails);
let Invoice = class Invoice {
    invoiceNumber;
    clinicId;
    patientId;
    doctorId;
    appointmentId;
    medicalRecordId;
    date;
    items;
    subtotal;
    discount;
    discountPercentage;
    tax;
    totalAmount;
    amountPaid;
    amountDue;
    paymentStatus;
    paymentMethod;
    paidAt;
    insuranceDetails;
    patientName;
    doctorName;
    notes;
};
exports.Invoice = Invoice;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Invoice.prototype, "invoiceNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Clinic', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Invoice.prototype, "clinicId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Invoice.prototype, "patientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Invoice.prototype, "doctorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Appointment' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Invoice.prototype, "appointmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'MedicalRecord' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Invoice.prototype, "medicalRecordId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Invoice.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [InvoiceItem], default: [] }),
    __metadata("design:type", Array)
], Invoice.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Invoice.prototype, "subtotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Invoice.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Invoice.prototype, "discountPercentage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Invoice.prototype, "tax", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Invoice.prototype, "totalAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Invoice.prototype, "amountPaid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Invoice.prototype, "amountDue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: PaymentStatus, default: PaymentStatus.PENDING }),
    __metadata("design:type", String)
], Invoice.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: PaymentMethod }),
    __metadata("design:type", String)
], Invoice.prototype, "paymentMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Invoice.prototype, "paidAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: InsuranceDetails }),
    __metadata("design:type", InsuranceDetails)
], Invoice.prototype, "insuranceDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Invoice.prototype, "patientName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Invoice.prototype, "doctorName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Invoice.prototype, "notes", void 0);
exports.Invoice = Invoice = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Invoice);
exports.InvoiceSchema = mongoose_1.SchemaFactory.createForClass(Invoice);
exports.InvoiceSchema.index({ clinicId: 1, date: -1 });
exports.InvoiceSchema.index({ clinicId: 1, paymentStatus: 1 });
exports.InvoiceSchema.index({ patientId: 1, date: -1 });
exports.InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
//# sourceMappingURL=invoice.schema.js.map