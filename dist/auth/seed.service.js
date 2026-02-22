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
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const user_schema_1 = require("../users/schemas/user.schema");
const bcrypt = require("bcryptjs");
let SeedService = class SeedService {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async onModuleInit() {
        await this.createTestUsers();
    }
    async createTestUsers() {
        const testUsers = [
            {
                email: 'admin@test.com',
                password: 'password123',
                phone: '+213555000001',
                role: user_schema_1.UserRole.ADMIN,
            },
            {
                email: 'pharmacy@test.com',
                password: 'password123',
                phone: '+213555000002',
                role: user_schema_1.UserRole.PHARMACIE,
            },
            {
                email: 'doctor@test.com',
                password: 'password123',
                phone: '+213555000003',
                role: user_schema_1.UserRole.MEDECIN,
            },
        ];
        for (const userData of testUsers) {
            try {
                const existingUser = await this.usersService.findByEmail(userData.email);
                if (!existingUser) {
                    const hashedPassword = await bcrypt.hash(userData.password, 10);
                    await this.usersService.create({
                        email: userData.email,
                        password: hashedPassword,
                        phone: userData.phone,
                        role: userData.role,
                        isProfileCompleted: true,
                        isEmailVerified: true,
                    });
                    console.log(`✅ Test user created: ${userData.email}`);
                }
                else {
                    console.log(`ℹ️  Test user already exists: ${userData.email}`);
                }
            }
            catch (error) {
                console.error(`❌ Error creating test user ${userData.email}:`, error.message);
            }
        }
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], SeedService);
//# sourceMappingURL=seed.service.js.map