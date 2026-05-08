import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';
import { LabProfile, LabProfileSchema } from './schemas/lab-profile.schema';
import { AnalysisResult, AnalysisResultSchema } from './schemas/analysis-result.schema';
import { AnalysisResultsService } from './analysis-results.service';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AccessRequestsModule } from '../access-requests/access-requests.module';
import { NftModule } from '../nft/nft.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: LabProfile.name, schema: LabProfileSchema },
            { name: AnalysisResult.name, schema: AnalysisResultSchema },
        ]),
        UsersModule,
        ProfilesModule,
        AccessRequestsModule,
        NftModule,
        NotificationModule,
    ],
    controllers: [LabController],
    providers: [LabService, AnalysisResultsService],
    exports: [LabService, AnalysisResultsService],
})
export class LabModule { }
