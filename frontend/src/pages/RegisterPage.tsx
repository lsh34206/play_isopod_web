import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      return '모든 필드를 입력해주세요.';
    }
    if (username.length < 3 || username.length > 20) {
      return '닉네임은 3~20자 사이여야 합니다.';
    }
    if (password.length < 6) {
      return '비밀번호는 최소 6자 이상이어야 합니다.';
    }
    if (password !== confirmPassword) {
      return '비밀번호가 일치하지 않습니다.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const data = await authApi.register(username, email, password);
      login(data.token, data.user);
      toast.success(`${data.user.username}님, 공벌레 세계에 오신 것을 환영합니다! 🐛`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        '회원가입에 실패했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { level: 'weak', label: '약함', color: 'bg-red-500' };
    if (password.length < 10) return { level: 'medium', label: '보통', color: 'bg-yellow-500' };
    return { level: 'strong', label: '강함', color: 'bg-green-500' };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['🐛', '🔵', '🟤', '🐛', '🔵', '🌿'].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl opacity-10 select-none"
            style={{
              left: `${10 + i * 17}%`,
              top: `${5 + (i % 4) * 25}%`,
            }}
            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 + i * 0.5, delay: i * 0.5 }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-6xl mb-3"
          >
            🐛
          </motion.div>
          <h1 className="text-2xl font-black text-white">회원가입</h1>
          <p className="text-slate-400 text-sm">공벌레 농장을 시작하세요</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-xl mb-4"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">닉네임</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="3~20자 닉네임"
                  className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                  maxLength={20}
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">이메일</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">비밀번호</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                  autoComplete="new-password"
                />
              </div>
              {strength && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${strength.color}`}
                      style={{
                        width: strength.level === 'weak' ? '33%' : strength.level === 'medium' ? '66%' : '100%',
                      }}
                    />
                  </div>
                  <span className={`text-xs ${
                    strength.level === 'weak' ? 'text-red-400' :
                    strength.level === 'medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">비밀번호 확인</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 재입력"
                  className={`w-full bg-slate-700/50 border text-white placeholder-slate-500 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors ${
                    confirmPassword && password === confirmPassword
                      ? 'border-green-600'
                      : confirmPassword
                      ? 'border-red-600'
                      : 'border-slate-600'
                  }`}
                  autoComplete="new-password"
                />
                {confirmPassword && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {password === confirmPassword ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <AlertCircle size={16} className="text-red-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              {isLoading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-5">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
              로그인
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
