import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  {
    path: '/portfolio',
    label: '持有',
    icon: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  },
  {
    path: '/watchlist',
    label: '自选',
    icon: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100/50 z-50 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center pt-2 pb-1.5 transition-colors ${
                isActive ? 'text-morandi-blue' : 'text-gray-400'
              }`}
            >
              <svg className="w-6 h-6 mb-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d={tab.icon} />
              </svg>
              <span className={`text-[12px] ${isActive ? 'font-medium' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
