import { useState } from 'react';
import LandingHero from './components/LandingHero';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ConsolePage from './components/ConsolePage';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('/');

  return (
    <>
      {currentRoute === '/' && <LandingHero onNavigate={(r) => setCurrentRoute(r)} />}
      {currentRoute === '/login' && <LoginPage onNavigate={(r) => setCurrentRoute(r)} />}
      {currentRoute === '/signup' && <SignupPage onNavigate={(r) => setCurrentRoute(r)} />}
      {currentRoute === '/console' && <ConsolePage onNavigate={(r) => setCurrentRoute(r)} />}
    </>
  );
}
