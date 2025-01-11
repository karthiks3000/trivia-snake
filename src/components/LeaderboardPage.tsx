import React, { useState, useEffect, useRef, TouchEvent } from 'react';
import { Leaderboard, LeaderboardEntry } from './Leaderboard';
import api from '../api';
import { Adventure } from './AdventureSelection';
import { Loader2 } from 'lucide-react';

const LeaderboardPage: React.FC = () => {
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [selectedAdventureId, setSelectedAdventureId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.style.overscrollBehavior = 'touch';
    }
  }, []);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > 50;
    const isDownSwipe = distance < -50;
    if (isUpSwipe || isDownSwipe) {
      const container = containerRef.current;
      if (container) {
        container.scrollBy({
          top: isUpSwipe ? 200 : -200,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchLeaderboard(), fetchAdventures()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.getLeaderboard();
      setLeaderboardEntries(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchAdventures = async () => {
    try {
      const response = await api.getAdventures();
      setAdventures(response.data);
    } catch (error) {
      console.error('Error fetching adventures:', error);
    }
  };

  const handleAdventureChange = async (adventureId: string | undefined) => {
    setIsFilterLoading(true);
    setSelectedAdventureId(adventureId);
    await fetchLeaderboard();
    setIsFilterLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl min-h-screen"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center text-indigo-700">Leaderboard</h1>
      <div className="mb-6">
        <label htmlFor="adventure-select" className="block mb-2 text-sm sm:text-base font-medium text-gray-700">Filter by Adventure:</label>
        <select
          id="adventure-select"
          className="w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          onChange={(e) => handleAdventureChange(e.target.value || undefined)}
          value={selectedAdventureId || ''}
        >
          <option value="">All Adventures</option>
          {adventures.map((adventure) => (
            <option key={adventure.id} value={adventure.id}>
              {adventure.name}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {isFilterLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <Leaderboard entries={leaderboardEntries} adventureId={selectedAdventureId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
