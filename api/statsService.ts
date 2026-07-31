import { ClientService } from './clientService';

export type Periode = 'semaine' | 'mois' | 'annee';

export interface PrescriptionsParPeriode {
    periode: Periode;
    total: number;
    data: { label: string; total: number }[];
}

export interface PrescriptionsParMedecin {
    data: { medecinId: string; nom: string; total: number }[];
}

export interface DiagnosticsFrequents {
    total: number;
    diagnosticsDistincts: number;
    data: { label: string; total: number }[];
}

class StatsService extends ClientService {
    async getPrescriptionsParPeriode(periode: Periode): Promise<PrescriptionsParPeriode> {
        const response = await this.api.get<PrescriptionsParPeriode>('/stats/prescriptions', {
            params: { periode },
        });
        return response.data;
    }

    async getPrescriptionsParMedecin(periode: Periode): Promise<PrescriptionsParMedecin> {
        const response = await this.api.get<PrescriptionsParMedecin>('/stats/prescriptions-par-medecin', {
            params: { periode },
        });
        return response.data;
    }

    async getDiagnosticsFrequents(periode: Periode): Promise<DiagnosticsFrequents> {
        const response = await this.api.get<DiagnosticsFrequents>('/stats/diagnostics', {
            params: { periode },
        });
        return response.data;
    }
}

export const statsService = new StatsService();
