import { useAuth } from './auth/useAuth';
import { CallbackRoute } from './ui/CallbackRoute';
import { LoginScreen } from './ui/LoginScreen';

export default function App() {
  const { isAuthed } = useAuth();

  if (window.location.pathname === '/callback') {
    return <CallbackRoute />;
  }
  if (!isAuthed) {
    return <LoginScreen />;
  }
  return (
    <div className="h-full flex items-center justify-center text-white">
      <p>Authenticated - scene goes here.</p>
    </div>
  );
}
