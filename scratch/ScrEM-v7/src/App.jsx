import { useCallback, useState } from 'react';
import HomeScreen from './components/HomeScreen.jsx';
import LegacyGame from './components/LegacyGame.jsx';

export default function App() {
  const [motorPronto, setMotorPronto] = useState(false);
  const marcarMotorPronto = useCallback(() => setMotorPronto(true), []);

  return (
    <>
      <LegacyGame onReady={marcarMotorPronto} />
      <HomeScreen active={motorPronto} />
    </>
  );
}
