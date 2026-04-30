import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, createReadStream } from 'fs';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { PharmacyStockService } from './pharmacy-stock.service';
import { PharmacyStatisticsService } from './pharmacy-statistics.service';
import { MedicationRequestService } from './medication-request.service';
import { ProfilesService } from '../profiles/profiles.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import {
  CreateStockDto,
  UpdateStockDto,
  UpdateStockSettingsDto,
} from './dto/create-stock.dto';
import {
  CreateMedicationRequestDto,
  UpdateMedicationRequestDto,
} from './dto/create-medication-request.dto';
import { CreateMedicationRequestFormDto } from './dto/create-medication-request-compat.dto';
import { RequestStatus } from './schemas/medication-request.schema';

@ApiTags('Pharmacie')
@Controller('pharmacy')
export class PharmacyController {
  constructor(
    private readonly stockService: PharmacyStockService,
    private readonly statisticsService: PharmacyStatisticsService,
    private readonly requestService: MedicationRequestService,
    private readonly profilesService: ProfilesService,
    private readonly authService: AuthService,
  ) {}

  // ============================================================
  //   PROFIL PHARMACIE (après invitation admin)
  // ============================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({
    summary: 'Obtenir mon profil pharmacie complet',
    description:
      'Retourne le profil complet de la pharmacie connectée. Utilisé pour pré-remplir le formulaire.',
  })
  async getMyProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Get('profile/raw')
  @ApiOperation({
    summary: 'Données brutes du profil pharmacie (pour formulaire)',
  })
  async getMyRawProfile(@Request() req) {
    return this.profilesService.getProfile(req.user.userId, UserRole.PHARMACIE);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({
    summary: 'Créer / Mettre à jour mon profil pharmacie',
    description:
      'Crée ou met à jour le profil de la pharmacie connectée. ' +
      'Champs : pharmacyName, ownerName, licenseNumber, address, city, wilaya, ' +
      'workingDays, openingTime, closingTime, is24Hours, hasDelivery, deliveryRadius, services.',
  })
  async updateMyProfile(@Request() req, @Body() dto: any) {
    await this.profilesService.upsertPharmacyProfile(req.user.userId, dto);
    return this.authService.getProfile(req.user.userId);
  }

  // ============================================================
  //   ENDPOINTS /my/... — résolution automatique du pharmacyId
  //   (le pharmacyId = userId du user connecté)
  // ============================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Get('my/dashboard')
  @ApiOperation({ summary: 'Tableau de bord de MA pharmacie' })
  async getMyDashboard(@Request() req) {
    return this.requestService.getDashboard(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Get('my/stock')
  @ApiOperation({ summary: 'Stock de MA pharmacie' })
  async getMyStock(@Request() req) {
    return this.stockService.getStockByPharmacy(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Post('my/stock')
  @ApiOperation({ summary: 'Ajouter un médicament au stock de MA pharmacie' })
  async addMyStock(@Request() req, @Body() dto: CreateStockDto) {
    return this.stockService.createStock(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Put('my/stock/:stockId')
  @ApiOperation({ summary: 'Modifier un médicament du stock de MA pharmacie' })
  async updateMyStock(
    @Request() req,
    @Param('stockId') stockId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.stockService.updateStock(req.user.userId, stockId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Delete('my/stock/:stockId')
  @ApiOperation({ summary: 'Supprimer un médicament du stock de MA pharmacie' })
  async deleteMyStock(@Request() req, @Param('stockId') stockId: string) {
    await this.stockService.deleteStock(req.user.userId, stockId);
    return { message: 'Stock supprimé avec succès' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Get('my/stock/settings')
  @ApiOperation({ summary: 'Paramètres de stock de MA pharmacie' })
  async getMyStockSettings(@Request() req) {
    return this.stockService.getSettings(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Put('my/stock/settings')
  @ApiOperation({ summary: 'Modifier les paramètres de stock de MA pharmacie' })
  async updateMyStockSettings(
    @Request() req,
    @Body() dto: UpdateStockSettingsDto,
  ) {
    return this.stockService.updateSettings(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Get('my/statistics')
  @ApiOperation({ summary: 'Statistiques de MA pharmacie' })
  async getMyStatistics(@Request() req) {
    return this.statisticsService.getStatistics(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Get('my/medication-statistics')
  @ApiOperation({
    summary: 'Statistiques des médicaments demandés (MA pharmacie)',
    description:
      'Retourne les médicaments les plus demandés pour un mois donné. Le filtre de mois est optionnel (format YYYY-MM).',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Mois au format YYYY-MM (ex: 2026-04). Par défaut: mois courant.',
  })
  async getMyMedicationStatistics(
    @Request() req,
    @Query('month') month?: string,
  ) {
    return this.statisticsService.getMedicationStatistics(req.user.userId, month);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('admin/medication-statistics')
  @ApiOperation({
    summary: 'Statistiques globales des médicaments demandés (ADMIN)',
    description:
      'Retourne les médicaments les plus demandés (toutes pharmacies confondues) pour un mois donné. Filtre optionnel month=YYYY-MM.',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Mois au format YYYY-MM (ex: 2026-04). Par défaut: mois courant.',
  })
  async getAdminMedicationStatistics(@Query('month') month?: string) {
    return this.statisticsService.getGlobalMedicationStatistics(month);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Get('my/requests')
  @ApiOperation({ summary: 'Demandes de médicaments reçues par MA pharmacie' })
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus })
  async getMyRequests(@Request() req, @Query('status') status?: RequestStatus) {
    return this.requestService.getRequestsByPharmacy(req.user.userId, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Get('my/requests/:requestId')
  @ApiOperation({ summary: "Détail d'une demande de médicament" })
  async getMyRequest(@Request() req, @Param('requestId') requestId: string) {
    return this.requestService.getRequestById(req.user.userId, requestId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Put('my/requests/:requestId')
  @ApiOperation({
    summary: "Modifier le statut d'une demande (valider, terminer, etc.)",
  })
  async updateMyRequest(
    @Request() req,
    @Param('requestId') requestId: string,
    @Body() dto: UpdateMedicationRequestDto,
  ) {
    return this.requestService.updateRequest(req.user.userId, requestId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Delete('my/requests/:requestId')
  @ApiOperation({ summary: 'Supprimer une demande de médicament' })
  async deleteMyRequest(@Request() req, @Param('requestId') requestId: string) {
    await this.requestService.deleteRequest(req.user.userId, requestId);
    return { message: 'Demande supprimée avec succès' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my/available-medications')
  @ApiOperation({ summary: 'Médicaments disponibles dans MA pharmacie' })
  async getMyAvailableMedications(@Request() req) {
    return this.stockService.getAvailableMedications(req.user.userId);
  }

  // ============================================================
  //   UPLOAD ORDONNANCE (patient)
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('upload/prescription')
  @ApiOperation({ summary: 'Uploader une ordonnance (image)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prescription: {
          type: 'string',
          format: 'binary',
          description: "Image de l'ordonnance (jpg/png/gif, max 5MB)",
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('prescription', {
      storage: diskStorage({
        destination: './uploads/prescriptions',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `prescription-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMime = /\/(jpg|jpeg|png|gif)$/;
        const allowedExt = /\.(jpg|jpeg|png|gif)$/i;
        const mimetypeValid = typeof file.mimetype === 'string' && allowedMime.test(file.mimetype);
        const extensionValid = typeof file.originalname === 'string' && allowedExt.test(file.originalname);

        if (!mimetypeValid && !extensionValid) {
          return callback(
            new BadRequestException(
              'Seules les images sont autorisées (jpg, png, gif)',
            ),
            false,
          );
        }

        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadPrescription(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    // Return relative URL so clients can resolve with their baseUrl (localhost, ngrok, etc.)
    const fileUrl = `/uploads/prescriptions/${file.filename}`;
    return {
      success: true,
      url: fileUrl,
      filename: file.filename,
      size: file.size,
    };
  }

  // ============================================================
  //   SERVIR FICHIER ORDONNANCE (proxy local — évite page avertissement ngrok)
  // ============================================================
  @Get('uploads/prescriptions/:filename')
  @ApiOperation({
    summary: 'Télécharger une image ordonnance (proxy backend)',
    description:
      'Sert le fichier ordonnance directement depuis le backend (évite la page avertissement ngrok sur ngrok-free).',
  })
  async servePrescriptionFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Validate filename (simple security: no path traversal)
    if (filename.includes('..') || filename.includes('/')) {
      throw new BadRequestException('Invalid filename');
    }

    const filePath = join(process.cwd(), 'uploads', 'prescriptions', filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    // Set appropriate content-type based on extension
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const contentTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const stream = createReadStream(filePath);
    stream.pipe(res);
  }

  // ============================================================
  //   DEMANDER UN MÉDICAMENT (patient → pharmacie)
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('medication-request')
  @ApiOperation({
    summary: 'Envoyer une demande de médicament (ordonnance) à une pharmacie',
    description:
      'Compatibilité mobile/web: accepte un payload avec pharmacyId + patient{} + medications[] et le mappe vers POST /pharmacy/:pharmacyId/requests.',
  })
  async createMedicationRequestFromForm(
    @Body() dto: CreateMedicationRequestFormDto,
  ) {
    const location = dto.patient.location;
    const hasValidLocation =
      typeof location?.latitude === 'number' &&
      typeof location?.longitude === 'number';

    const mapped: CreateMedicationRequestDto = {
      patientId: dto.patient.id,
      patientName: dto.patient.name,
      patientPhone: dto.patient.phoneNumber,
      patientLocation: hasValidLocation
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
          }
        : undefined,
      medications: (dto.medications ?? [])
        .map((m) => ({
          medicationName: (m.name ?? m.medicationName ?? '').trim(),
          medicationDosage: (m.dosage ?? m.medicationDosage ?? '').trim(),
          quantity: m.quantity ?? 1,
          unit: m.unit,
        }))
        .filter((m) => m.medicationName.length > 0),
      isUrgent: dto.isUrgent ?? false,
      requestsDelivery: dto.requestsDelivery ?? false,
      prescriptionImageUrl: dto.prescriptionImageUrl,
    };

    // Reuse the canonical endpoint/service behavior (includes notifications + push)
    return this.requestService.createRequest(dto.pharmacyId, mapped);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':pharmacyId/requests')
  @ApiOperation({
    summary: 'Envoyer une demande de médicament à une pharmacie (patient)',
    description:
      'Le patient envoie une demande à une pharmacie spécifique via son pharmacyId (userId de la pharmacie).',
  })
  async createRequest(
    @Param('pharmacyId') pharmacyId: string,
    @Body() dto: CreateMedicationRequestDto,
  ) {
    return this.requestService.createRequest(pharmacyId, dto);
  }

  // ============================================================
  //   ENDPOINTS PUBLICS
  // ============================================================

  @Get('list/all')
  @ApiOperation({ summary: 'Lister toutes les pharmacies (public)' })
  async getAllPharmacies(
    @Query('city') _city?: string,
    @Query('wilaya') _wilaya?: string,
    @Query('is24Hours') _is24Hours?: string,
    @Query('hasDelivery') _hasDelivery?: string,
  ) {
    console.log(`[PharmacyController] GET /pharmacy/list/all called with city=${_city} wilaya=${_wilaya} is24Hours=${_is24Hours} hasDelivery=${_hasDelivery}`);
    // TODO: Re-enable and validate server-side filters (city/wilaya/is24Hours/hasDelivery)
    // once nearby ranking/filter UX is finalized on mobile.
    const pharmacies = await this.profilesService.searchPharmacies({});
    console.log(`[PharmacyController] Returning ${pharmacies.length} pharmacies`);

    return pharmacies.map((pharmacy: any) => ({
      ...pharmacy.toObject(),
      pharmacyId: pharmacy.userId?.toString(),
    }));
  }

  @Get(':pharmacyId/available-medications')
  @ApiOperation({
    summary: 'Médicaments disponibles dans une pharmacie (public)',
  })
  async getAvailableMedications(@Param('pharmacyId') pharmacyId: string) {
    return this.stockService.getAvailableMedications(pharmacyId);
  }

  // ============================================================
  //   ENDPOINTS PARAMÉTRÉS (compatibilité ancienne API)
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':pharmacyId/dashboard')
  @ApiOperation({ summary: "Tableau de bord d'une pharmacie par ID" })
  async getDashboard(@Param('pharmacyId') pharmacyId: string) {
    return this.requestService.getDashboard(pharmacyId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':pharmacyId/stock')
  @ApiOperation({ summary: "Stock d'une pharmacie par ID" })
  async getStock(@Param('pharmacyId') pharmacyId: string) {
    return this.stockService.getStockByPharmacy(pharmacyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Post(':pharmacyId/stock')
  @ApiOperation({ summary: 'Ajouter au stock (par ID pharmacie)' })
  async createStock(
    @Param('pharmacyId') pharmacyId: string,
    @Body() dto: CreateStockDto,
  ) {
    return this.stockService.createStock(pharmacyId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Put(':pharmacyId/stock/:stockId')
  @ApiOperation({ summary: 'Modifier un stock (par ID pharmacie)' })
  async updateStock(
    @Param('pharmacyId') pharmacyId: string,
    @Param('stockId') stockId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.stockService.updateStock(pharmacyId, stockId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Delete(':pharmacyId/stock/:stockId')
  @ApiOperation({ summary: 'Supprimer un stock (par ID pharmacie)' })
  async deleteStock(
    @Param('pharmacyId') pharmacyId: string,
    @Param('stockId') stockId: string,
  ) {
    await this.stockService.deleteStock(pharmacyId, stockId);
    return { message: 'Stock supprimé avec succès' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':pharmacyId/stock/settings')
  @ApiOperation({ summary: 'Paramètres de stock (par ID pharmacie)' })
  async getStockSettings(@Param('pharmacyId') pharmacyId: string) {
    return this.stockService.getSettings(pharmacyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Put(':pharmacyId/stock/settings')
  @ApiOperation({
    summary: 'Modifier les paramètres de stock (par ID pharmacie)',
  })
  async updateStockSettings(
    @Param('pharmacyId') pharmacyId: string,
    @Body() dto: UpdateStockSettingsDto,
  ) {
    return this.stockService.updateSettings(pharmacyId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':pharmacyId/statistics')
  @ApiOperation({ summary: "Statistiques d'une pharmacie par ID" })
  async getStatistics(@Param('pharmacyId') pharmacyId: string) {
    return this.statisticsService.getStatistics(pharmacyId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':pharmacyId/medication-statistics')
  @ApiOperation({
    summary: "Statistiques des médicaments demandés (par ID pharmacie)",
    description:
      'Retourne les médicaments les plus demandés pour un mois donné. Le filtre de mois est optionnel (format YYYY-MM).',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Mois au format YYYY-MM (ex: 2026-04). Par défaut: mois courant.',
  })
  async getMedicationStatistics(
    @Param('pharmacyId') pharmacyId: string,
    @Query('month') month?: string,
  ) {
    return this.statisticsService.getMedicationStatistics(pharmacyId, month);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':pharmacyId/requests')
  @ApiOperation({ summary: 'Demandes reçues par une pharmacie (par ID)' })
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus })
  async getRequests(
    @Param('pharmacyId') pharmacyId: string,
    @Query('status') status?: RequestStatus,
  ) {
    return this.requestService.getRequestsByPharmacy(pharmacyId, status);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':pharmacyId/requests/:requestId')
  @ApiOperation({ summary: "Détail d'une demande (par ID pharmacie)" })
  async getRequest(
    @Param('pharmacyId') pharmacyId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.requestService.getRequestById(pharmacyId, requestId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Put(':pharmacyId/requests/:requestId')
  @ApiOperation({ summary: 'Modifier une demande (par ID pharmacie)' })
  async updateRequest(
    @Param('pharmacyId') pharmacyId: string,
    @Param('requestId') requestId: string,
    @Body() dto: UpdateMedicationRequestDto,
  ) {
    return this.requestService.updateRequest(pharmacyId, requestId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIE)
  @ApiBearerAuth()
  @Delete(':pharmacyId/requests/:requestId')
  @ApiOperation({ summary: 'Supprimer une demande (par ID pharmacie)' })
  async deleteRequest(
    @Param('pharmacyId') pharmacyId: string,
    @Param('requestId') requestId: string,
  ) {
    await this.requestService.deleteRequest(pharmacyId, requestId);
    return { message: 'Demande supprimée avec succès' };
  }
}
