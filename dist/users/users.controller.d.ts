import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getStats(): Promise<{
        total: number;
        medecin: number;
        patient: number;
        pharmacie: number;
        centre_analyse: number;
        clinique: number;
        admin: number;
    }>;
    findAll(): Promise<import("./schemas/user.schema").UserDocument[]>;
}
