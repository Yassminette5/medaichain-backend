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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
let UsersService = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async findById(id) {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return user;
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email }).exec();
    }
    async findByPhone(phone) {
        return this.userModel.findOne({ phone }).exec();
    }
    async create(userData) {
        const user = new this.userModel(userData);
        return user.save();
    }
    async update(id, userData) {
        const user = await this.userModel
            .findByIdAndUpdate(id, userData, { new: true })
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return user;
    }
    async updateLastLogin(id) {
        await this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() }).exec();
    }
    async setResetPasswordToken(userId, token, expires) {
        await this.userModel.findByIdAndUpdate(userId, {
            resetPasswordToken: token,
            resetPasswordExpires: expires,
        }).exec();
    }
    async findByResetToken(token) {
        return this.userModel.findOne({ resetPasswordToken: token }).exec();
    }
    async clearResetToken(userId) {
        await this.userModel.findByIdAndUpdate(userId, {
            resetPasswordToken: null,
            resetPasswordExpires: null,
        }).exec();
    }
    async markProfileCompleted(userId) {
        await this.userModel.findByIdAndUpdate(userId, { isProfileCompleted: true }).exec();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map