import { useAuth } from './auth/useAuth';
import { isMockMode } from './env';
import { Scene } from './scene/Scene';
import { CallbackRoute } from './ui/CallbackRoute';
import { LoginScreen } from './ui/LoginScreen';

export default function App() {
  const { isAuthed } = useAuth();

  if (window.location.pathname === '/callback') {
    return <CallbackRoute />;
  }
  if (!isAuthed && !isMockMode()) {
    return <LoginScreen />;
  }
  return <Scene />;
}
