// Leaderboard.tsx
import React from 'react';
import { formatTime } from '../lib/utils';


interface LeaderboardEntry {
  userId: string;
  username?: string;
  score: number;
  time: number;
  adventureId: string;
  adventureName: string;
}

interface LeaderboardProps {
  entries?: LeaderboardEntry[];
  adventureId?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, adventureId }) => {


  const filteredEntries = (adventureId
    ? (entries ? entries.filter(entry => entry.adventureId === adventureId) : [])
    : entries ? entries : [])
    .sort((a, b) => b.score === a.score ? a.time - b.time : b.score - a.score);

  return (
    <div >
      <table className="w-full mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-left">Rank</th>
            <th className="p-2 text-left">Username</th>
            <th className="p-2 text-left">Adventure</th>
            <th className="p-2 text-left">Score</th>
            <th className="p-2 text-left">Time</th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map((entry, index) => (
            <tr key={`${entry.userId}-${entry.adventureId}`} className="border-b">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{entry.username}</td>
              <td className="p-2">{entry.adventureName}</td>
              <td className="p-2">{entry.score}</td>
              <td className="p-2">{formatTime(entry.time)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { Leaderboard };
export type { LeaderboardEntry };
