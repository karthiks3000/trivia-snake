import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/Dialog';
import { Button } from './ui/Button';

interface GameModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'single' | 'multiplayer') => void;
  adventureName: string;
}

const GameModeModal: React.FC<GameModeModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  adventureName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Game Mode</DialogTitle>
          <DialogDescription>
            Select how you want to play "{adventureName}"
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button 
            onClick={() => onSelectMode('single')}
            className="w-full h-20 text-lg"
          >
            Single Player
            <br />
            <span className="text-sm opacity-70">Play on your own</span>
          </Button>
          <Button 
            onClick={() => onSelectMode('multiplayer')}
            className="w-full h-20 text-lg"
          >
            Multiplayer
            <br />
            <span className="text-sm opacity-70">Compete with others in real-time</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameModeModal;
