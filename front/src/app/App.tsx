import { useGameSocket } from '../features/game-sync/lib/useGameSocket'
import { useTelegramUser } from '../entities/viewer/lib/useTelegramUser'
import RootNavigator from '../pages/root/ui/RootNavigator'
import { ReconnectBanner } from '../features/game-sync/ui/ReconnectBanner'
import './styles/App.css'

function App() {
  useGameSocket();
  useTelegramUser();

  return (
    <div className="app-shell">
      <RootNavigator />
      <ReconnectBanner />
    </div>
  );
}

export default App;