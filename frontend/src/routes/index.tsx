import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { HeatmapPage } from '../pages/Heatmap';
import CriminalNetwork from '../pages/CriminalNetwork';
import RepeatOffenders from '../pages/RepeatOffenders';
import AIAssistant from '../pages/AIAssistant';
import Predictions from '../pages/Predictions';
import {
  CrimeAnalyticsPage,
  ReportsPage,
  SettingsPage
} from '../pages/Placeholders';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="font-semibold text-sm">Loading Officer Profile...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="font-semibold text-sm">Resolving Session...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <CrimeAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/heatmap"
        element={
          <ProtectedRoute>
            <HeatmapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/criminal-network"
        element={
          <ProtectedRoute>
            <CriminalNetwork />
          </ProtectedRoute>
        }
      />
      <Route
        path="/repeat-offenders"
        element={
          <ProtectedRoute>
            <RepeatOffenders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-assistant"
        element={
          <ProtectedRoute>
            <AIAssistant />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictions"
        element={
          <ProtectedRoute>
            <Predictions />
          </ProtectedRoute>
        }
      />

      {/* Fallbacks */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
