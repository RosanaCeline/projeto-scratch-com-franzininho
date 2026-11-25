import { useCallback, useState } from 'react';
import HomeScreen from './components/HomeScreen.jsx';
import HowToPlayScreen from './components/HowToPlayScreen.jsx';
import SubjectsScreen from './components/SubjectsScreen.jsx';
import MapsScreen from './components/MapsScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import FinishScreen from './components/FinishScreen.jsx';
import LegacyGame from './components/LegacyGame.jsx';

export default function App() {
  const [motorPronto, setMotorPronto] = useState(false);
  const marcarMotorPronto = useCallback(() => setMotorPronto(true), []);

  return (
    <>
      <LegacyGame onReady={marcarMotorPronto} />
      {motorPronto && (
        <>
          <HomeScreen active />
          <HowToPlayScreen />
          <SubjectsScreen />
          <MapsScreen />
          <GameScreen />
          <FinishScreen />
        </>
      )}
    </>
  );
}
