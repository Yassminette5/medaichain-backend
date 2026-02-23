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
exports.UpdateCalendarEventDto = exports.CreateCalendarEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const calendar_event_schema_1 = require("../schemas/calendar-event.schema");
class CreateCalendarEventDto {
}
exports.CreateCalendarEventDto = CreateCalendarEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Titre de l\'événement' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description / notes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date et heure de début (ISO 8601)' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "dateTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date et heure de fin (ISO 8601)' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: calendar_event_schema_1.EventType, description: 'Type d\'événement' }),
    (0, class_validator_1.IsEnum)(calendar_event_schema_1.EventType),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: calendar_event_schema_1.AlertOption, description: 'Alerte avant l\'événement' }),
    (0, class_validator_1.IsEnum)(calendar_event_schema_1.AlertOption),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "alertBefore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nom du patient' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "patientName", void 0);
class UpdateCalendarEventDto {
}
exports.UpdateCalendarEventDto = UpdateCalendarEventDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "dateTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: calendar_event_schema_1.EventType }),
    (0, class_validator_1.IsEnum)(calendar_event_schema_1.EventType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: calendar_event_schema_1.AlertOption }),
    (0, class_validator_1.IsEnum)(calendar_event_schema_1.AlertOption),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "alertBefore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "patientName", void 0);
//# sourceMappingURL=calendar-event.dto.js.map