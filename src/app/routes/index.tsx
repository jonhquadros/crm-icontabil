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
import { CampaignsPage } from '../../modules/campaigns/pages/CampaignsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoutePermissionGuard } from './RoutePermissionGuard';

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
        
        <Route 
          path="clients" 
          element={
            <RoutePermissionGuard module="clients">
              <ClientsPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="crm"
          element={
            <RoutePermissionGuard module="kanban">
              <Navigate to="pipeline" replace />
            </RoutePermissionGuard>
          }
        />
        
        <Route 
          path="crm/pipeline" 
          element={
            <RoutePermissionGuard module="kanban">
              <KanbanPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="crm/lista" 
          element={
            <RoutePermissionGuard module="kanban">
              <KanbanPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="crm/agenda" 
          element={
            <RoutePermissionGuard module="kanban">
              <KanbanPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="crm/atividades" 
          element={
            <RoutePermissionGuard module="kanban">
              <KanbanPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="crm/relatorios" 
          element={
            <RoutePermissionGuard module="kanban">
              <KanbanPage />
            </RoutePermissionGuard>
          } 
        />

        <Route 
          path="users" 
          element={
            <RoutePermissionGuard module="users">
              <UsersPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="whatsapp" 
          element={
            <RoutePermissionGuard module="whatsapp">
              <WhatsAppPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="campaigns" 
          element={
            <RoutePermissionGuard module="campaigns">
              <CampaignsPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="campaigns/dashboard" 
          element={
            <RoutePermissionGuard module="campaigns">
              <CampaignsPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="campaigns/optout" 
          element={
            <RoutePermissionGuard module="campaigns">
              <CampaignsPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="campaigns/*" 
          element={
            <RoutePermissionGuard module="campaigns">
              <CampaignsPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="documents" 
          element={
            <RoutePermissionGuard module="documents">
              <DocumentsPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="tasks" 
          element={
            <RoutePermissionGuard module="tasks">
              <TasksPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route 
          path="reports" 
          element={
            <RoutePermissionGuard module="reports">
              <ReportsPage />
            </RoutePermissionGuard>
          } 
        />
        
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Placeholder routes for remaining modules */}
        <Route path="calendar" element={<div className="p-8 text-center">Módulo de Agenda em breve...</div>} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

