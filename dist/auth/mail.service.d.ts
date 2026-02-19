import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    sendPasswordResetEmail(email: string, code: string): Promise<void>;
    sendInvitationEmail(email: string, role: string, inviteToken: string): Promise<void>;
    sendCredentialsEmail(email: string, password: string, role: string): Promise<void>;
}
