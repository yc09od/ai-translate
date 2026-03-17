'use client';

import { useSelector } from 'react-redux';
import type { RootState } from './store/store';

export type Language = 'en' | 'zh';

export const dict = {
  en: {
    // Sidebar
    sidebarTitle: 'AI Live Translation',
    searchTopicPlaceholder: 'Search topic...',
    newTopicPlaceholder: 'Topic name...',
    addTopic: 'New Topic',
    userProfile: 'User Profile',
    adminPanel: 'Admin Panel',
    logout: 'Logout',
    language: 'Language / 语言',
    deleteTopicTitle: 'Delete Topic',
    deleteTopicConfirm: 'Are you sure you want to delete this Topic? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    // TopicHeader
    selectOrCreateTopic: 'Select or create a Topic',
    exportHistoryTitle: 'Export history',
    exporting: 'Exporting...',
    export: 'Export',
    exportAsPdf: '📄 Export as PDF',
    exportAsTxt: '📝 Export as TXT',
    // BottomInputBar
    recording: 'Recording',
    inputPlaceholder: 'Type text to translate...',
    submit: 'Submit',
    // TranslationList
    translationEmpty: 'Translation will appear here...',
    loadPrevious10: 'Load previous 10',
    loadAllPrevious: 'Load all previous',
    // MainPanel
    selectTopicBeforeRecording: 'Please select a Topic before recording.',
    translating: '(Translating...)',
    translationTimeout: '(Translation timed out)',
    microphoneError: 'Cannot access microphone, please check browser permissions.',
    // UserProfilePanel
    userProfileTitle: 'User Profile',
    email: 'Email',
    userName: 'User Name',
    saving: 'Saving...',
    save: 'Save',
    saved: 'Saved!',
    saveFailed: 'Save failed. Please try again.',
    loading: 'Loading...',
    // Login
    loginTitle: 'AI Live Translation',
    loginWithGoogle: 'Sign in with Google',
    loginWithHotmail: 'Sign in with Hotmail',
    loginAgreement: 'By signing in, you agree to our',
    loginPrivacyPolicy: 'Privacy Policy',
    loginAnd: 'and',
    loginTerms: 'Terms of Service',
    // Activation
    activateTitle: 'Activate Account',
    activatePlaceholder: 'Enter invitation code',
    activateSubmit: 'Activate',
    activateActivating: 'Activating...',
    activateSuccess: 'Activated! Redirecting...',
    activateError: 'Invalid or already used invitation code',
  },
  zh: {
    // Sidebar
    sidebarTitle: 'AI 实时翻译',
    searchTopicPlaceholder: '搜索 topic...',
    newTopicPlaceholder: 'Topic 名称...',
    addTopic: '新增 Topic',
    userProfile: 'User Profile',
    adminPanel: '管理后台',
    logout: '退出登录',
    language: 'Language / 语言',
    deleteTopicTitle: '删除 Topic',
    deleteTopicConfirm: '确定要删除这个 Topic 吗？此操作不可撤销。',
    cancel: '取消',
    delete: '删除',
    // TopicHeader
    selectOrCreateTopic: '请选择或新建 Topic',
    exportHistoryTitle: '导出历史记录',
    exporting: '导出中...',
    export: '导出',
    exportAsPdf: '📄 导出为 PDF',
    exportAsTxt: '📝 导出为 TXT',
    // BottomInputBar
    recording: 'Recording',
    inputPlaceholder: '输入文字进行翻译...',
    submit: '提交',
    // TranslationList
    translationEmpty: '翻译内容将显示在此处...',
    loadPrevious10: '查看之前十条',
    loadAllPrevious: '查看之前所有记录',
    // MainPanel
    selectTopicBeforeRecording: '请先选择一个 Topic 再开始录音。',
    translating: '（翻译中...）',
    translationTimeout: '（翻译超时）',
    microphoneError: '无法访问麦克风，请检查浏览器权限。',
    // UserProfilePanel
    userProfileTitle: 'User Profile',
    email: 'Email',
    userName: 'User Name',
    saving: 'Saving...',
    save: 'Save',
    saved: 'Saved!',
    saveFailed: 'Save failed. Please try again.',
    loading: 'Loading...',
    // Login
    loginTitle: 'AI 实时翻译',
    loginWithGoogle: '使用 Gmail 登录',
    loginWithHotmail: '使用 Hotmail 登录',
    loginAgreement: '登录即表示您同意我们的',
    loginPrivacyPolicy: '隐私政策',
    loginAnd: '和',
    loginTerms: '服务条款',
    // Activation
    activateTitle: '激活账户',
    activatePlaceholder: '输入邀请码',
    activateSubmit: '激活',
    activateActivating: '激活中...',
    activateSuccess: '激活成功！正在跳转...',
    activateError: '邀请码无效或已被使用',
  },
} as const;

export type I18nDict = typeof dict.en;

export function useLanguage() {
  const lang = useSelector((state: RootState) => state.language.lang);
  return { lang, t: dict[lang] };
}
