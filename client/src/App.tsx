import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import PortfolioPage from './pages/Portfolio';
import WatchlistPage from './pages/Watchlist';
import FundDetailPage from './pages/FundDetail';
import PositionEditPage from './pages/PositionEdit';
import FundHistoryPage from './pages/FundHistory';
import ImportPage from './pages/Import';
import GroupManagerPage from './pages/GroupManager';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/portfolio" replace />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/groups" element={<GroupManagerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/fund/:code" element={<FundDetailPage />} />
          <Route path="/fund/:code/edit" element={<PositionEditPage />} />
          <Route path="/fund/:code/history" element={<FundHistoryPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
