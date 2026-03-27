import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Utilise les icônes standard d'Expo

export default function PatientDashboard() {
  const stats = { totalPrescriptions: "06", dernierePrise: "08:15" };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ScrollView className="flex-1 px-6 pt-4">
        
        {/* HEADER BENTO NOIR */}
        <View className="p-8 bg-slate-900 rounded-[40px] mb-6 shadow-xl">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-2xl font-black italic">Bonjour, Jean</Text>
            <TouchableOpacity className="bg-white/10 p-3 rounded-2xl">
              <Ionicons name="person" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View className="bg-indigo-500 self-start px-3 py-1 rounded-full flex-row items-center">
            <Ionicons name="shield-checkmark" size={14} color="white" />
            <Text className="text-white font-bold text-[10px] uppercase ml-2">Traitement Actif</Text>
          </View>
        </View>

        {/* STATS BENTO */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-slate-900 p-6 rounded-[35px] h-44 justify-between">
            <Ionicons name="document-text" size={24} color="#818CF8" />
            <View>
              <Text className="text-white text-4xl font-black">{stats.totalPrescriptions}</Text>
              <Text className="text-slate-500 font-bold text-[10px] uppercase">Prescriptions</Text>
            </View>
          </View>

          <View className="flex-1 bg-indigo-50 p-6 rounded-[35px] h-44 justify-between border border-indigo-100">
            <Ionicons name="time" size={24} color="#4F46E5" />
            <View>
              <Text className="text-indigo-900 text-3xl font-black">{stats.dernierePrise}</Text>
              <Text className="text-indigo-400 font-bold text-[10px] uppercase">Dernière Prise</Text>
            </View>
          </View>
        </View>

        {/* ACTIONS */}
        <View className="flex-row justify-between gap-4">
          <TouchableOpacity className="flex-1 bg-white p-6 rounded-[40px] h-52 border border-slate-100 shadow-sm justify-between">
            <View className="bg-slate-100 w-12 h-12 rounded-2xl items-center justify-center">
              <Ionicons name="settings" size={24} color="black" />
            </View>
            <Text className="font-black text-lg">Paramètres Alerte</Text>
          </TouchableOpacity>

          <View className="flex-1 gap-4">
            <SmallAction title="Historique" icon="stats-chart" bg="bg-emerald-50" color="#10B981" />
            <SmallAction title="Profil" icon="person-circle" bg="bg-slate-100" color="#64748B" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SmallAction({ title, icon, bg, color }: any) {
  return (
    <TouchableOpacity className={`${bg} p-4 rounded-[25px] flex-row items-center`}>
      <Ionicons name={icon} size={18} color={color} className="mr-3" />
      <Text className="font-black text-[11px] ml-2">{title}</Text>
    </TouchableOpacity>
  );
}