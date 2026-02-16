import { PharmacyStatistics } from './entities/pharmacy-statistics.entity';
import { MedicationRequestService } from './medication-request.service';
export declare class PharmacyStatisticsService {
    private readonly requestService;
    constructor(requestService: MedicationRequestService);
    getStatistics(pharmacyId: string): Promise<PharmacyStatistics>;
    private generateTrendData;
    private calculateCategoryDistribution;
    private getTopMedications;
}
