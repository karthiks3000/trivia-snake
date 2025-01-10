import React from 'react';
import { Button } from './ui/Button';
import { UserProfile } from '../App';
import { LogOut, MoveHorizontal, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { slideIn } from '../styles/theme';

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
    <motion.header 
      className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg border-b-2 border-white/10 backdrop-blur-sm"
      initial="initial"
      animate="animate"
      variants={slideIn}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="text-3xl font-bold text-white hover:text-gray-200 transition-colors">
              Trivia Snake
            </Link>
          </motion.div>

          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate('/game/adventure-selection')} className="bg-indigo-500 hover:bg-indigo-600">
                <MoveHorizontal className="w-4 h-4 mr-2"/>
                Adventures
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate('/game/leaderboard')} className="bg-purple-500 hover:bg-purple-600">
                <Trophy className="w-4 h-4 mr-2"/>
                Leaderboard
              </Button>
            </motion.div>

            <motion.span 
              className="text-white/90 bg-white/10 px-3 py-1 rounded-full"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Welcome, <span className="font-medium">{userProfile?.username}</span>
            </motion.span>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onSignOut}
                className="text-white hover:bg-white/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
