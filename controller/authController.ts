import { authService } from '../api/authService';

export const authController = {
  handlePatientRegistration: async (email: string, pass: string, confirm: string, tel: string) => {
    try {
      if (pass !== confirm) throw new Error("Les mots de passe ne correspondent pas");
      const user = await authService.registerPatient(email, pass, tel);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  handleMedecinRegistration: async (email: string, pass: string, confirm: string, tel: string, spec: string, ordre: string) => {
    try {
      if (pass !== confirm) throw new Error("Les mots de passe ne correspondent pas");
      const specArray = spec.split(',').map(s => s.trim());
      const user = await authService.registerMedecin(email, pass, tel, specArray, ordre);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  
  handleLogin: async (email: string, pass: string) => {
    try {
      const user = await authService.login(email, pass);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, message: "Email ou mot de passe incorrect" };
    }
  }
};