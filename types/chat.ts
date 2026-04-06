import { Timestamp } from 'firebase/firestore';

export interface Conversation {
    id?: string;
    medecinId: string;
    patientId: string;
    medecinNom: string;
    patientNom: string;
    dernierMessage: string;
    dernierMessageDate: Timestamp;
    dernierMessagePar: string;
    nonLuMedecin: number;
    nonLuPatient: number;
}

export interface Message {
    id?: string;
    conversationId: string;
    senderId: string;
    senderRole: 'medecin' | 'patient';
    contenu: string;
    dateEnvoi: Timestamp;
    lu: boolean;
}
