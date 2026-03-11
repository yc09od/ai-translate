'use client';

import { useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar';
import MainPanel from '../components/MainPanel';

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  return (
    <AuthGuard>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar selectedTopic={selectedTopic} onSelectTopic={setSelectedTopic} />
        <MainPanel selectedTopic={selectedTopic} />
      </div>
    </AuthGuard>
  );
}
