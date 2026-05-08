import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { ethers } from 'ethers';
import {
  MedicationRequest,
  Patient,
  RequestedMedication,
  RequestStatus,
} from './schemas/medication-request.schema';
import {
  CreateMedicationRequestDto,
  UpdateMedicationRequestDto,
} from './dto/create-medication-request.dto';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.schema';
import { ProfilesService } from '../profiles/profiles.service';
import { PrescriptionAnalysisService } from './prescription-analysis.service';
import { NftService } from '../nft/nft.service';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletChainService } from '../wallet/wallet-chain.service';
import { TokenService } from '../token/token.service';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class MedicationRequestService {
  private readonly logger = new Logger(MedicationRequestService.name);

  constructor(
    @InjectModel(MedicationRequest.name)
    private medicationRequestModel: Model<MedicationRequest>,
    private notificationService: NotificationService,
    private profilesService: ProfilesService,
    private prescriptionAnalysisService: PrescriptionAnalysisService,
    private nftService: NftService,
    private usersService: UsersService,
    private walletService: WalletService,
    private walletChainService: WalletChainService,
    private tokenService: TokenService,
  ) {}

  async getRequestsByPharmacy(
    pharmacyId: string,
    status?: RequestStatus,
  ): Promise<MedicationRequest[]> {
    const filter: FilterQuery<MedicationRequest> = { pharmacyId };

    if (status && status !== RequestStatus.TOUT) {
      filter.status = status;
    }

    return await this.medicationRequestModel.find(filter).exec();
  }

  async getAllRequests(status?: RequestStatus): Promise<MedicationRequest[]> {
    const filter: FilterQuery<MedicationRequest> = {};

    if (status && status !== RequestStatus.TOUT) {
      filter.status = status;
    }

    return await this.medicationRequestModel.find(filter).exec();
  }

  async getRequestById(
    pharmacyId: string,
    requestId: string,
  ): Promise<MedicationRequest> {
    const request = await this.medicationRequestModel
      .findOne({ _id: requestId, pharmacyId })
      .exec();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async createRequest(
    pharmacyId: string,
    createDto: CreateMedicationRequestDto,
  ): Promise<MedicationRequest> {
    const resolvedPharmacyUserId =
      (await this.profilesService.resolvePharmacyUserId(pharmacyId)) ||
      pharmacyId;

    const patient: Patient = {
      id: createDto.patientId,
      name: createDto.patientName,
      phoneNumber: createDto.patientPhone,
      location: createDto.patientLocation,
    };

    const manualMedications = (createDto.medications || [])
      .filter((med) => med?.medicationName?.trim())
      .map((med) => ({
        medicationName: med.medicationName.trim(),
        medicationDosage: med.medicationDosage?.trim() || '',
        quantity: med.quantity && med.quantity > 0 ? med.quantity : 1,
        unit: med.unit || 'unités',
      }));

    let extractedMedications: Array<{
      medicationName: string;
      medicationDosage: string;
      quantity: number;
      unit: string;
    }> = [];
    let prescriptionAnalysisFailed = false;

    if (createDto.prescriptionImageUrl?.trim()) {
      try {
        const analyzed =
          await this.prescriptionAnalysisService.extractMedicationsFromImageUrl(
            createDto.prescriptionImageUrl,
          );
        console.log(
          '[MedicationRequestService] Extracted medications from image:',
          analyzed,
        );

        extractedMedications = analyzed.map((med) => ({
          medicationName: med.name.trim(),
          medicationDosage: med.dosage?.trim() || '',
          quantity: 1,
          unit: 'unités',
        }));
      } catch (error) {
        prescriptionAnalysisFailed = true;
        console.error(
          '[MedicationRequestService] Prescription image analysis failed:',
          error,
        );
      }
    }

    const mergedMedications = this.mergeMedications(
      manualMedications,
      extractedMedications,
    );

    const hasPrescriptionImage = Boolean(createDto.prescriptionImageUrl?.trim());
    if (mergedMedications.length === 0 && !hasPrescriptionImage) {
      throw new BadRequestException(
        'Au moins un medicament manuel ou une image analysable est requis',
      );
    }

    const medications: RequestedMedication[] = mergedMedications.map(
      (med, index) => ({
        id: `${Date.now()}-${index}`,
        name: med.medicationName,
        dosage: med.medicationDosage,
        quantity: med.quantity,
        unit: med.unit || 'unités',
      }),
    );

    const newRequest = await this.medicationRequestModel.create({
      pharmacyId: resolvedPharmacyUserId,
      patient,
      medications,
      status: createDto.isUrgent
        ? RequestStatus.URGENT
        : RequestStatus.EN_ATTENTE,
      requestDate: new Date(),
      isUrgent: createDto.isUrgent || false,
      requestsDelivery: createDto.requestsDelivery || false,
      prescriptionImageUrl: createDto.prescriptionImageUrl,
      validationNote:
        hasPrescriptionImage && medications.length === 0
          ? prescriptionAnalysisFailed
            ? 'Prescription reçue: analyse OCR indisponible (réseau). Merci de vérifier l’image manuellement.'
            : 'Prescription reçue: analyse OCR en cours ou sans médicaments détectés. Merci de vérifier l’image manuellement.'
          : undefined,
    });

    const title = 'Nouvelle demande patient';
    const message =
      medications.length > 0
        ? `${createDto.patientName} vous a envoyé une ordonnance (${medications.length} médicament(s)).`
        : `${createDto.patientName} vous a envoyé une ordonnance (image reçue, analyse OCR indisponible).`;

    try {
      await this.notificationService.createNotification({
        userId: resolvedPharmacyUserId,
        type: NotificationType.PHARMACY_MESSAGE,
        title,
        message,
        relatedId: newRequest._id.toString(),
        data: {
          type: 'pharmacy_request_created',
          requestId: newRequest._id.toString(),
          patientId: createDto.patientId,
          patientName: createDto.patientName,
          medicationsCount: medications.length,
          isUrgent: String(createDto.isUrgent || false),
        },
      });

      await this.notificationService.sendPushToUser({
        userId: resolvedPharmacyUserId,
        title,
        message,
        payload: {
          type: 'pharmacy_request_created',
          requestId: newRequest._id.toString(),
          patientId: createDto.patientId,
          patientName: createDto.patientName,
          medicationsCount: String(medications.length),
          isUrgent: String(createDto.isUrgent || false),
        },
      });
    } catch (error) {
      console.error(
        '[MedicationRequestService] Notification/push error:',
        error,
      );
    }

    await this.tryCreateOnChainProofs(newRequest, resolvedPharmacyUserId, createDto);

    return newRequest;
  }

  private async tryCreateOnChainProofs(
    request: MedicationRequest,
    pharmacyUserId: string,
    createDto: CreateMedicationRequestDto,
  ): Promise<void> {
    try {
      const nftAsset = await this.nftService.createForMedicationRequest({
        _id: request._id,
        patientId: createDto.patientId,
        pharmacyId: pharmacyUserId,
        medications: request.medications,
        requestDate: request.requestDate,
        prescriptionImageUrl: request.prescriptionImageUrl,
      });

      if (!nftAsset) {
        this.logger.warn(
          `[MedicationRequestService] NFT asset not created for request ${request._id}`,
        );
      } else {
        request.nftAssetId = nftAsset._id.toString();
        request.nftTokenId = nftAsset.tokenId;
        request.nftMintTxHash = nftAsset.txHash;
        request.nftContractAddress = nftAsset.contractAddress;
        request.nftChainId = nftAsset.chainId;
      }
    } catch (error) {
      this.logger.error(
        `[MedicationRequestService] NFT mint failed for request ${request._id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    try {
      const patientUser = await this.usersService.findById(createDto.patientId);
      const pharmacyUser = await this.usersService.findById(pharmacyUserId);

      if (!patientUser.walletEncryptedPrivateKey || !pharmacyUser.walletAddress) {
        this.logger.warn(
          `[MedicationRequestService] Missing wallet data for proof tx. patient=${createDto.patientId} pharmacy=${pharmacyUserId}`,
        );
      } else {
        const patientPrivateKey = this.walletService.decryptPrivateKey(
          patientUser.walletEncryptedPrivateKey,
        );

        const transfer = await this.walletChainService.sendProofTransaction(
          patientPrivateKey,
          pharmacyUser.walletAddress,
        );

        request.patientPharmacyTxHash = transfer.txHash;
      }
    } catch (error) {
      this.logger.error(
        `[MedicationRequestService] Patient->pharmacy proof tx failed for request ${request._id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    await request.save();
  }

  private mergeMedications(
    manual: Array<{
      medicationName: string;
      medicationDosage: string;
      quantity: number;
      unit: string;
    }>,
    extracted: Array<{
      medicationName: string;
      medicationDosage: string;
      quantity: number;
      unit: string;
    }>,
  ) {
    const merged = [...manual];
    const seen = new Set(
      manual.map((med) => this.medicationKey(med.medicationName, med.medicationDosage)),
    );

    for (const med of extracted) {
      const key = this.medicationKey(med.medicationName, med.medicationDosage);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(med);
    }

    return merged;
  }

  private medicationKey(name: string, dosage: string): string {
    return `${name}`.trim().toLowerCase() + '::' + `${dosage}`.trim().toLowerCase();
  }

  async updateRequest(
    pharmacyId: string,
    requestId: string,
    updateDto: UpdateMedicationRequestDto,
  ): Promise<MedicationRequest> {
    const currentRequest = await this.medicationRequestModel
      .findOne({ _id: requestId, pharmacyId })
      .exec();

    if (!currentRequest) {
      throw new NotFoundException('Request not found');
    }

    const updatedRequest = await this.medicationRequestModel
      .findOneAndUpdate({ _id: requestId, pharmacyId }, updateDto, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .exec();

    if (!updatedRequest) {
      throw new NotFoundException('Request not found');
    }

    const wasValidatedBefore = currentRequest.status === RequestStatus.VALIDE;
    const isNowValidated = updatedRequest.status === RequestStatus.VALIDE;
    const isNowRejected = updatedRequest.status === RequestStatus.NON_VALIDE;
    const wasUrgentRequest = currentRequest.status === RequestStatus.URGENT;
    const rewardAlreadyMinted = Boolean(
      (updatedRequest as any).firstResponderRewardMintTxHash,
    );

    // Notify patient when the pharmacy validates/rejects the request.
    // Per product requirement: tapping this patient notification should NOT navigate anywhere.
    try {
      const patientId = updatedRequest.patient?.id;
      if (patientId && (isNowValidated || isNowRejected)) {
        const pharmacyProfile = await this.profilesService
          .getProfile(pharmacyId, UserRole.PHARMACIE)
          .catch(() => null);
        const pharmacyName =
          (pharmacyProfile as any)?.pharmacyName ||
          (pharmacyProfile as any)?.name ||
          'Votre pharmacie';

        const title = isNowValidated
          ? 'Demande validée ✅'
          : 'Demande non validée ❌';
        const message = isNowValidated
          ? `${pharmacyName} a validé votre demande.`
          : `${pharmacyName} n'a pas validé votre demande.`;

        const type = isNowValidated
          ? 'pharmacy_request_validated'
          : 'pharmacy_request_rejected';

        await this.notificationService.createNotification({
          userId: patientId,
          type: NotificationType.PHARMACY_MESSAGE,
          title,
          message,
          relatedId: requestId,
          data: {
            type,
            requestId,
            pharmacyId,
            pharmacyName,
            navigate: 'false',
          },
        });

        await this.notificationService.sendPushToUser({
          userId: patientId,
          title,
          message,
          payload: {
            type,
            requestId,
            pharmacyId,
            pharmacyName,
            navigate: 'false',
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `[MedicationRequestService] Failed to notify patient for request ${requestId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    if (!wasValidatedBefore && wasUrgentRequest && isNowValidated && !rewardAlreadyMinted) {
      try {
        const pharmacyUser = await this.usersService.findById(pharmacyId);
        if (pharmacyUser?.walletAddress) {
          const rewardAmount = ethers.parseUnits('1', 18).toString();
          const reward = await this.tokenService.mintTokens(
            pharmacyUser.walletAddress,
            rewardAmount,
          );

          (updatedRequest as any).firstResponderRewardMintTxHash = reward.txHash;
          (updatedRequest as any).firstResponderRewardMintedAt = new Date();
          (updatedRequest as any).firstResponderRewardAmount = '1';
          await updatedRequest.save();

          this.logger.log(
            `[MedicationRequestService] Minted FRYMN reward for first responder pharmacy ${pharmacyId}: ${reward.txHash}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `[MedicationRequestService] Failed to mint first responder reward for request ${requestId}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return updatedRequest;
  }

  async boostPharmacy(
    pharmacyId: string,
    amount = 1,
  ): Promise<{ profile: any; txHash: string; boostedUntil: Date }> {
    if (amount <= 0) {
      throw new BadRequestException('Boost amount must be greater than 0');
    }

    const pharmacyUser = await this.usersService.findById(pharmacyId);
    if (!pharmacyUser?.walletAddress) {
      throw new BadRequestException('Pharmacy wallet not available');
    }

    // Check pharmacy has enough EFFECTIVE FRYMN balance (on-chain balance minus boosts already spent)
    const amountBaseUnits = ethers.parseUnits(String(amount), 18).toString();
    const balanceRaw = await this.tokenService.getBalance(pharmacyUser.walletAddress);
    const onChainBalance = BigInt(balanceRaw);
    const required = BigInt(amountBaseUnits);

    // Get current boost score to compute effective balance
    const currentProfile = await this.profilesService.getProfile(pharmacyId, 'pharmacie' as any);
    const currentBoostScore = Number(currentProfile?.boostScore ?? 0);
    const alreadySpent = BigInt(ethers.parseUnits(String(currentBoostScore), 18).toString());
    const effectiveBalance = onChainBalance > alreadySpent ? onChainBalance - alreadySpent : 0n;

    if (effectiveBalance < required) {
      const effectiveHuman = ethers.formatUnits(effectiveBalance, 18);
      throw new BadRequestException(
        `Solde FRYMN insuffisant. Requis: ${amount}, Disponible: ${effectiveHuman}`,
      );
    }

    // Mint the equivalent amount to the burn address (simulates burning from pharmacy)
    // This keeps a verifiable on-chain proof of the boost without requiring pharmacy gas
    const burnAddress = '0x000000000000000000000000000000000000dEaD';
    let txHash = `boost-${pharmacyId}-${Date.now()}`;

    try {
      // Small delay to avoid nonce collision with recent transactions
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mintResult = await this.tokenService.mintTokens(burnAddress, amountBaseUnits);
      txHash = mintResult.txHash;
      this.logger.log(
        `[BoostPharmacy] Minted ${amount} FRYMN to burn address for pharmacy ${pharmacyId}. TX: ${txHash}`,
      );
    } catch (error) {
      this.logger.warn(
        `[BoostPharmacy] On-chain burn failed, recording boost without chain proof: ${error instanceof Error ? error.message : error}`,
      );
    }

    const boostedUntil = new Date(Date.now() + amount * 24 * 60 * 60 * 1000);
    const profile = await this.profilesService.setPharmacyBoost(
      pharmacyId,
      amount,
      boostedUntil,
    );

    return {
      profile,
      txHash,
      boostedUntil,
    };
  }

  async deleteRequest(pharmacyId: string, requestId: string): Promise<void> {
    const result = await this.medicationRequestModel
      .deleteOne({ _id: requestId, pharmacyId })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Request not found');
    }
  }

  async getDashboard(pharmacyId: string) {
    const requests = await this.medicationRequestModel
      .find({ pharmacyId })
      .exec();

    return {
      pharmacyInfo: {
        id: pharmacyId,
        name: 'Pharmacie Centrale',
        totalOrders: requests.length,
        totalPackages: requests.reduce(
          (sum, r) =>
            sum +
            r.medications.reduce((medSum, med) => medSum + med.quantity, 0),
          0,
        ),
        offersDelivery: true, // In production, fetch from pharmacy profile
      },
      medicationRequests: requests,
    };
  }
}
