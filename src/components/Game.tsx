import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GameProvider, useGameContext } from './GameContext';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';
import GameOverScreen from './GameOverScreen';
import GameScreen from './GameScreen';
import api from '../api';
import { LeaderboardEntry } from './Leaderboard';
import { UserProfile } from '../App';
import { Card, CardContent } from './ui/Card';
import { Adventure } from './AdventureSelection';
import { useLocation, useParams } from 'react-router-dom';
import CountdownBuffer from './CountdownBuffer';

interface GameProps {
  userProfile: UserProfile;
}

interface LocationState {
  adventure: Adventure;
}

const GameInner: React.FC<GameProps> = ({  userProfile }) => {
  const { adventureId } = useParams();
  const location = useLocation();
  const [showCountdown, setShowCountdown] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { 
    setScore, 
    setGameOver, 
    setGameWon, 
    updateLeaderboard: updateLeaderboardFromContext,
    score,
    elapsedTime,
    setElapsedTime,
    gameOver,
  } = useGameContext();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get the adventure from location state
  useEffect(() => {
    const state = location.state as LocationState;
    setIsLoading(true);
    
    if (state?.adventure) {
      setAdventure(state.adventure);
      setShowCountdown(true);
      setIsLoading(false);
    } else {
      // Only fetch if we don't have the adventure in state
      fetchQuestions()
        .then(() => {
          setShowCountdown(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    
    // Fetch leaderboard separately
    fetchLeaderboard();
  }, [location.state]);

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await api.getLeaderboard();
      setLeaderboard(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getAdventure(adventureId!);
      if (!response.data) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Adventure = await response.data;
      setAdventure(data);
      setError(null);
      
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError("Error loading game data. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [adventureId]);

  // useEffect(() => {
  //   fetchQuestions();
  //   fetchLeaderboard();
  // }, [fetchQuestions, fetchLeaderboard]);


  const resetGame = useCallback(() => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setElapsedTime(0);
    fetchQuestions();
  }, [setScore, setGameOver, setGameWon, setElapsedTime, fetchQuestions]);

  const handleCorrectAnswer = () => {
    setScore(prevScore => {
      const newScore = prevScore + 1;
      console.log("incrementing score to " + newScore);
      if (currentQuestionIndex === adventure!.questions.length - 1) {
        setGameWon(true);
        setGameOver(true);
        updateLeaderboardFromContext(newScore, adventure!).then(() => fetchLeaderboard());
      } else {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      }
      return newScore;
    });
  };

  const handleWrongAnswer = () => {
    setGameOver(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    updateLeaderboardFromContext(score, adventure!).then(() => fetchLeaderboard());
  };

  useEffect(() => {
    if (!gameOver) {
      timerRef.current = setInterval(() => setElapsedTime(prevTime => prevTime + 1), 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameOver, setElapsedTime]);

  if (showCountdown) {
    return <CountdownBuffer preText='Starting game in' onComplete={handleCountdownComplete} />
  }
  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen />;
  if (gameOver) return <GameOverScreen resetGame={resetGame} leaderboard={leaderboard} />;
  
  
  if (adventure) {
    return (
      <Card className="w-full h-full">
        <CardContent className="p-0">
          <GameScreen
            adventure={adventure}
            currentQuestionIndex={currentQuestionIndex}
            handleCorrectAnswer={handleCorrectAnswer}
            handleWrongAnswer={handleWrongAnswer}
          />
        </CardContent>
      </Card>
    );
  }

  return null;
};

const Game: React.FC<GameProps> = ({ userProfile }) => {
  return (
    <GameProvider userProfile={userProfile}>
      <GameInner userProfile={userProfile} />
    </GameProvider>
  );
};

export default Game;
