import { prescriptionService } from '../api/prescriptionService';
import { Prescription, Medicament } from '../types/collection';

export const prescriptionController = {
  submitOrdonnance: async (
    medecinId: string, 
    patientId: string, 
    diagnostic: string, 
    medicaments: Medicament[]
  ) => {
    try {
      if (!patientId) throw new Error("Veuillez sélectionner un patient");
      if (medicaments.length === 0) throw new Error("Ajoutez au moins un médicament");

      // Calcul de la durée totale de l'ordonnance (basé sur le médicament le plus long)
      const maxDuree = Math.max(...medicaments.map(m => Number(m.duree)));

      const prescriptionData: Partial<Prescription> = {
        medecinId,
        patientId,
        diagnostic,
        observations: "",
        medicaments,
        duree: maxDuree,
        creePar: medecinId
      };

      const id = await prescriptionService.createPrescription(prescriptionData);
      return { success: true, id };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
};