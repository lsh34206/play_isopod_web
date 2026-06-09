import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Crown, RefreshCw, TrendingUp } from 'lucide-react';
import { rankingApi } from '../api/ranking';
import { useAuthStore } from '../store/authStore';

const gradeColors: Record<string, string> = {
  D: 'text-slate-400 bg-slate-700',
  C: 'text-emerald-400 bg-emerald-900/50',
  B: 'text-blue-400 bg-blue-900/50',
  A: 'text-purple-400 bg-purple-900/50',
  S: 'text-amber-400 bg-amber-900/50',
  SS: 'text-red-400 bg-red-900/50',
  SSS: 'text-white bg-gradient-to-r from-red-600 via-yellow-600 to-blue-600',
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={20} className="text-yellow-400" />;
  if (rank === 2) return <Crown size={18} className="text-slate-300" />;
  if (rank === 3) return <Crown size={16} className="text-amber-600" />;
  return (
    <span className="text-slate-400 font-bold text-sm w-5 text-center">
      {rank}
    </span>
  );
}

export default function RankingPage() {
  const { user } = useAuthStore();
  const [highlightUser, setHighlightUser] = useState(true);

  const { data: rankings = [], isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['ranking'],
    queryFn: () => rankingApi.getTop(100),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: myRank } = useQuery({
    queryKey: ['my-rank'],
    queryFn: rankingApi.getMyRank,
    enabled: !!user,
  });

  const topThree = rankings.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
            <Trophy className="text-amber-400" size={24} />
            랭킹
          </h1>
          <p className="text-slate-400 text-sm">
            최고의 공벌레 사육사를 찾아라
            {dataUpdatedAt > 0 && (
              <span className="ml-2 text-slate-600 text-xs">
                업데이트: {new Date(dataUpdatedAt).toLocaleTimeString('ko-KR')}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={highlightUser}
              onChange={(e) => setHighlightUser(e.target.checked)}
              className="rounded"
            />
            <span className="text-slate-400 text-sm">내 위치 강조</span>
          </label>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {myRank && user && myRank.rank > 3 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-900/20 border border-amber-700/40 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <TrendingUp size={18} className="text-amber-400" />
            <div>
              <div className="text-amber-300 text-sm font-semibold">내 랭킹</div>
              <div className="text-white font-black text-xl">#{myRank.rank}위</div>
            </div>
            <div className="flex-1" />
            <div className="text-right">
              <div className="text-slate-400 text-xs">최고 등급</div>
              <div className={`font-black text-sm px-2 py-0.5 rounded ${gradeColors[myRank.highestGrade] || ''}`}>
                {myRank.highestGrade}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Trophy size={48} className="mx-auto mb-4 opacity-30" />
          <p>아직 랭킹 데이터가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topThree.length >= 3 && (
            <div className="grid grid-cols-3 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`bg-slate-800 border rounded-2xl p-4 text-center mt-8 ${
                  highlightUser && topThree[1]?.username === user?.username
                    ? 'border-amber-500'
                    : 'border-slate-600'
                }`}
              >
                <Crown size={24} className="text-slate-300 mx-auto mb-2" />
                <div className="text-slate-300 font-bold text-sm truncate">{topThree[1]?.username}</div>
                <div className="text-white font-black">2위</div>
                <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded inline-block ${gradeColors[topThree[1]?.highestGrade] || ''}`}>
                  {topThree[1]?.highestGrade}
                </div>
                <div className="text-slate-500 text-xs mt-1">{topThree[1]?.totalIsopods}마리</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-b from-amber-900/40 to-slate-800 border rounded-2xl p-4 text-center -mt-2 ${
                  highlightUser && topThree[0]?.username === user?.username
                    ? 'border-amber-400'
                    : 'border-amber-700/50'
                }`}
              >
                <Crown size={28} className="text-yellow-400 mx-auto mb-2" />
                <div className="text-yellow-300 font-bold text-sm truncate">{topThree[0]?.username}</div>
                <div className="text-white font-black text-lg">1위</div>
                <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded inline-block ${gradeColors[topThree[0]?.highestGrade] || ''}`}>
                  {topThree[0]?.highestGrade}
                </div>
                <div className="text-slate-400 text-xs mt-1">{topThree[0]?.totalIsopods}마리</div>
                <div className="text-amber-400 text-xs font-bold">👑 {topThree[0]?.topIsopodName}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`bg-slate-800 border rounded-2xl p-4 text-center mt-8 ${
                  highlightUser && topThree[2]?.username === user?.username
                    ? 'border-amber-500'
                    : 'border-slate-600'
                }`}
              >
                <Crown size={20} className="text-amber-600 mx-auto mb-2" />
                <div className="text-amber-700 font-bold text-sm truncate">{topThree[2]?.username}</div>
                <div className="text-white font-black">3위</div>
                <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded inline-block ${gradeColors[topThree[2]?.highestGrade] || ''}`}>
                  {topThree[2]?.highestGrade}
                </div>
                <div className="text-slate-500 text-xs mt-1">{topThree[2]?.totalIsopods}마리</div>
              </motion.div>
            </div>
          )}

          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold">순위</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold">사용자</th>
                  <th className="text-center px-4 py-3 text-slate-400 text-xs font-semibold hidden sm:table-cell">공벌레</th>
                  <th className="text-center px-4 py-3 text-slate-400 text-xs font-semibold">최고 등급</th>
                  <th className="text-right px-4 py-3 text-slate-400 text-xs font-semibold hidden md:table-cell">총 가치</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((entry, index) => {
                  const isMe = highlightUser && entry.username === user?.username;
                  return (
                    <motion.tr
                      key={entry.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className={`border-b border-slate-700/50 transition-colors ${
                        isMe
                          ? 'bg-amber-900/20 border-amber-700/30'
                          : 'hover:bg-slate-700/30'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center w-7">
                          <RankBadge rank={entry.rank} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{
                              background: isMe
                                ? 'linear-gradient(135deg, #d97706, #92400e)'
                                : `hsl(${entry.username.charCodeAt(0) * 20}, 60%, 35%)`,
                            }}
                          >
                            {entry.username[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isMe ? 'text-amber-300' : 'text-white'}`}>
                              {entry.username}
                              {isMe && <span className="text-amber-500 text-xs ml-1">(나)</span>}
                            </div>
                            {entry.topIsopodName && (
                              <div className="text-slate-500 text-xs hidden sm:block">
                                🐛 {entry.topIsopodName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className="text-white text-sm">{entry.totalIsopods}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${gradeColors[entry.highestGrade] || ''}`}>
                          {entry.highestGrade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="text-amber-400 text-sm font-mono">
                          {entry.totalValue.toLocaleString()}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
