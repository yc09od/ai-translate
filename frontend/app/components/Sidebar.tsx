'use client';

import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';

const MOCK_TOPICS = [
  'cosc1908 课程',
  '商务会议',
  '旅行对话',
  '医疗问诊',
  '法律咨询',
  '技术面试',
  '日常闲聊',
  '新闻播报',
  '学术报告',
  '餐厅点餐',
  '机场对话',
  '酒店入住',
  '购物指南',
  '银行开户',
  '租房谈判',
  '健身教练',
  '博物馆导览',
  '电影讨论',
  '体育赛事',
  '天气预报',
  '交通问路',
  '紧急求助',
  '邮局寄件',
  '图书馆借书',
  '药店买药',
  '理发店预约',
  '汽车修理',
  '网购客服',
  '学校家长会',
  '职场晋升',
  '创业融资',
  '移民咨询',
];

interface SidebarProps {
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
}

export default function Sidebar({ selectedTopic, onSelectTopic }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState('');

  return (
    <aside
      className="flex h-screen flex-col justify-between bg-indigo-600 py-2 transition-all duration-300 overflow-x-hidden"
      style={{ width: expanded ? 240 : 56, alignItems: 'center' }}
    >
      {/* 上半部分：标题栏 + topic 列表 */}
      <div className="flex flex-col w-full" style={{ flex: 1, overflow: 'hidden' }}>
        {/* 顶部：标题 + 展开/收起 icon */}
        <div
          className="flex items-center w-full"
          style={{ justifyContent: expanded ? 'space-between' : 'center', padding: expanded ? '0 15px' : '0' }}
        >
          {expanded && (
            <span style={{ color: 'white', fontWeight: 600, fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              AI 实时翻译
            </span>
          )}
          <IconButton
            onClick={() => setExpanded(!expanded)}
            sx={{
              color: 'white',
              border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: '6px',
              padding: '4px',
            }}
          >
            {expanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </div>

        {/* 展开时：topic 列表 + 新增 topic */}
        {expanded && (
          <div className="flex flex-col mt-4" style={{ padding: '0 15px', gap: '4px' }}>
            {/* Topic 过滤输入框 */}
            <input
              type="text"
              placeholder="搜索 topic..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
                padding: '6px 10px',
                marginBottom: '6px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />

            {/* 可滚动的 topic 列表，最高 80vh 减去 filter input 高度 */}
            <div className="sidebar-scroll" style={{ maxHeight: 'calc(80vh - 50px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '5px' }}>
              {MOCK_TOPICS.filter((t) => t.includes(filter)).map((topic) => (
                <button
                  key={topic}
                  onClick={() => onSelectTopic(topic)}
                  style={{
                    color: 'white',
                    background: selectedTopic === topic ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)',
                    border: selectedTopic === topic ? '1px solid rgba(255,255,255,0.6)' : 'none',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    fontSize: '14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flexShrink: 0,
                  }}
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* 新增 topic 入口 */}
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'rgba(255,255,255,0.7)',
                background: 'none',
                border: '1px dashed rgba(255,255,255,0.4)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '4px',
                flexShrink: 0,
              }}
            >
              <AddIcon fontSize="small" />
              新增 Topic
            </button>
          </div>
        )}
      </div>

      {/* 底部：设置 icon，展开时向左平移对齐 */}
      <div className="w-full" style={{ padding: expanded ? '0 15px' : '0', display: 'flex', justifyContent: expanded ? 'flex-end' : 'center' }}>
        <IconButton sx={{ color: 'white' }}>
          <SettingsIcon />
        </IconButton>
      </div>
    </aside>
  );
}
