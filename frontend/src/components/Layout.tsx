import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Heart,
  Shuffle,
  ShoppingBag,
  Trophy,
  Store,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff,
  Bug,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { useGameStore } from '../store/gameStore';
import CoinDisplay from './CoinDisplay';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '대시보드', emoji: '🏠' },
  { to: '/care', icon: Heart, label: '케어', emoji: '💚' },
  { to: '/breeding', icon: Shuffle, label: '번식', emoji: '🥚' },
  { to: '/market', icon: ShoppingBag, label: '시장', emoji: '🏪' },
  { to: '/shop', icon: Store, label: '상점', emoji: '🛒' },
  { to: '/ranking', icon: Trophy, label: '랭킹', emoji: '🏆' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { isConnected } = useSocketStore();
  const { gameState, idleEarnings } = useGameStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-600/40 flex items-center justify-center text-xl">
            🐛
          </div>
          <div>
            <h1 className="text-white font-black text-lg leading-tight">공벌레</h1>
            <p className="text-slate-400 text-xs">키우기</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-sm">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{user?.username}</div>
            <div className={`text-xs flex items-center gap-1 ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
              {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isConnected ? '연결됨' : '오프라인'}
            </div>
          </div>
        </div>
        {gameState && (
          <div className="space-y-1">
            <CoinDisplay
              coins={gameState.coins}
              gems={gameState.gems}
              idleEarnings={idleEarnings}
              compact
            />
            <div className="text-slate-500 text-xs">
              공벌레 {gameState.totalIsopods}/{gameState.maxIsopods}마리
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, label, emoji }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`
            }
          >
            <span className="text-base">{emoji}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
        >
          <LogOut size={16} />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-800/80 border-r border-slate-700/50 fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 h-full w-60 bg-slate-800 border-r border-slate-700/50 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700/50 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🐛</span>
            <span className="text-white font-bold">공벌레 키우기</span>
          </div>
          {gameState && (
            <CoinDisplay coins={gameState.coins} compact />
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
