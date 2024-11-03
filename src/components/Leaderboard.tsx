// Leaderboard.tsx
import React from 'react';
import { useGameContext } from './GameContext';

interface LeaderboardEntry {
  username: string;
  score: number;
  time: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries }) => {
  const { formatTime } = useGameContext();

  return (
    <table className="w-full mb-4">
      <thead>
        <tr className="bg-gray-200">
          <th className="p-2 text-left">Rank</th>
          <th className="p-2 text-left">Username</th>
          <th className="p-2 text-left">Score</th>
          <th className="p-2 text-left">Time</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => (
          <tr key={index} className="border-b">
            <td className="p-2">{index + 1}</td>
            <td className="p-2">{entry.username}</td>
            <td className="p-2">{entry.score}</td>
            <td className="p-2">{formatTime(entry.time)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export {Leaderboard};
export type {LeaderboardEntry};
