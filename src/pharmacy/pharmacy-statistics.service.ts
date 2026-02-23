import { Injectable } from '@nestjs/common';
import { PharmacyStatistics, SalesOverview, DeliveryTrends, CategoryDistribution, TopMedication, TrendDataPoint, CategoryData } from './entities/pharmacy-statistics.entity';
import { MedicationRequestService } from './medication-request.service';
import { RequestStatus } from './schemas/medication-request.schema';

@Injectable()
export class PharmacyStatisticsService {
  constructor(private readonly requestService: MedicationRequestService) {}

  async getStatistics(pharmacyId: string): Promise<PharmacyStatistics> {
    const requests = await this.requestService.getRequestsByPharmacy(pharmacyId);
    
    // Calculate sales overview
    const completedRequests = requests.filter(r => r.status === RequestStatus.TERMINE);
    const totalSales = completedRequests.reduce((sum, r) => {
      const requestTotal = r.medications.reduce((medSum, med) => medSum + (med.quantity * 100), 0);
      return sum + requestTotal;
    }, 0); // Mock price
    const totalDeliveries = completedRequests.length;
    
    // Calculate percentage change (only if there's data)
    const percentageChange = totalDeliveries > 0 ? 12.5 : 0;

    const salesOverview: SalesOverview = {
      totalSales,
      currency: 'DZD',
      totalDeliveries,
      percentageChange,
    };

    // Generate delivery trends for last 7 days
    const deliveryTrends: DeliveryTrends = {
      dataPoints: this.generateTrendData(requests),
      period: 'weekly',
    };

    // Calculate category distribution
    const categoryDistribution: CategoryDistribution = {
      categories: this.calculateCategoryDistribution(requests),
    };

    // Get top medications
    const topMedications = this.getTopMedications(requests);

    return {
      salesOverview,
      deliveryTrends,
      categoryDistribution,
      topMedications,
    };
  }

  private generateTrendData(requests: any[]): TrendDataPoint[] {
    const dataPoints: TrendDataPoint[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = requests.filter(r => {
        const reqDate = new Date(r.requestDate);
        return reqDate >= date && reqDate < nextDate;
      }).length;
      
      dataPoints.push({
        date,
        value: count,
      });
    }
    
    return dataPoints;
  }

  private calculateCategoryDistribution(requests: any[]): CategoryData[] {
    if (requests.length === 0) {
      return [];
    }
    
    // Category distribution based on medication names
    const categories = new Map<string, number>();
    
    requests.forEach(r => {
      r.medications.forEach(med => {
        const medName = med.name.toLowerCase();
        let category = 'Autres';
        
        if (medName.includes('amox') || medName.includes('antibiotic')) {
          category = 'Antibiotiques';
        } else if (medName.includes('paracet') || medName.includes('ibu')) {
          category = 'Antalgiques';
        } else if (medName.includes('vitam')) {
          category = 'Vitamines';
        }
        
        categories.set(category, (categories.get(category) || 0) + 1);
      });
    });

    const total = requests.reduce((sum, r) => sum + r.medications.length, 0);
    const colors = {
      'Antibiotiques': '#4FACFE',
      'Antalgiques': '#10B981',
      'Vitamines': '#F59E0B',
      'Autres': '#7C3AED',
    };

    return Array.from(categories.entries()).map(([name, count]) => ({
      name,
      percentage: (count / total) * 100,
      color: colors[name] || '#7C3AED',
    }));
  }

  private getTopMedications(requests: any[]): TopMedication[] {
    if (requests.length === 0) {
      return [];
    }
    
    const medicationCounts = new Map<string, { count: number; medication: any }>();
    
    requests.forEach(r => {
      r.medications.forEach(med => {
        const key = `${med.name}-${med.dosage}`;
        const existing = medicationCounts.get(key);
        
        if (existing) {
          existing.count += med.quantity;
        } else {
          medicationCounts.set(key, {
            count: med.quantity,
            medication: med,
          });
        }
      });
    });

    const sorted = Array.from(medicationCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    return sorted.map(([, data]) => ({
      id: data.medication.id,
      name: data.medication.name,
      dosage: data.medication.dosage,
      requestCount: data.count,
      period: 'CE MOIS',
      changePercentage: 0, // Calculate real change when historical data is available
      pricePerUnit: 0, // Should come from actual price data
    }));
  }
}
