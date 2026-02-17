import { db } from './firebase';
import {
    collection,
    addDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { Prescription, Medicament } from '../types/collection';

export const prescriptionService = {
    async createPrescription(data: Partial<Prescription>) {
        const prescriptionsRef = collection(db, "prescriptions");

        // Calcul de la date de fin basée sur la durée (en jours)
        const dateDebut = new Date();
        const dateFin = new Date();
        dateFin.setDate(dateDebut.getDate() + (data.duree || 0));

        const finalData = {
            ...data,
            dateCreation: serverTimestamp(),
            dateDebut: Timestamp.fromDate(dateDebut),
            dateFin: Timestamp.fromDate(dateFin),
            statut: 'active',
        };

        const docRef = await addDoc(prescriptionsRef, finalData);
        return docRef.id;
    }
};