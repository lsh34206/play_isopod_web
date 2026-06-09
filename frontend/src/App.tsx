import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout';
import Notification from './components/Notification';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CarePage from './pages/CarePage';
import BreedingPage from './pages/BreedingPage';
import MarketPage from './pages/MarketPage';
import RankingPage from './pages/RankingPage';
import ShopPage from './pages/ShopPage';

import { useAuthStore } from './store/authStore';
import { useSocket } from './hooks/useSocket';
import { useGameState } from './hooks/useGameState';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10000,
    },
  },
});

function SocketAndGameInit() {
  useSocket();
  useGameState();
  return null;
}

function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <SocketAndGameInit />
      <Layout />
    </>
  );
}

function AppContent() {
  const { isAuthenticated, _hydrated } = useAuthStore();

  // Wait for persisted auth state to rehydrate before rendering routes
  // to prevent a flash-redirect loop (/login ↔ /dashboard)
  if (!_hydrated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/care" element={<CarePage />} />
        <Route path="/breeding" element={<BreedingPage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/shop" element={<ShopPage />} />
      </Route>

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
        <Notification />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
