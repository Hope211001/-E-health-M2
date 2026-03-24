import { Tabs } from 'expo-router';

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      
      {/* CORRECTION : On pointe vers les fichiers REELS vus dans tes logs */}
      <Tabs.Screen 
        name="patient/list" 
        options={{ title: "Mes Patients", href: "/patient/list" }} 
      />
      
      <Tabs.Screen 
        name="ordonnance/history" 
        options={{ title: "Ordonnances", href: "/ordonnance/history" }} 
      />

      <Tabs.Screen 
        name="parametre/profil" 
        options={{ title: "Mon Profil", href: "/parametre/profil" }} 
      />
    </Tabs>
  );
}