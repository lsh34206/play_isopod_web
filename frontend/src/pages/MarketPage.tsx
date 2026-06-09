import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Tag, X, RefreshCw, Search, Filter } from 'lucide-react';
import { marketApi } from '../api/market';
import { useIsopods } from '../hooks/useIsopods';
import { useGameStore } from '../store/gameStore';
import { useGameState } from '../hooks/useGameState';
import type { Isopod, MarketListing } from '../types';
import toast from 'react-hot-toast';

const GRADE_OPTIONS = ['전체', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

const gradeColors: Record<string, string> = {
  D: 'text-slate-400',
  C: 'text-emerald-400',
  B: 'text-blue-400',
  A: 'text-purple-400',
  S: 'text-amber-400',
  SS: 'text-red-400',
  SSS: 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400',
};

function ListingCard({
  listing,
  onBuy,
  currentUserId,
}: {
  listing: MarketListing;
  onBuy: (id: string) => void;
  currentUserId?: string;
}) {
  const isOwn = listing.sellerId._id === currentUserId;
  const iso = listing.isopodId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 border border-slate-700 rounded-2xl p-4 hover:border-slate-600 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-4xl">
          {iso.species === 'armadillidium' ? '🔵' : iso.species === 'cubaris' ? '🟤' : '🐛'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm truncate">{iso.name}</span>
            <span className={`text-xs font-black ${gradeColors[iso.grade] || ''}`}>
              {iso.grade}
            </span>
          </div>
          <div className="text-slate-400 text-xs">
            Lv.{iso.level} • {iso.pattern}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-slate-500">
          판매자: {listing.sellerId.username}
          {isOwn && <span className="text-amber-400 ml-1">(나)</span>}
        </div>
        <div className="text-xs text-slate-500">
          {new Date(listing.listedAt).toLocaleDateString('ko-KR')}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-amber-400 font-black text-lg">
            {listing.price.toLocaleString()}
          </span>
          <span className="text-amber-600 text-xs">코인</span>
        </div>
        {!isOwn && (
          <button
            onClick={() => onBuy(listing._id)}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
          >
            <ShoppingBag size={12} />
            구매
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ListForSaleModal({
  isopods,
  onClose,
  onList,
}: {
  isopods: Isopod[];
  onClose: () => void;
  onList: (isopodId: string, price: number) => void;
}) {
  const [selectedIsopod, setSelectedIsopod] = useState<Isopod | null>(null);
  const [price, setPrice] = useState(100);

  const handleList = () => {
    if (!selectedIsopod || price <= 0) return;
    onList(selectedIsopod._id, price);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-xl">시장에 등록하기</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Isopod selection */}
        <div className="mb-4">
          <label className="text-slate-400 text-sm mb-2 block">공벌레 선택</label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {isopods.filter(i => i.isAlive).map((iso) => (
              <button
                key={iso._id}
                onClick={() => setSelectedIsopod(iso)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  selectedIsopod?._id === iso._id
                    ? 'border-amber-500 bg-amber-600/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <span className="text-xl">
                  {iso.species === 'armadillidium' ? '🔵' : iso.species === 'cubaris' ? '🟤' : '🐛'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-semibold truncate">{iso.name}</div>
                  <div className={`text-xs font-bold ${gradeColors[iso.grade] || ''}`}>{iso.grade} • Lv.{iso.level}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Price input */}
        <div className="mb-5">
          <label className="text-slate-400 text-sm mb-1.5 block">판매 가격 (코인)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400">🪙</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 0))}
              min={1}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          {selectedIsopod && (
            <div className="text-slate-500 text-xs mt-1">
              추천 가격: {selectedIsopod.sellPrice.toLocaleString()} 코인
              <button
                onClick={() => setPrice(selectedIsopod.sellPrice)}
                className="text-amber-500 hover:text-amber-400 ml-2"
              >
                적용
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-white transition-colors text-sm"
          >
            취소
          </button>
          <button
            onClick={handleList}
            disabled={!selectedIsopod || price <= 0}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-sm transition-colors"
          >
            등록하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MarketPage() {
  const { user } = useGameStore();
  const { isopods } = useIsopods();
  const { gameState, refetch: refetchGame } = useGameState();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'browse' | 'my'>('browse');
  const [gradeFilter, setGradeFilter] = useState('전체');
  const [page, setPage] = useState(1);
  const [showListModal, setShowListModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get user from authStore
  const { user: authUser } = useGameStore() as unknown as { user: { _id: string } | null };
  const currentUserId = authUser?._id;

  const { data: browseData, isLoading: isBrowseLoading, refetch: refetchBrowse } = useQuery({
    queryKey: ['market-listings', page, gradeFilter],
    queryFn: () =>
      marketApi.getListings(page, gradeFilter !== '전체' ? gradeFilter : undefined),
    enabled: activeTab === 'browse',
  });

  const { data: myListings = [], refetch: refetchMyListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: marketApi.getMyListings,
    enabled: activeTab === 'my',
  });

  const buyMutation = useMutation({
    mutationFn: (listingId: string) => marketApi.buy(listingId),
    onSuccess: (data) => {
      toast.success(`구매 완료! ${data.coinsSpent.toLocaleString()} 코인 지출`);
      refetchBrowse();
      refetchGame();
      queryClient.invalidateQueries({ queryKey: ['isopods'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '구매 실패');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (listingId: string) => marketApi.cancel(listingId),
    onSuccess: () => {
      toast.success('등록이 취소되었습니다');
      refetchMyListings();
      queryClient.invalidateQueries({ queryKey: ['isopods'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '취소 실패');
    },
  });

  const listMutation = useMutation({
    mutationFn: ({ isopodId, price }: { isopodId: string; price: number }) =>
      marketApi.list(isopodId, price),
    onSuccess: () => {
      toast.success('시장에 등록되었습니다!');
      refetchMyListings();
      queryClient.invalidateQueries({ queryKey: ['isopods'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '등록 실패');
    },
  });

  const listings = browseData?.listings ?? [];
  const filteredListings = searchQuery
    ? listings.filter((l) =>
        l.isopodId.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : listings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">공벌레 시장</h1>
          <p className="text-slate-400 text-sm">공벌레를 사고 팔아보세요</p>
        </div>
        <button
          onClick={() => setShowListModal(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Tag size={15} />
          판매 등록
        </button>
      </div>

      {/* Balance display */}
      {gameState && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-amber-400 text-sm">보유 코인:</span>
          <span className="text-amber-300 font-bold">{gameState.coins.toLocaleString()} 🪙</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'browse', label: '둘러보기' },
          { key: 'my', label: '내 매물' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'browse' | 'my')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름으로 검색..."
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {GRADE_OPTIONS.map((grade) => (
                <button
                  key={grade}
                  onClick={() => { setGradeFilter(grade); setPage(1); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    gradeFilter === grade
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
            <button
              onClick={() => refetchBrowse()}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Listings grid */}
          {isBrowseLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-2xl h-44 animate-pulse" />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="text-5xl mb-3">🏪</div>
              <p>등록된 매물이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing._id}
                  listing={listing}
                  onBuy={(id) => buyMutation.mutate(id)}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {browseData && browseData.pages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 disabled:opacity-50 text-sm"
              >
                이전
              </button>
              <span className="px-3 py-1.5 text-slate-400 text-sm">
                {page} / {browseData.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(browseData.pages, p + 1))}
                disabled={page >= browseData.pages}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 disabled:opacity-50 text-sm"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}

      {/* My listings tab */}
      {activeTab === 'my' && (
        <div className="space-y-3">
          {myListings.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="text-5xl mb-3">📦</div>
              <p>등록한 매물이 없습니다</p>
              <button
                onClick={() => setShowListModal(true)}
                className="mt-4 text-amber-400 hover:text-amber-300 text-sm"
              >
                + 지금 등록하기
              </button>
            </div>
          ) : (
            myListings.map((listing) => (
              <motion.div
                key={listing._id}
                layout
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4"
              >
                <span className="text-3xl">
                  {listing.isopodId.species === 'armadillidium' ? '🔵' : '🐛'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm truncate">
                      {listing.isopodId.name}
                    </span>
                    <span className={`text-xs font-bold ${gradeColors[listing.isopodId.grade] || ''}`}>
                      {listing.isopodId.grade}
                    </span>
                  </div>
                  <div className="text-amber-400 text-sm font-bold">
                    {listing.price.toLocaleString()} 코인
                  </div>
                </div>
                <button
                  onClick={() => cancelMutation.mutate(listing._id)}
                  disabled={cancelMutation.isPending}
                  className="flex items-center gap-1.5 bg-red-900/30 border border-red-700/50 hover:bg-red-900/50 text-red-400 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                >
                  <X size={12} />
                  취소
                </button>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* List for sale modal */}
      <AnimatePresence>
        {showListModal && (
          <ListForSaleModal
            isopods={isopods}
            onClose={() => setShowListModal(false)}
            onList={(isopodId, price) => listMutation.mutate({ isopodId, price })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
