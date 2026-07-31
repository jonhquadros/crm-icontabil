import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../../modules/auth/pages/LoginPage';
import AppShell from '../AppShell';
import { DashboardPage } from '../../modules/dashboard/pages/DashboardPage';
import { ClientsPage } from '../../modules/clients/pages/ClientsPage';
import { KanbanPage } from '../../modules/kanban/pages/KanbanPage';
import { UsersPage } from '../../modules/users/pages/UsersPage';
import { WhatsAppPage } from '../../modules/whatsapp/pages/WhatsAppPage';
import { DocumentsPage } from '../../modules/documents/pages/DocumentsPage';
import { TasksPage } from '../../modules/tasks/pages/TasksPage';
import { ReportsPage } from '../../modules/reports/pages/ReportsPage';
import { SettingsPage } from '../../modules/settings/pages/SettingsPage';
import { ProtectedRoute } from './ProtectedRoute';

import { CRMListPage } from '../../modules/kanban/pages/CRMListPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        
        <Route path="crm">
          <Route index element={<Navigate to="pipeline" replace />} />
          <Route path="pipeline" element={<KanbanPage />} />
          <Route path="lista" element={<KanbanPage />} />
          <Route path="agenda" element={<KanbanPage />} />
          <Route path="atividades" element={<KanbanPage />} />
          <Route path="relatorios" element={<KanbanPage />} />
        </Route>

        <Route path="users" element={<UsersPage />} />
        <Route path="whatsapp" element={<WhatsAppPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Placeholder routes for remaining modules */}
        <Route path="calendar" element={<div className="p-8 text-center">Módulo de Agenda em breve...</div>} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
