import { OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';
export declare class SeedService implements OnModuleInit {
    private usersService;
    constructor(usersService: UsersService);
    onModuleInit(): Promise<void>;
    private createTestUsers;
}
