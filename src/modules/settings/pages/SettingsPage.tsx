import React, { useState } from 'react';
import { 
  Building2, 
  Shield, 
  Bell, 
  Palette, 
  CreditCard, 
  History, 
  Zap 
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { CompanyProfileForm } from '../components/CompanyProfileForm';
import { IntegrationsTab } from '../components/IntegrationsTab';
import { SecuritySettingsForm } from '../components/SecuritySettingsForm';
import { NotificationSettingsForm } from '../components/NotificationSettingsForm';
import { PersonalizationForm } from '../components/PersonalizationForm';
import { SubscriptionTab } from '../components/SubscriptionTab';
import { ActivityLogsList } from '../components/ActivityLogsList';
import { cn } from '../../../shared/utils/cn';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  
  const {
    loading,
    companyLoading,
    profile,
    setProfile,
    integrations,
    setIntegrations,
    security,
    setSecurity,
    notifications,
    setNotifications,
    personalization,
    setPersonalization,
    auditLogs,
    handleSaveProfile,
    handleSaveIntegrations,
    handleSaveSecurity,
    handleSaveNotifications,
    handleSavePersonalization,
    handleTestWhatsApp,
    handleTestWebhook
  } = useSettings();

  const menuItems: SidebarItem[] = [
    { id: 'profile', label: 'Perfil da Empresa', icon: Building2 },
    { id: 'integrations', label: 'Integrações', icon: Zap },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'personalization', label: 'Personalização', icon: Palette },
    { id: 'subscription', label: 'Assinatura', icon: CreditCard },
    { id: 'logs', label: 'Logs de Atividade', icon: History },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações & Integrações</h2>
        <p className="text-muted-foreground text-sm">
          Gerencie o perfil do escritório contábil, chaves de API, webhook, segurança e preferências visuais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="md:col-span-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="md:col-span-9">
          {companyLoading ? (
            <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Carregando configurações do sistema...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'profile' && (
                <CompanyProfileForm
                  profile={profile}
                  onChange={setProfile}
                  onSubmit={handleSaveProfile}
                  isLoading={loading}
                />
              )}

              {activeTab === 'integrations' && (
                <IntegrationsTab
                  integrations={integrations}
                  onChange={setIntegrations}
                  onSubmit={handleSaveIntegrations}
                  onTestWhatsApp={handleTestWhatsApp}
                  onTestWebhook={handleTestWebhook}
                  isLoading={loading}
                />
              )}

              {activeTab === 'security' && (
                <SecuritySettingsForm
                  security={security}
                  onChange={setSecurity}
                  onSubmit={handleSaveSecurity}
                  isLoading={loading}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationSettingsForm
                  notifications={notifications}
                  onChange={setNotifications}
                  onSubmit={handleSaveNotifications}
                  isLoading={loading}
                />
              )}

              {activeTab === 'personalization' && (
                <PersonalizationForm
                  personalization={personalization}
                  onChange={setPersonalization}
                  onSubmit={handleSavePersonalization}
                  isLoading={loading}
                />
              )}

              {activeTab === 'subscription' && (
                <SubscriptionTab />
              )}

              {activeTab === 'logs' && (
                <ActivityLogsList logs={auditLogs} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
