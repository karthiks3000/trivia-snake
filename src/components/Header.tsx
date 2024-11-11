import React from 'react';
import { Button } from './ui/Button';
import { UserProfile } from '../App';
import { LogOut, MoveHorizontal, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  userProfile?: UserProfile;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({
  userProfile,
  onSignOut
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl font-bold text-white hover:text-gray-200 transition-colors">
              Trivia Snake
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/game/adventure-selection')}>
              <MoveHorizontal className="w-4 h-4 mr-2"/>
              Adventures
            </Button>
            <Button onClick={() => navigate('/game/leaderboard')}>
              <Trophy className="w-4 h-4 mr-2"/>
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