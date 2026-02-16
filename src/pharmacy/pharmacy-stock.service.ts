import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MedicationStock, StockSettings } from './schemas/medication-stock.schema';
import { CreateStockDto, UpdateStockDto, UpdateStockSettingsDto } from './dto/create-stock.dto';

@Injectable()
export class PharmacyStockService {
  constructor(
    @InjectModel(MedicationStock.name) private medicationStockModel: Model<MedicationStock>,
    @InjectModel(StockSettings.name) private stockSettingsModel: Model<StockSettings>,
  ) {}

  async getStockByPharmacy(pharmacyId: string) {
    const medications = await this.medicationStockModel.find({ pharmacyId }).exec();
    let settings = await this.stockSettingsModel.findOne({ pharmacyId }).exec();
    
    if (!settings) {
      settings = await this.stockSettingsModel.create(this.getDefaultSettings(pharmacyId));
    }

    return {
      settings,
      medications,
    };
  }

  async createStock(pharmacyId: string, createStockDto: CreateStockDto): Promise<MedicationStock> {
    const newStock = await this.medicationStockModel.create({
      pharmacyId,
      ...createStockDto,
    });

    return newStock;
  }

  async updateStock(pharmacyId: string, stockId: string, updateStockDto: UpdateStockDto): Promise<MedicationStock> {
    const updatedStock = await this.medicationStockModel
      .findOneAndUpdate(
        { _id: stockId, pharmacyId },
        updateStockDto,
        { new: true }
      )
      .exec();

    if (!updatedStock) {
      throw new NotFoundException('Stock not found');
    }

    return updatedStock;
  }

  async deleteStock(pharmacyId: string, stockId: string): Promise<void> {
    const result = await this.medicationStockModel
      .deleteOne({ _id: stockId, pharmacyId })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Stock not found');
    }
  }

  async getSettings(pharmacyId: string): Promise<StockSettings> {
    let settings = await this.stockSettingsModel.findOne({ pharmacyId }).exec();
    
    if (!settings) {
      settings = await this.stockSettingsModel.create(this.getDefaultSettings(pharmacyId));
    }
    
    return settings;
  }

  async updateSettings(pharmacyId: string, updateDto: UpdateStockSettingsDto): Promise<StockSettings> {
    let settings = await this.stockSettingsModel
      .findOneAndUpdate(
        { pharmacyId },
        updateDto,
        { new: true, upsert: true }
      )
      .exec();

    return settings;
  }

  private getDefaultSettings(pharmacyId: string) {
    return {
      pharmacyId,
      pushNotificationsEnabled: true,
      weeklyReportsEnabled: true,
      criticalStockThreshold: 8,
      alertStockThreshold: 12,
    };
  }

  async getAllPharmacies() {
    const pharmacies = await this.medicationStockModel
      .distinct('pharmacyId')
      .exec();
    
    return pharmacies.map(id => ({ pharmacyId: id }));
  }

  async getAvailableMedications(pharmacyId: string) {
    const medications = await this.medicationStockModel
      .find({ 
        pharmacyId,
        currentStock: { $gt: 0 }
      })
      .select('name dosage unit')
      .exec();
    
    return medications.map(med => ({
      id: med._id.toString(),
      name: med.name,
      dosage: med.dosage,
      unit: med.unit,
    }));
  }
}
