import React, { useState, useEffect } from 'react';
import { Leaderboard, LeaderboardEntry } from './Leaderboard';
import api from '../api';
import { Adventure } from './AdventureSelection';
import LoadingIndicator from './LoadingIndicator';


const LeaderboardPage: React.FC = () => {
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [selectedAdventureId, setSelectedAdventureId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leaderboardResponse, adventuresResponse] = await Promise.all([
        api.getLeaderboard(),
        api.getAdventures()
      ]);
      setLeaderboardEntries(leaderboardResponse.data);
      setAdventures(adventuresResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingIndicator />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label htmlFor="adventure-select" className="block mb-2">Filter by Adventure:</label>
            <select
              id="adventure-select"
              className="w-full p-2 border rounded"
              onChange={(e) => setSelectedAdventureId(e.target.value || undefined)}
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
          <Leaderboard entries={leaderboardEntries} adventureId={selectedAdventureId} />
        </>
      )}
    </div>
  );
};

export default LeaderboardPage;
