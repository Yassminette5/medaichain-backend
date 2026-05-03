import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AccessRequest, AccessRequestDocument, AccessRequestStatus, AccessRequestUrgency } from './schemas/access-request.schema';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.schema';
import { ProfilesService } from '../profiles/profiles.service';

@Injectable()
export class AccessRequestsService {
  constructor(
    @InjectModel(AccessRequest.name) private accessRequestModel: Model<AccessRequestDocument>,
    private notificationService: NotificationService,
    @Inject(forwardRef(() => ProfilesService)) private profilesService: ProfilesService,
  ) {}

  async create(patientId: string, dto: CreateAccessRequestDto): Promise<AccessRequestDocument> {
    const urgency = dto.urgency === 'urgent' ? AccessRequestUrgency.URGENT : AccessRequestUrgency.NORMAL;
    const request = await this.accessRequestModel.create({
      patientId: new Types.ObjectId(patientId),
      doctorId: new Types.ObjectId(dto.doctorId),
      reason: dto.reason,
      urgency,
      status: AccessRequestStatus.PENDING,
    });
    await request.save();

    try {
      const withPatient = await this.accessRequestModel
        .findById(request._id)
        .populate('patientId', 'fullName email')
        .lean()
        .exec();
      const patientName = (withPatient as any)?.patientId?.fullName ?? 'Un patient';
      await this.notificationService.createNotification({
        userId: dto.doctorId,
        type: NotificationType.APPOINTMENT,
        title: 'Nouvelle demande d\'accès',
        message: `${patientName} vous a envoyé une demande d'accès à son dossier. Motif : ${dto.reason || '—'}`,
        relatedId: request._id.toString(),
        data: { accessRequestId: request._id.toString(), patientId },
      });
    } catch (err) {
      console.error('[AccessRequests] Erreur notification médecin:', err);
    }

    return request;
  }

  async findPendingByDoctor(doctorId: string): Promise<AccessRequestDocument[]> {
    return this.accessRequestModel
      .find({ doctorId: new Types.ObjectId(doctorId), status: AccessRequestStatus.PENDING })
      .populate('patientId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  /** Liste des patients pour lesquels le médecin a accepté la demande d'accès (pour afficher leur dossier et analyses). */
  async findAcceptedPatientsByDoctor(doctorId: string): Promise<AccessRequestDocument[]> {
    return this.accessRequestModel
      .find({ doctorId: new Types.ObjectId(doctorId), status: AccessRequestStatus.ACCEPTED })
      .populate('patientId', 'fullName email phone')
      .sort({ respondedAt: -1, createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<AccessRequestDocument> {
    const request = await this.accessRequestModel.findById(id).exec();
    if (!request) throw new NotFoundException('Demande non trouvée');
    return request;
  }

  async accept(id: string, doctorId: string, duration: string): Promise<AccessRequestDocument> {
    const request = await this.accessRequestModel.findOne({
      _id: new Types.ObjectId(id),
      doctorId: new Types.ObjectId(doctorId),
      status: AccessRequestStatus.PENDING,
    }).exec();
    if (!request) throw new NotFoundException('Demande non trouvée ou déjà traitée');
    request.status = AccessRequestStatus.ACCEPTED;
    request.duration = duration;
    request.respondedAt = new Date();
    await request.save();
    await this.notificationService.createNotification({
      userId: request.patientId.toString(),
      type: NotificationType.APPOINTMENT,
      title: 'Accès accordé',
      message: `Votre demande d'accès a été acceptée pour une durée de ${duration}.`,
      relatedId: id,
    });
    return request;
  }

  async refuse(id: string, doctorId: string): Promise<AccessRequestDocument> {
    const request = await this.accessRequestModel.findOne({
      _id: new Types.ObjectId(id),
      doctorId: new Types.ObjectId(doctorId),
      status: AccessRequestStatus.PENDING,
    }).exec();
    if (!request) throw new NotFoundException('Demande non trouvée ou déjà traitée');
    request.status = AccessRequestStatus.REFUSED;
    request.respondedAt = new Date();
    await request.save();
    await this.notificationService.createNotification({
      userId: request.patientId.toString(),
      type: NotificationType.SYSTEM_ALERT,
      title: 'Demande refusée',
      message: 'Votre demande d\'accès au médecin a été refusée.',
      relatedId: id,
    });
    return request;
  }

    async hasAcceptedAccess(doctorId: string, patientId: string): Promise<boolean> {
        if (!doctorId || !patientId) return false;
        const request = await this.accessRequestModel.findOne({
            doctorId: new Types.ObjectId(doctorId),
            patientId: new Types.ObjectId(patientId),
            status: AccessRequestStatus.ACCEPTED,
        }).select('_id').lean().exec();
        return !!request;
    }

    /** Liste de TOUS les patients accessibles au médecin (acceptés + accès temporaire) */
    async findAccessiblePatientsByDoctor(doctorId: string): Promise<any[]> {
        // 1. Récupérer les patients avec accès accepté
        const acceptedPatients = await this.accessRequestModel
            .find({ doctorId: new Types.ObjectId(doctorId), status: AccessRequestStatus.ACCEPTED })
            .populate('patientId', 'fullName email phone')
            .sort({ respondedAt: -1, createdAt: -1 })
            .lean()
            .exec();

        // 2. Récupérer tous les patients pour vérifier accès temporaire
        const allPatients = await this.profilesService.getAllPatients();

        // 3. Créer un set des patientIds avec accès accepté
        const acceptedPatientIds = new Set(acceptedPatients.map(ar => ar.patientId._id.toString()));

        // 4. Chercher les patients avec accès temporaire actif
        const tempAccessPatients = [];
        for (const patient of allPatients) {
            const patientId = patient._id.toString();
            // Éviter les doublons
            if (acceptedPatientIds.has(patientId)) continue;

            // Vérifier si accès temporaire est actif
            const isTempAccessActive = patient.temporaryAccessEnabled && 
                                       patient.temporaryAccessUntil && 
                                       new Date(patient.temporaryAccessUntil) > new Date();
            
            if (isTempAccessActive) {
                tempAccessPatients.push({
                    patientId: {
                        _id: patient._id,
                        fullName: patient.fullName,
                        email: patient.email,
                        phone: patient.phone,
                    },
                    status: AccessRequestStatus.ACCEPTED,
                    temporaryAccess: true,
                    respondedAt: patient.temporaryAccessUntil,
                });
            }
        }

        // 5. Combiner et retourner
        return [...acceptedPatients, ...tempAccessPatients];
    }
}
