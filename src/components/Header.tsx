import React from 'react';
import { Button } from './ui/Button';
import { UserProfile } from '../App';
import { LogOut, MoveHorizontal, Trophy } from 'lucide-react';
import { Adventure } from './AdventureSelection';
import { Link } from 'react-router-dom';

interface HeaderProps {
  userProfile?: UserProfile;
  showAdventureSelection: boolean;
  selectedAdventure?: Adventure;
  onChangeAdventure: () => void;
  onShowLeaderboard: () => void;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({
  userProfile,
  showAdventureSelection,
  selectedAdventure,
  onChangeAdventure,
  onShowLeaderboard,
  onSignOut
}) => {
  const formatAdventureName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl font-bold text-white hover:text-gray-200 transition-colors">
              Trivia Snake
            </Link>
          </div>
          
          <div className="flex-grow text-center">
            {selectedAdventure && !showAdventureSelection && (
              <div className="text-white font-medium">
                {formatAdventureName(selectedAdventure.name)}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onChangeAdventure}
              className="text-white hover:bg-white/10"
            >
              <MoveHorizontal className="w-4 h-4 mr-2" />
              Change Adventure
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onShowLeaderboard}
              className="text-white hover:bg-white/10"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
            
            <span className="text-white/90">
              Welcome, <span className="font-medium">{userProfile?.username}</span>
            </span>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onSignOut}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;