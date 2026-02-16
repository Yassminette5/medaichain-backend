import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PharmacyStockService } from './pharmacy-stock.service';
import { PharmacyStatisticsService } from './pharmacy-statistics.service';
import { MedicationRequestService } from './medication-request.service';
import { CreateStockDto, UpdateStockDto, UpdateStockSettingsDto } from './dto/create-stock.dto';
import { CreateMedicationRequestDto, UpdateMedicationRequestDto } from './dto/create-medication-request.dto';
import { RequestStatus } from './schemas/medication-request.schema';

@Controller('pharmacy')
export class PharmacyController {
  constructor(
    private readonly stockService: PharmacyStockService,
    private readonly statisticsService: PharmacyStatisticsService,
    private readonly requestService: MedicationRequestService,
  ) {}

  // ============ DASHBOARD ============
  @Get(':pharmacyId/dashboard')
  async getDashboard(@Param('pharmacyId') pharmacyId: string) {
    return this.requestService.getDashboard(pharmacyId);
  }

  // ============ STOCK MANAGEMENT ============
  @Get(':pharmacyId/stock')
  async getStock(@Param('pharmacyId') pharmacyId: string) {
    return this.stockService.getStockByPharmacy(pharmacyId);
  }

  @Post(':pharmacyId/stock')
  async createStock(
    @Param('pharmacyId') pharmacyId: string,
    @Body() createStockDto: CreateStockDto,
  ) {
    try {
      return await this.stockService.createStock(pharmacyId, createStockDto);
    } catch (error) {
      throw error;
    }
  }

  @Put(':pharmacyId/stock/:stockId')
  async updateStock(
    @Param('pharmacyId') pharmacyId: string,
    @Param('stockId') stockId: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    return this.stockService.updateStock(pharmacyId, stockId, updateStockDto);
  }

  @Delete(':pharmacyId/stock/:stockId')
  async deleteStock(
    @Param('pharmacyId') pharmacyId: string,
    @Param('stockId') stockId: string,
  ) {
    await this.stockService.deleteStock(pharmacyId, stockId);
    return { message: 'Stock deleted successfully' };
  }

  @Get(':pharmacyId/stock/settings')
  async getStockSettings(@Param('pharmacyId') pharmacyId: string) {
    return this.stockService.getSettings(pharmacyId);
  }

  @Put(':pharmacyId/stock/settings')
  async updateStockSettings(
    @Param('pharmacyId') pharmacyId: string,
    @Body() updateDto: UpdateStockSettingsDto,
  ) {
    return this.stockService.updateSettings(pharmacyId, updateDto);
  }

  // ============ STATISTICS ============
  @Get(':pharmacyId/statistics')
  async getStatistics(@Param('pharmacyId') pharmacyId: string) {
    return this.statisticsService.getStatistics(pharmacyId);
  }

  // ============ MEDICATION REQUESTS ============
  @Get(':pharmacyId/requests')
  async getRequests(
    @Param('pharmacyId') pharmacyId: string,
    @Query('status') status?: RequestStatus,
  ) {
    return this.requestService.getRequestsByPharmacy(pharmacyId, status);
  }

  @Get(':pharmacyId/requests/:requestId')
  async getRequest(
    @Param('pharmacyId') pharmacyId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.requestService.getRequestById(pharmacyId, requestId);
  }

  @Post(':pharmacyId/requests')
  async createRequest(
    @Param('pharmacyId') pharmacyId: string,
    @Body() createDto: CreateMedicationRequestDto,
  ) {
    return this.requestService.createRequest(pharmacyId, createDto);
  }

  @Put(':pharmacyId/requests/:requestId')
  async updateRequest(
    @Param('pharmacyId') pharmacyId: string,
    @Param('requestId') requestId: string,
    @Body() updateDto: UpdateMedicationRequestDto,
  ) {
    return this.requestService.updateRequest(pharmacyId, requestId, updateDto);
  }

  @Delete(':pharmacyId/requests/:requestId')
  async deleteRequest(
    @Param('pharmacyId') pharmacyId: string,
    @Param('requestId') requestId: string,
  ) {
    await this.requestService.deleteRequest(pharmacyId, requestId);
    return { message: 'Request deleted successfully' };
  }

  // ============ PUBLIC ENDPOINTS FOR PATIENTS ============
  @Get('list/all')
  async getAllPharmacies() {
    return this.stockService.getAllPharmacies();
  }

  @Get(':pharmacyId/available-medications')
  async getAvailableMedications(@Param('pharmacyId') pharmacyId: string) {
    return this.stockService.getAvailableMedications(pharmacyId);
  }
}
