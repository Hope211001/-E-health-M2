import { db } from './firebase';
import {
    collection,
    addDoc,
    serverTimestamp,
    Timestamp,
    query,       // Ajouté pour la recherche
    where,       // Ajouté pour filtrer par patient
    getDocs,     // Ajouté pour récupérer les données
    orderBy,      // Ajouté pour l'ordre chronologique,
    doc,
    getDoc
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
    },


    async getPrescriptionsByPatient(patientId: string) {
        try {
            const prescriptionsRef = collection(db, "prescriptions");

            // Création de la requête
            const q = query(
                prescriptionsRef,
                where("patientId", "==", patientId),
                orderBy("dateCreation", "desc") // On utilise ton champ dateCreation
            );

            const querySnapshot = await getDocs(q);

            // On retourne les données formatées
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // On convertit le Timestamp Firebase en Date JS pour l'affichage
                    dateCreation: data.dateCreation?.toDate() || new Date(),
                };
            });
        } catch (error) {
            console.error("Erreur lors de la récupération de l'historique :", error);
            throw error;
        }
    },


    async getPrescriptionById(id: string) {
        try {
            const docRef = doc(db, "prescriptions", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    dateCreation: data.dateCreation?.toDate(),
                    dateDebut: data.dateDebut?.toDate(),
                    dateFin: data.dateFin?.toDate(),
                };
            }
            return null;
        } catch (error) {
            console.error("Erreur detail:", error);
            throw error;
        }
    }
};