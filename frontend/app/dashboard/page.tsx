'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MainPanel from '../components/MainPanel';

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar selectedTopic={selectedTopic} onSelectTopic={setSelectedTopic} />
      <MainPanel selectedTopic={selectedTopic} />
    </div>
  );
}
