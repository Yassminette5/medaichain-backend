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
exports.PharmacyStatisticsService = void 0;
const common_1 = require("@nestjs/common");
const medication_request_service_1 = require("./medication-request.service");
const medication_request_schema_1 = require("./schemas/medication-request.schema");
let PharmacyStatisticsService = class PharmacyStatisticsService {
    constructor(requestService) {
        this.requestService = requestService;
    }
    async getStatistics(pharmacyId) {
        const requests = await this.requestService.getRequestsByPharmacy(pharmacyId);
        const completedRequests = requests.filter(r => r.status === medication_request_schema_1.RequestStatus.TERMINE);
        const totalSales = completedRequests.reduce((sum, r) => {
            const requestTotal = r.medications.reduce((medSum, med) => medSum + (med.quantity * 100), 0);
            return sum + requestTotal;
        }, 0);
        const totalDeliveries = completedRequests.length;
        const percentageChange = totalDeliveries > 0 ? 12.5 : 0;
        const salesOverview = {
            totalSales,
            currency: 'DZD',
            totalDeliveries,
            percentageChange,
        };
        const deliveryTrends = {
            dataPoints: this.generateTrendData(requests),
            period: 'weekly',
        };
        const categoryDistribution = {
            categories: this.calculateCategoryDistribution(requests),
        };
        const topMedications = this.getTopMedications(requests);
        return {
            salesOverview,
            deliveryTrends,
            categoryDistribution,
            topMedications,
        };
    }
    generateTrendData(requests) {
        const dataPoints = [];
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
    calculateCategoryDistribution(requests) {
        if (requests.length === 0) {
            return [];
        }
        const categories = new Map();
        requests.forEach(r => {
            r.medications.forEach(med => {
                const medName = med.name.toLowerCase();
                let category = 'Autres';
                if (medName.includes('amox') || medName.includes('antibiotic')) {
                    category = 'Antibiotiques';
                }
                else if (medName.includes('paracet') || medName.includes('ibu')) {
                    category = 'Antalgiques';
                }
                else if (medName.includes('vitam')) {
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
    getTopMedications(requests) {
        if (requests.length === 0) {
            return [];
        }
        const medicationCounts = new Map();
        requests.forEach(r => {
            r.medications.forEach(med => {
                const key = `${med.name}-${med.dosage}`;
                const existing = medicationCounts.get(key);
                if (existing) {
                    existing.count += med.quantity;
                }
                else {
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
            changePercentage: 0,
            pricePerUnit: 0,
        }));
    }
};
exports.PharmacyStatisticsService = PharmacyStatisticsService;
exports.PharmacyStatisticsService = PharmacyStatisticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [medication_request_service_1.MedicationRequestService])
], PharmacyStatisticsService);
//# sourceMappingURL=pharmacy-statistics.service.js.map