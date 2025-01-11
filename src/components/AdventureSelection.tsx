import React, { useState, useEffect, useRef, TouchEvent } from 'react';
import { ExtendedUserProfile } from './AdventureCreation';
import AdventureCreation from './AdventureCreation';
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

const GENRES = ['Fantasy', 'Sci-Fi', 'Mystery', 'Horror', 'Adventure', 'Historical', 'Educational'];

const AdventureSelection: React.FC<AdventureSelectionProps> = ({ userProfile }) => {
  const [isCreateAdventureOpen, setIsCreateAdventureOpen] = useState(false);
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('name');
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
      navigate(`/game/${selectedAdventure.id}`, {
        state: { adventure: selectedAdventure }
      });
    } else {
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
    fetchAdventures();
  };

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
    <div 
      className="min-h-screen bg-gray-100 py-2 flex flex-col justify-center sm:py-4"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative py-2 sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto w-full">
        <div className="relative px-4 py-6 bg-white shadow-lg sm:rounded-3xl sm:p-10 overflow-y-auto max-h-[90vh]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center text-indigo-700">
            Choose Your Adventure
          </h1>
          
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search adventures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Select onValueChange={setSelectedGenre} value={selectedGenre}>
                <SelectTrigger className="w-full sm:w-1/2">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="All" value="All">All</SelectItem>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={setSortBy} value={sortBy}>
                <SelectTrigger className="w-full sm:w-1/2">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="genre">Genre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col min-h-[300px] transform hover:scale-105">
                  <CardHeader className="p-0">
                    <div className="w-full h-36 bg-indigo-100 flex items-center justify-center">
                      <Plus className="h-10 w-10 text-indigo-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-center justify-center">
                    <CardTitle className="text-lg text-center text-indigo-700">Create Custom Adventure</CardTitle>
                  </CardContent>
                  <CardFooter className="p-2">
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
              {filteredAdventures.map((adventure, index) => (
                <motion.div
                  key={adventure.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Card 
                    className={`overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col min-h-[300px] transform hover:scale-105 cursor-pointer ${adventure.verificationStatus !== 'verified' ? 'opacity-50' : ''}`}
                    onClick={() => adventure.verificationStatus === 'verified' ? handleAdventureSelect(adventure) : null}
                  >
                    <CardHeader className="p-0">
                      <img src={adventure.image_url} alt={adventure.name} className="w-full h-36 object-cover" />
                    </CardHeader>
                    <CardContent className="pt-4 flex-grow flex flex-col justify-center">
                      <CardTitle className="flex items-center justify-center gap-2 text-lg mb-1 text-indigo-700">
                        {adventure.name}
                      </CardTitle>
                      <p className="text-xs text-gray-600 mb-1">{adventure.description}</p>
                      <p className="text-xs text-indigo-500 mb-1 font-semibold">{adventure.genre}</p>
                    </CardContent>
                    <CardFooter className="p-2">
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
            </AnimatePresence>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default AdventureSelection;
