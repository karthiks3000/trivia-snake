import React, { useState, useEffect } from 'react';
import { UserProfile } from '../App';
import AdventureCreation, { ExtendedUserProfile } from './AdventureCreation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Plus, Loader2, Search } from 'lucide-react';
import api from '../api';
import { Alert, AlertDescription, AlertTitle } from "./ui/Alert";
import { Question } from './QuestionForm';
import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { useNavigate } from 'react-router-dom';
import GameModeModal from './GameModeModal';
import { motion, AnimatePresence } from 'framer-motion';

export interface Adventure {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  questions: Question[];
  createdBy?: string;
  verificationStatus?: string;
  genre: string;
}

interface AdventureSelectionProps {
  userProfile: ExtendedUserProfile | undefined;
}

// Define GENRES if it's not exported from AdventureCreation
const GENRES = ['Fantasy', 'Sci-Fi', 'Mystery', 'Horror', 'Adventure', 'Historical', 'Educational'];

const AdventureSelection: React.FC<AdventureSelectionProps> = ({ userProfile }) => {
  const [isCreateAdventureOpen, setIsCreateAdventureOpen] = useState(false);
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('name');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [filteredAdventures, setFilteredAdventures] = useState<Adventure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [isGameModeModalOpen, setIsGameModeModalOpen] = useState(false);
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  
  useEffect(() => {
    fetchAdventures();
  }, []);

  const handleAdventureSelect = (adventure: Adventure) => {
    setSelectedAdventure(adventure);
    setIsGameModeModalOpen(true);
  };

  const handleGameModeSelect = (mode: 'single' | 'multiplayer') => {
    if (!selectedAdventure) return;

    if (mode === 'single') {
      // Navigate to single player game
      navigate(`/game/${selectedAdventure.id}`, {
        state: { adventure: selectedAdventure }
      });
    } else {
      // Navigate to multiplayer lobby
      navigate(`/game/multiplayer/${selectedAdventure.id}`, {
        state: { adventure: selectedAdventure }
      });
    }
    setIsGameModeModalOpen(false);
  };

  useEffect(() => {
    const filtered = adventures.filter(adventure => 
      adventure.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedGenre === 'All' || adventure.genre === selectedGenre)
    );
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'genre') {
        return a.genre.localeCompare(b.genre);
      }
      return 0;
    });
    setFilteredAdventures(sorted);
  }, [adventures, searchTerm, selectedGenre, sortBy]);

  const fetchAdventures = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAdventures();
      setAdventures(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch adventures. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdventureCreated = () => {
    setIsCreateModalOpen(false);
    fetchAdventures();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div 
      className="text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1 
        className="text-4xl font-bold mb-8 text-indigo-700"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Choose Your Adventure
      </motion.h1>
      <motion.div 
        className="flex justify-center space-x-4 mb-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="relative">
          <Input
            type="text"
            placeholder="Search adventures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <Select onValueChange={setSelectedGenre} value={selectedGenre}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="All" value="All">All</SelectItem>
            {GENRES.map((genre: string) => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setSortBy} value={sortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="genre">Genre</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <AnimatePresence>
          {filteredAdventures.map((adventure, index) => (
            <motion.div
              key={adventure.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Card 
                className={`overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col min-h-[400px] transform hover:scale-105 cursor-pointer ${adventure.verificationStatus !== 'verified' ? 'opacity-50' : ''}`}
                onClick={() => adventure.verificationStatus === 'verified' ? handleAdventureSelect(adventure) : null}
              >
                <CardHeader className="p-0">
                  <img src={adventure.image_url} alt={adventure.name} className="w-full h-48 object-cover" />
                </CardHeader>
                <CardContent className="pt-6 flex-grow flex flex-col justify-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-xl mb-2 text-indigo-700">
                    {adventure.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mb-2">{adventure.description}</p>
                  <p className="text-sm text-indigo-500 mb-2 font-semibold">{adventure.genre}</p>
                </CardContent>
                <CardFooter className="p-4">
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                    disabled={adventure.verificationStatus !== 'verified'}
                  >
                    {adventure.verificationStatus === 'verified' ? 'Start Adventure' : 'Not Available'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ delay: filteredAdventures.length * 0.1, duration: 0.3 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col min-h-[400px] transform hover:scale-105">
              <CardHeader className="p-0">
                <div className="w-full h-48 bg-indigo-100 flex items-center justify-center">
                  <Plus className="h-12 w-12 text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex items-center justify-center">
                <CardTitle className="text-xl text-center text-indigo-700">Create Custom Adventure</CardTitle>
              </CardContent>
              <CardFooter className="p-4">
                <Button 
                  onClick={() => setIsCreateAdventureOpen(true)} 
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="h-6 w-6" />
                  Create
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </motion.div>

        <AdventureCreation
          isOpen={isCreateAdventureOpen}
          onClose={() => setIsCreateAdventureOpen(false)}
          onAdventureCreated={handleAdventureCreated}
          userProfile={userProfile as ExtendedUserProfile}
        />

      <GameModeModal
        isOpen={isGameModeModalOpen}
        onClose={() => setIsGameModeModalOpen(false)}
        onSelectMode={handleGameModeSelect}
        adventureName={selectedAdventure?.name || ''}
      />
    </motion.div>
  );
};

export default AdventureSelection;
