import React from 'react';
import { Button } from './ui/Button';
import { UserProfile } from '../App';
import { LogOut, MoveHorizontal } from 'lucide-react';

interface HeaderProps {
  userProfile?: UserProfile;
  showAdventureSelection: boolean;
  selectedAdventure: string;
  onChangeAdventure: () => void;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({
  userProfile,
  showAdventureSelection,
  selectedAdventure,
  onChangeAdventure,
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
            <h1 className="text-2xl font-bold text-white">Trivia Snake</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {selectedAdventure && !showAdventureSelection && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-white/80">Current Adventure:</span>
                <span className="text-white font-medium">
                  {formatAdventureName(selectedAdventure)}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <span className="text-white/90">
                Welcome, <span className="font-medium">{userProfile?.username}</span>
              </span>
              
              {!showAdventureSelection && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={onChangeAdventure}
                >
                  <MoveHorizontal className="w-4 h-4 mr-2" />
                  Change Adventure
                </Button>
              )}
              
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
      </div>
    </header>
  );
};

export default Header;