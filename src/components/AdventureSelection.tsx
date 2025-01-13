import React, { useState, useEffect } from 'react';
import { UserProfile } from '../App';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Plus, Loader2, Search } from 'lucide-react';
import api from '../api';
import { Alert, AlertDescription, AlertTitle } from "./ui/Alert";
import AdventureCreation, { GENRES } from './AdventureCreation';
import { Question } from './QuestionForm';
import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { useNavigate } from 'react-router-dom';
import GameModeModal from './GameModeModal';

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
  userProfile: UserProfile | undefined;
}

const AdventureSelection: React.FC<AdventureSelectionProps> = ({ userProfile }) => {
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
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-6">Choose Your Adventure</h1>
      <div className="flex justify-center space-x-4 mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search adventures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <Select onValueChange={setSelectedGenre} value={selectedGenre}>
          <SelectTrigger className="w-[180px]">
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="genre">Genre</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-[400px]">
          <CardHeader className="p-0">
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            <CardTitle className="text-xl text-center">Create Custom Adventure</CardTitle>
          </CardContent>
          <CardFooter className="p-4">
            <Button 
              onClick={() => setIsCreateModalOpen(true)} 
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="h-6 w-6" />
              Create
            </Button>
          </CardFooter>
        </Card>
        {filteredAdventures.map((adventure) => (
          <Card key={adventure.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-[400px]">
            <CardHeader className="p-0">
              <img src={adventure.image_url} alt={adventure.name} className="w-full h-48 object-cover" />
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col justify-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl mb-2">
                {adventure.name}
              </CardTitle>
              {/* display the adventure description text */}
              <p className="text-sm text-gray-500 mb-2">{adventure.description}</p>
              <p className="text-sm text-gray-500 mb-2">{adventure.genre}</p>
            </CardContent>
            <CardFooter className="p-4">
              <Button 
                className="w-full" 
                onClick={() => handleAdventureSelect(adventure)}
                disabled={adventure.verificationStatus !== 'verified'}
              >
                {adventure.verificationStatus === 'verified' ? 'Start Adventure' : 'Not Available'}
              </Button>
            </CardFooter>
          </Card>
        ))}
        
      </div>

      <AdventureCreation
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAdventureCreated={handleAdventureCreated}
        userProfile={userProfile}
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