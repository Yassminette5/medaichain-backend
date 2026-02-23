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
exports.CalendarEventSchema = exports.CalendarEvent = exports.AlertOption = exports.EventType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var EventType;
(function (EventType) {
    EventType["CONSULTATION"] = "consultation";
    EventType["OPERATION"] = "operation";
    EventType["NOTE"] = "note";
})(EventType || (exports.EventType = EventType = {}));
var AlertOption;
(function (AlertOption) {
    AlertOption["NONE"] = "none";
    AlertOption["MIN_5"] = "min5";
    AlertOption["MIN_15"] = "min15";
    AlertOption["MIN_30"] = "min30";
    AlertOption["HOUR_1"] = "hour1";
    AlertOption["DAY_1"] = "day1";
})(AlertOption || (exports.AlertOption = AlertOption = {}));
let CalendarEvent = class CalendarEvent {
};
exports.CalendarEvent = CalendarEvent;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], CalendarEvent.prototype, "doctorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CalendarEvent.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], CalendarEvent.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], CalendarEvent.prototype, "dateTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], CalendarEvent.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: EventType, default: EventType.CONSULTATION }),
    __metadata("design:type", String)
], CalendarEvent.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: AlertOption, default: AlertOption.NONE }),
    __metadata("design:type", String)
], CalendarEvent.prototype, "alertBefore", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], CalendarEvent.prototype, "patientName", void 0);
exports.CalendarEvent = CalendarEvent = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], CalendarEvent);
exports.CalendarEventSchema = mongoose_1.SchemaFactory.createForClass(CalendarEvent);
//# sourceMappingURL=calendar-event.schema.js.map