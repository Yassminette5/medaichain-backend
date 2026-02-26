import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';
import { LabProfile, LabProfileSchema } from './schemas/lab-profile.schema';
import { AnalysisResult, AnalysisResultSchema } from './schemas/analysis-result.schema';
import { AnalysisResultsService } from './analysis-results.service';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: LabProfile.name, schema: LabProfileSchema },
            { name: AnalysisResult.name, schema: AnalysisResultSchema },
        ]),
        UsersModule,
    ],
    controllers: [LabController],
    providers: [LabService, AnalysisResultsService],
    exports: [LabService, AnalysisResultsService],
})
export class LabModule { }
