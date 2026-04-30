import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Ordonnances (Médecin / Patient)')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrescriptionsController {
    constructor(private readonly prescriptionsService: PrescriptionsService) { }

    // ========== CRÉER UNE ORDONNANCE (MÉDECIN) ==========
    @UseGuards(RolesGuard)
    @Roles(UserRole.MEDECIN)
    @Post()
    @ApiOperation({
        summary: 'Créer une ordonnance (Médecin uniquement)',
        description: 'Le médecin crée une ordonnance pour un patient. Le patient reçoit une notification automatique.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['patientId', 'medications'],
                properties: {
                patientId: { type: 'string', description: 'ID du patient', example: '64abc...123' },
                diagnosis: { type: 'string', description: 'Diagnostic', example: 'Hypertension artérielle' },
                notes: { type: 'string', description: 'Notes supplémentaires' },
                prescriptionImageUrl: { type: 'string', description: 'URL publique de l\'image de l\'ordonnance (optionnel)' },
                medications: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', example: 'Amoxicilline' },
                            dosage: { type: 'string', example: '500mg' },
                            frequency: { type: 'string', example: '3 fois par jour' },
                            duration: { type: 'string', example: '7 jours' },
                            instructions: { type: 'string', example: 'Prendre après les repas' },
                        },
                    },
                },
            },
        },
    })
    async create(@Body() createPrescriptionDto: any, @Request() req: any) {
        const doctorId = req.user?.userId ?? req.user?.sub;
        if (!doctorId) throw new BadRequestException('Médecin non identifié');
        return this.prescriptionsService.create(createPrescriptionDto, String(doctorId));
    }

    // ========== MES ORDONNANCES (MÉDECIN OU PATIENT) ==========
    @Get('my-prescriptions')
    @ApiOperation({
        summary: 'Mes ordonnances (médecin = celles émises / patient = celles reçues)',
    })
    async getMyPrescriptions(@Request() req: any) {
        const userId = req.user?.userId ?? req.user?.sub;
        if (!userId) return [];
        const role = req.user?.role != null ? String(req.user.role).toLowerCase() : '';
        if (role === 'patient') {
            return this.prescriptionsService.findByPatient(String(userId));
        }
        if (role === 'medecin') {
            return this.prescriptionsService.findByDoctor(String(userId));
        }
        return [];
    }

    // ========== ORDONNANCES D'UN PATIENT (MÉDECIN) ==========
    @UseGuards(RolesGuard)
    @Roles(UserRole.MEDECIN)
    @Get('patient/:patientId')
    @ApiOperation({ summary: 'Obtenir toutes les ordonnances d\'un patient (Médecin)' })
    async getByPatient(@Param('patientId') patientId: string) {
        return this.prescriptionsService.findByPatient(patientId);
    }

    // ========== DÉTAIL D'UNE ORDONNANCE ==========
    @Get(':id')
    @ApiOperation({ summary: 'Obtenir les détails d\'une ordonnance' })
    async getOne(@Param('id') id: string) {
        return this.prescriptionsService.findOne(id);
    }

    // ========== CHANGER LE STATUT D'UNE ORDONNANCE (MÉDECIN) ==========
    @UseGuards(RolesGuard)
    @Roles(UserRole.MEDECIN)
    @Patch(':id/status')
    @ApiOperation({
        summary: 'Mettre à jour le statut d\'une ordonnance (Médecin)',
        description: 'Statuts possibles: active, completed, cancelled',
    })
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: string },
    ) {
        return this.prescriptionsService.updateStatus(id, body.status);
    }

    // ========== PARTAGER UNE ORDONNANCE AVEC UNE PHARMACIE (PATIENT) ==========
    @UseGuards(RolesGuard)
    @Roles(UserRole.PATIENT)
    @Post(':id/share')
    @ApiOperation({ summary: 'Partager une ordonnance avec une pharmacie (Patient)' })
    async shareWithPharmacy(
        @Param('id') id: string,
        @Body() body: { pharmacyId: string; expiresAt?: string },
        @Request() req: any,
    ) {
        const patientId = req.user?.userId ?? req.user?.sub;
        if (!patientId) throw new BadRequestException('Patient non identifié');
        return this.prescriptionsService.shareWithPharmacy(
            id,
            String(patientId),
            body.pharmacyId,
            body.expiresAt ? new Date(body.expiresAt) : undefined,
        );
    }

    // ========== RÉVOQUER LE PARTAGE D'UNE ORDONNANCE (PATIENT) ==========
    @UseGuards(RolesGuard)
    @Roles(UserRole.PATIENT)
    @Post(':id/revoke')
    @ApiOperation({ summary: 'Révoquer le partage d\'une ordonnance (Patient)' })
    async revokeShare(
        @Param('id') id: string,
        @Body() body: { pharmacyId: string },
        @Request() req: any,
    ) {
        const patientId = req.user?.userId ?? req.user?.sub;
        if (!patientId) throw new BadRequestException('Patient non identifié');
        return this.prescriptionsService.revokeShareWithPharmacy(
            id,
            String(patientId),
            body.pharmacyId,
        );
    }

    // ========== TRANSFERT ORDONNANCE -> PATIENT (MÉDECIN ON-CHAIN) ==========
    @UseGuards(RolesGuard)
    @Roles(UserRole.MEDECIN)
    @Post(':id/transfer-to-patient')
    @ApiOperation({ summary: 'Transférer une ordonnance on-chain du médecin vers le patient' })
    async transferToPatient(@Param('id') id: string, @Request() req: any) {
        const doctorId = req.user?.userId ?? req.user?.sub;
        if (!doctorId) throw new BadRequestException('Médecin non identifié');
        return this.prescriptionsService.transferToPatient(id, String(doctorId));
    }

    // ========== ORDONNANCES PARTAGÉES (PHARMACIE) ==========
    @UseGuards(RolesGuard)
    @Roles(UserRole.PHARMACIE)
    @Get('shared')
    @ApiOperation({ summary: 'Lister les ordonnances partagées avec la pharmacie' })
    async getSharedPrescriptions(@Request() req: any) {
        const pharmacyId = req.user?.userId ?? req.user?.sub;
        if (!pharmacyId) return [];
        return this.prescriptionsService.listSharedForPharmacy(String(pharmacyId));
    }

    // ========== ORDONNANCE PARTAGÉE DÉTAILLÉE (PHARMACIE) ==========
    @UseGuards(RolesGuard)
    @Roles(UserRole.PHARMACIE)
    @Get('shared/:id')
    @ApiOperation({ summary: 'Obtenir le détail d\'une ordonnance partagée (Pharmacie)' })
    async getSharedPrescription(@Param('id') id: string, @Request() req: any) {
        const pharmacyId = req.user?.userId ?? req.user?.sub;
        if (!pharmacyId) throw new BadRequestException('Pharmacie non identifiée');
        return this.prescriptionsService.getSharedByPharmacy(id, String(pharmacyId));
    }

    // ========== SUPPRIMER UNE ORDONNANCE (MÉDECIN) ==========
    @UseGuards(RolesGuard)
    @Roles(UserRole.MEDECIN)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une ordonnance (Médecin uniquement)' })
    async delete(@Param('id') id: string, @Request() req: any) {
        const doctorId = req.user?.userId ?? req.user?.sub;
        if (!doctorId) throw new BadRequestException('Non identifié');
        await this.prescriptionsService.delete(id, String(doctorId));
        return { message: 'Ordonnance supprimée avec succès' };
    }
}
