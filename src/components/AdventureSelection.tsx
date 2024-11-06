import React from 'react';
import { UserProfile } from '../App';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Book, History, Atom } from 'lucide-react';

interface AdventureSelectionProps {
  userProfile: UserProfile | undefined;
  onAdventureSelect: (adventure: string) => void;
}

const AdventureSelection: React.FC<AdventureSelectionProps> = ({ userProfile, onAdventureSelect }) => {
  const adventures = [
    { id: 'harry_potter', name: 'Harry Potter', image: '/images/harry_potter.jpg', icon: <Book className="h-6 w-6" /> },
    { id: 'history', name: 'History', image: '/images/history.jpg', icon: <History className="h-6 w-6" /> },
    { id: 'science', name: 'Science', image: '/images/science.jpg', icon: <Atom className="h-6 w-6" /> },
  ];

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-6">Choose Your Adventure</h1>
      <p className="text-xl mb-8">Welcome, <span className="font-semibold">{userProfile?.username}</span>!</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {adventures.map((adventure) => (
          <Card key={adventure.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="p-0">
              <img src={adventure.image} alt={adventure.name} className="w-full h-48 object-cover" />
            </CardHeader>
            <CardContent className="pt-6">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                {adventure.icon}
                {adventure.name}
              </CardTitle>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => onAdventureSelect(adventure.id)}>
                Start Adventure
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdventureSelection;