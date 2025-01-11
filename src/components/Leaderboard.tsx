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
    <div className="w-full h-full overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)]">
        <table className="w-full mb-4 min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Adventure</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEntries.map((entry, index) => (
              <tr key={`${entry.userId}-${entry.adventureId}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{entry.username}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{entry.adventureName}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{entry.score}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{formatTime(entry.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="sm:hidden">
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {filteredEntries.map((entry, index) => (
            <div key={`${entry.userId}-${entry.adventureId}`} className="bg-white px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-indigo-600 truncate">
                  {entry.username}
                </div>
                <div className="ml-2 flex-shrink-0 flex">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Rank: {index + 1}
                  </span>
                </div>
              </div>
              <div className="mt-1 flex justify-between">
                <p className="text-xs text-gray-500">
                  Score: {entry.score}
                </p>
                <p className="text-xs text-gray-500">
                  Time: {formatTime(entry.time)}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-500 truncate">
                Adventure: {entry.adventureName}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { Leaderboard };
export type { LeaderboardEntry };
