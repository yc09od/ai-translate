'use client';

import { useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar';
import MainPanel from '../components/MainPanel';
import UserProfilePanel from '../components/UserProfilePanel';

type View = 'main' | 'userProfile';

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState<{ id: string; title: string } | null>(null);
  const [view, setView] = useState<View>('main');

  return (
    <AuthGuard>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar
          selectedTopic={selectedTopic}
          onSelectTopic={setSelectedTopic}
          onOpenUserProfile={() => setView('userProfile')}
        />
        {view === 'userProfile' ? (
          <UserProfilePanel onClose={() => setView('main')} />
        ) : (
          <MainPanel selectedTopic={selectedTopic} />
        )}
      </div>
    </AuthGuard>
  );
}
