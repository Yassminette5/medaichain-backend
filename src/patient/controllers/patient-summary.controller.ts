import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ProfilesService } from '../../profiles/profiles.service';
import { PrescriptionsService } from '../../prescriptions/prescriptions.service';
import { Response } from 'express';
import { UserRole } from '../../users/schemas/user.schema';

@Controller('patients')
export class PatientSummaryController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly prescriptionsService: PrescriptionsService,
  ) {}

  @Get(':id/summary')
  async getPatientSummary(@Param('id') patientId: string, @Res() res: Response) {
    try {
      const profile = await this.profilesService.getProfile(patientId, UserRole.PATIENT);
      if (!profile) {
        throw new NotFoundException('Profil patient introuvable');
      }

      // Récupérer les ordonnances actives
      const prescriptions = await this.prescriptionsService.findByPatient(patientId);
      const activeMedications = [];
      
      prescriptions.forEach(p => {
        if (p.status === 'active' && p.medications) {
          p.medications.forEach(m => {
            activeMedications.push({
              name: m.name,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
            });
          });
        }
      });

      const age = profile.age || '—';
      const gender = profile.gender || '—';
      const height = profile.height ? `${profile.height} cm` : '—';
      const weight = profile.weight ? `${profile.weight} kg` : '—';
      const bloodGroup = profile.bloodGroup || '—'; // If it exists
      const allergies = profile.allergies && profile.allergies.length > 0 ? profile.allergies : ['Aucune allergie signalée'];
      
      const fullName = profile.fullName || 'Patient';
      // Use the first part of name or something as username
      const username = fullName.split(' ')[0].toLowerCase() + (fullName.split(' ')[1] ? fullName.split(' ')[1][0].toLowerCase() : '');

      let medicationsHtml = '';
      if (activeMedications.length > 0) {
        medicationsHtml = activeMedications.map(m => `
          <div class="card item-card">
            <div class="item-icon bg-yellow">💊</div>
            <div class="item-details">
              <h4>${m.name}</h4>
              <p>${m.frequency} • ${m.duration}</p>
              <span class="subtext">Pour : Général</span>
            </div>
            <div class="status-badge">Actif</div>
          </div>
        `).join('');
      } else {
        medicationsHtml = `<p class="empty-text">Aucun médicament en cours</p>`;
      }

      const allergiesHtml = allergies.map(a => `<span class="allergy-tag">${a}</span>`).join('');

      const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profil Médical d'Urgence</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            background-color: #f5f7fa;
            color: #333;
        }

        /* Header Section */
        .header {
            background: linear-gradient(135deg, #4FACFE, #00F2FE);
            color: white;
            padding: 40px 20px 40px;
            text-align: center;
            border-bottom-left-radius: 30px;
            border-bottom-right-radius: 30px;
            position: relative;
            z-index: 1;
            box-shadow: 0 4px 15px rgba(0, 242, 254, 0.2);
        }

        .profile-img {
            width: 80px;
            height: 80px;
            background-color: #e1f5fe;
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            border: 4px solid rgba(255, 255, 255, 0.4);
            overflow: hidden;
        }

        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
            font-weight: 700;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 15px;
        }

        .emergency-badge {
            background-color: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            border: 1px solid rgba(255, 255, 255, 0.5);
        }

        /* Main Content */
        .container {
            padding: 20px;
            position: relative;
            z-index: 2;
        }

        .section-card {
            background: white;
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }

        .section-icon {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }

        .icon-blue { background-color: #e3f2fd; color: #1e88e5; }
        .icon-orange { background-color: #fff3e0; color: #fb8c00; }
        .icon-green { background-color: #e8f5e9; color: #43a047; }
        .icon-yellow { background-color: #fff8e1; color: #ffb300; }

        .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #2c3e50;
        }

        /* Grid Layouts */
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .info-item {
            background-color: #fbfbfb;
            padding: 15px;
            border-radius: 15px;
        }

        .info-label {
            font-size: 11px;
            color: #4FACFE;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 5px;
            letter-spacing: 0.5px;
        }

        .info-value {
            font-size: 18px;
            font-weight: 700;
            color: #333;
        }
        
        .info-value span {
            font-size: 12px;
            color: #888;
            font-weight: normal;
        }

        /* Allergies */
        .allergy-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .allergy-tag {
            background-color: white;
            color: #ef5350;
            border: 1px solid #ffcdd2;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }

        /* List Items (Medications) */
        .item-card {
            display: flex;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .item-card:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .item-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            margin-right: 15px;
        }
        
        .bg-yellow { background-color: #fff9c4; }
        .bg-blue { background-color: #e1f5fe; }
        .bg-red { background-color: #ffebee; }

        .item-details {
            flex: 1;
        }

        .item-details h4 {
            font-size: 16px;
            margin-bottom: 4px;
            color: #333;
        }

        .item-details p {
            font-size: 13px;
            color: #666;
            margin-bottom: 2px;
        }
        
        .subtext {
            font-size: 12px;
            color: #4FACFE;
            font-style: italic;
        }

        .status-badge {
            background-color: #e8f5e9;
            color: #43a047;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }

        .empty-text {
            color: #888;
            font-style: italic;
            font-size: 14px;
            text-align: center;
            padding: 20px 0;
        }
    </style>
</head>
<body>

    <div class="header">
        <div class="profile-img">
            🧑‍⚕️
        </div>
        <h1>${username}</h1>
        <p>${age} ans</p>
        <div class="emergency-badge">
            🔒 PROFIL MÉDICAL D'URGENCE
        </div>
    </div>

    <div class="container">
        <!-- Informations Personnelles -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-icon icon-blue">📋</div>
                <div class="section-title">Informations Personnelles</div>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Âge</div>
                    <div class="info-value">${age} ans</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Genre</div>
                    <div class="info-value">${gender}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Taille</div>
                    <div class="info-value">${height}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Poids</div>
                    <div class="info-value">${weight}</div>
                </div>
            </div>
        </div>

        <!-- Antécédents & Allergies -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-icon icon-orange">⚠️</div>
                <div class="section-title">Antécédents & Allergies</div>
            </div>
            <div class="info-label" style="color: #ef5350;">Allergies</div>
            <div class="allergy-tags" style="margin-top: 10px;">
                ${allergiesHtml}
            </div>
        </div>

        <!-- Médicaments en Cours -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-icon icon-green">💊</div>
                <div class="section-title">Médicaments en Cours</div>
            </div>
            ${medicationsHtml}
        </div>

        <!-- Dossier Médical -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-icon icon-yellow">🗂️</div>
                <div class="section-title">Dossier Médical</div>
            </div>
            <p class="empty-text">Aucun document médical enregistré</p>
        </div>
    </div>

</body>
</html>
      `;

      return res.status(200).send(html);
    } catch (error) {
      console.error('[PatientSummary] Error:', error);
      return res.status(404).send('<h1>Patient introuvable</h1>');
    }
  }
}
