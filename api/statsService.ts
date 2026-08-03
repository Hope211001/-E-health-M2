import { ClientService } from './clientService';

export type Periode = 'semaine' | 'mois' | 'annee';

export interface PrescriptionsParPeriode {
    periode: Periode;
    total: number;
    data: { label: string; total: number }[];
}

export interface PrescriptionsParMedecin {
    total: number;
    medecinsDistincts: number;
    /** Top 10 des médecins, du plus prescripteur au moins prescripteur. */
    data: { medecinId: string; nom: string; total: number }[];
}

export interface DiagnosticFrequent {
    label: string;
    total: number;
    /** true sur la ligne agrégée "Autres" (hors top 10). */
    estAutres?: boolean;
}

export interface DiagnosticsFrequents {
    total: number;
    diagnosticsDistincts: number;
    data: DiagnosticFrequent[];
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
