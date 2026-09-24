import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { LAB_CHAT_CHANNELS } from '../../data/chatData';
import { ChatQuickSnippetsModal } from './ChatQuickSnippetsModal';
import { ChatEpisodeSelectorModal } from './ChatEpisodeSelectorModal';
import { LabChatMessage, ChatMessagePriority, LabEpisode, LabStaffUser } from '../../types';
import { 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  Zap, 
  Paperclip, 
  AlertTriangle, 
  Users, 
  Radio, 
  FlaskConical, 
  Building2, 
  Syringe, 
  Smile, 
  MoreVertical, 
  Trash2, 
  Clock, 
  Search, 
  Volume2, 
  VolumeX, 
  UserCheck, 
  ChevronDown,
  ExternalLink,
  CornerDownRight,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';

export const InternalChatDrawer: React.FC = () => {
  const {
    role,
    chatMessages,
    activeChatChannelId,
    setActiveChatChannelId,
    activeDirectUserId,
    setActiveDirectUserId,
    currentStaffUser,
    setCurrentStaffUser,
    staffUsers,
    isChatFloatingOpen,
    setIsChatFloatingOpen,
    sendChatMessage,
    markChatMessagesAsRead,
    addChatReaction,
    deleteChatMessage,
    unreadChatCount,
    setStaffActiveTab
  } = useClinic();

  const [messageInput, setMessageInput] = useState('');
  const [priority, setPriority] = useState<ChatMessagePriority>('normal');
  const [linkedEpisode, setLinkedEpisode] = useState<LabEpisode | null>(null);
  const [showSnippetsModal, setShowSnippetsModal] = useState(false);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [activeTab, setActiveTab] = useState<'canales' | 'directos'>('canales');
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  const prevUnreadCountRef = useRef(unreadChatCount);
  useEffect(() => {
    if (unreadChatCount > prevUnreadCountRef.current) {
      setIsAlertDismissed(false);
    }
    prevUnreadCountRef.current = unreadChatCount;
  }, [unreadChatCount]);

  // Find latest unread message from another user to show prompt preview
  const latestUnreadMsg = unreadChatCount > 0 
    ? [...chatMessages].reverse().find(m => !m.readBy.includes(currentStaffUser.id) && m.senderId !== currentStaffUser.id)
    : null;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatFloatingOpen) {
      scrollToBottom();
      const currentTarget = activeDirectUserId ? `dm_${activeDirectUserId}` : activeChatChannelId;
      markChatMessagesAsRead(currentTarget);
    }
  }, [isChatFloatingOpen, activeChatChannelId, activeDirectUserId, chatMessages.length]);

  if (role !== 'personal') return null;

  // Filter messages for active channel or direct chat
  const currentTargetId = activeDirectUserId ? `dm_${activeDirectUserId}` : activeChatChannelId;
  
  const filteredMessages = chatMessages.filter(msg => {
    if (activeDirectUserId) {
      // 1-on-1 Direct message: either sent by current user to target or by target to current user
      const isDirect = (msg.senderId === currentStaffUser.id && msg.recipientId === activeDirectUserId) ||
                       (msg.senderId === activeDirectUserId && msg.recipientId === currentStaffUser.id) ||
                       (msg.channelId === `dm_${activeDirectUserId}` || msg.channelId === `dm_${currentStaffUser.id}`);
      if (!isDirect) return false;
    } else {
      // Channel message
      if (msg.channelId !== activeChatChannelId) return false;
    }

    if (searchFilter.trim()) {
      const matchText = msg.content.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        msg.senderName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        (msg.referenceEpisodeNumber && msg.referenceEpisodeNumber.toLowerCase().includes(searchFilter.toLowerCase())) ||
                        (msg.referencePatientName && msg.referencePatientName.toLowerCase().includes(searchFilter.toLowerCase()));
      if (!matchText) return false;
    }
    return true;
  });

  const activeChannelObj = LAB_CHAT_CHANNELS.find(c => c.id === activeChatChannelId);
  const activeDirectUserObj = staffUsers.find(u => u.id === activeDirectUserId);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() && !linkedEpisode) return;

    sendChatMessage({
      channelId: activeDirectUserId ? `dm_${activeDirectUserId}` : activeChatChannelId,
      senderId: currentStaffUser.id,
      senderName: currentStaffUser.fullName,
      senderRole: currentStaffUser.roleName,
      senderAvatarColor: currentStaffUser.avatarColor || 'bg-teal-600',
      recipientId: activeDirectUserId || undefined,
      recipientName: activeDirectUserObj?.fullName || undefined,
      content: messageInput.trim(),
      priority,
      referenceEpisodeId: linkedEpisode?.id,
      referenceEpisodeNumber: linkedEpisode?.episodeNumber,
      referencePatientName: linkedEpisode?.patientName
    });

    setMessageInput('');
    setPriority('normal');
    setLinkedEpisode(null);
  };

  const getChannelIcon = (iconName: string) => {
    switch (iconName) {
      case 'Radio': return Radio;
      case 'Users': return Users;
      case 'FlaskConical': return FlaskConical;
      case 'AlertTriangle': return AlertTriangle;
      case 'Building2': return Building2;
      case 'Syringe': return Syringe;
      default: return MessageSquare;
    }
  };

  const getUnreadForChannel = (channelId: string) => {
    return chatMessages.filter(m => 
      m.channelId === channelId && 
      m.senderId !== currentStaffUser.id && 
      !m.readBy.includes(currentStaffUser.id)
    ).length;
  };

  const getUnreadForUser = (userId: string) => {
    return chatMessages.filter(m => 
      ((m.senderId === userId && m.recipientId === currentStaffUser.id) || (m.channelId === `dm_${userId}` && m.senderId === userId)) &&
      !m.readBy.includes(currentStaffUser.id)
    ).length;
  };

  const emojis = ['👍', '🧪', '✅', '🚨', '⏱️', '❤️'];

  return (
    <>
      {/* ========================================================================= */}
      {/* FLOATING ACTION NOTIFICATION (Only active if someone wrote and unread > 0) */}
      {/* If no new messages, it stays completely hidden so it never obstructs other UI */}
      {/* ========================================================================= */}
      {!isChatFloatingOpen && unreadChatCount > 0 && !isAlertDismissed && (
        <div className="fixed bottom-4 right-4 z-40 animate-fade-in max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl border border-teal-500/50 p-3.5 flex items-start gap-3 backdrop-blur-md">
          <div className="relative p-2 bg-teal-600 rounded-xl flex-shrink-0 text-white shadow-md">
            <MessageSquare className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-slate-900 animate-pulse">
              {unreadChatCount}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-teal-300 truncate">
                {latestUnreadMsg?.senderName || 'Nuevo mensaje en Intercom'}
              </span>
              <span className="text-[10px] text-slate-400">
                {latestUnreadMsg ? new Date(latestUnreadMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>

            <p className="text-xs text-slate-200 truncate mt-0.5">
              {latestUnreadMsg?.content || 'Tienes mensajes pendientes de leer.'}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => {
                  if (latestUnreadMsg?.channelId?.startsWith('dm_') && latestUnreadMsg.senderId !== currentStaffUser.id) {
                    setActiveDirectUserId(latestUnreadMsg.senderId);
                  }
                  setIsChatFloatingOpen(true);
                  setIsAlertDismissed(true);
                }}
                className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Responder
              </button>
              <button
                onClick={() => setIsAlertDismissed(true)}
                className="px-2 py-1 text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
              >
                Ocultar
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsAlertDismissed(true)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
            title="Ocultar aviso de chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING CHAT DOCK / WINDOW */}
      {/* ========================================================================= */}
      {isChatFloatingOpen && (
        <div
          id="internal-chat-dock"
          className={`fixed bottom-4 right-4 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 overflow-hidden ${
            isExpanded 
              ? 'w-[95vw] md:w-[780px] h-[85vh] max-h-[800px]' 
              : 'w-[92vw] sm:w-[440px] h-[600px] max-h-[90vh]'
          }`}
        >
          {/* TOP BAR */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-xs sm:text-sm text-slate-100 truncate">
                    {activeDirectUserId 
                      ? activeDirectUserObj?.fullName || 'Chat Directo'
                      : activeChannelObj?.slug || '#canal'}
                  </h3>
                  {activeDirectUserId && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {activeDirectUserId
                    ? activeDirectUserObj?.roleName
                    : activeChannelObj?.name}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Switch Identity Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-teal-300 border border-slate-700 transition-colors"
                  title="Cambiar remitente / Simular identidad de personal"
                >
                  <span className="truncate max-w-[80px] sm:max-w-[110px]">{currentStaffUser.fullName.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showUserSwitcher && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block">
                      Seleccionar Remitente Activo:
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {staffUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setCurrentStaffUser(user);
                            setShowUserSwitcher(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ${
                            currentStaffUser.id === user.id
                              ? 'bg-teal-600/30 text-teal-300 border border-teal-500/40 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="truncate">
                            <span className="block truncate font-semibold">{user.fullName}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{user.roleName}</span>
                          </div>
                          {currentStaffUser.id === user.id && (
                            <CheckCheck className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Expand / Minimize */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isExpanded ? 'Restaurar tamaño' : 'Expandir pantalla'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsChatFloatingOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CHAT BODY: SPLIT VIEW (Channels / Users Sidebar + Chat Area) */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* LEFT / CHANNELS DOCK */}
            <div className={`${isExpanded ? 'w-56' : 'w-24 sm:w-36'} bg-slate-50 dark:bg-slate-950/70 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 overflow-y-auto`}>
              {/* Tabs Canales vs Directos */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 p-1 gap-1">
                <button
                  onClick={() => setActiveTab('canales')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-colors ${
                    activeTab === 'canales'
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Canales
                </button>
                <button
                  onClick={() => setActiveTab('directos')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-colors ${
                    activeTab === 'directos'
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Directo
                </button>
              </div>

              {/* List */}
              <div className="p-1.5 space-y-1 flex-1 overflow-y-auto">
                {activeTab === 'canales' ? (
                  LAB_CHAT_CHANNELS.map(ch => {
                    const Icon = getChannelIcon(ch.icon);
                    const unread = getUnreadForChannel(ch.id);
                    const isActive = !activeDirectUserId && activeChatChannelId === ch.id;

                    return (
                      <button
                        key={ch.id}
                        onClick={() => {
                          setActiveDirectUserId(null);
                          setActiveChatChannelId(ch.id);
                          markChatMessagesAsRead(ch.id);
                        }}
                        className={`w-full text-left p-1.5 sm:p-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-1.5 transition-all ${
                          isActive
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                        }`}
                        title={ch.description}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                          <span className="truncate text-[11px] sm:text-xs">{ch.name.split(' ')[0]}</span>
                        </div>
                        {unread > 0 && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                            isActive ? 'bg-white text-teal-700' : 'bg-rose-500 text-white'
                          }`}>
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  staffUsers
                    .filter(u => u.id !== currentStaffUser.id)
                    .map(user => {
                      const unread = getUnreadForUser(user.id);
                      const isActive = activeDirectUserId === user.id;

                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            setActiveDirectUserId(user.id);
                            markChatMessagesAsRead(user.id);
                          }}
                          className={`w-full text-left p-1.5 sm:p-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-1.5 transition-all ${
                            isActive
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                          }`}
                          title={`${user.fullName} (${user.roleName})`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></div>
                            <span className="truncate text-[11px] sm:text-xs">{user.fullName.split(' ')[0]}</span>
                          </div>
                          {unread > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                              isActive ? 'bg-white text-cyan-700' : 'bg-rose-500 text-white'
                            }`}>
                              {unread}
                            </span>
                          )}
                        </button>
                      );
                    })
                )}
              </div>

              {/* Link to Full Chat View */}
              <div className="p-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setIsChatFloatingOpen(false);
                    setStaffActiveTab('chat_interno');
                  }}
                  className="w-full py-1.5 px-2 bg-slate-200 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-300 hover:text-teal-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Pantalla Completa</span>
                  <span className="sm:hidden">Full</span>
                </button>
              </div>
            </div>

            {/* RIGHT / MAIN CONVERSATION STREAM */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0">
              {/* Search within conversation */}
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en esta conversación..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full bg-transparent border-none text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
                />
                {searchFilter && (
                  <button onClick={() => setSearchFilter('')} className="text-slate-400 hover:text-slate-600 text-xs">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* MESSAGES LIST */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-12 space-y-2 text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-semibold">No hay mensajes recientes en esta conversación.</p>
                    <p className="text-[11px]">Escriba una actualización o use una plantilla rápida.</p>
                  </div>
                ) : (
                  filteredMessages.map(msg => {
                    const isMe = msg.senderId === currentStaffUser.id;
                    const isUrgent = msg.priority === 'urgente';
                    const isPanic = msg.priority === 'panico';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                      >
                        {/* Sender info */}
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{msg.senderName}</span>
                          <span>•</span>
                          <span className="text-slate-400 truncate max-w-[130px]">{msg.senderRole}</span>
                          <span>•</span>
                          <span className="font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Bubble */}
                        <div
                          className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3 shadow-xs space-y-1.5 transition-all text-xs relative ${
                            isPanic
                              ? 'bg-rose-600 text-white border-2 border-rose-400 font-medium'
                              : isUrgent
                              ? 'bg-amber-500 text-white border-2 border-amber-300 font-medium'
                              : isMe
                              ? 'bg-teal-600 text-white rounded-tr-none'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700'
                          }`}
                        >
                          {/* Priority Tag */}
                          {(isPanic || isUrgent) && (
                            <div className="flex items-center gap-1 pb-1 border-b border-white/20 text-[10px] font-black uppercase tracking-wider">
                              <AlertTriangle className="w-3.5 h-3.5 text-white animate-pulse" />
                              <span>{isPanic ? 'ALERTA STAT / VALOR DE PÁNICO' : 'PRIORIDAD URGENTE'}</span>
                            </div>
                          )}

                          {/* Linked Episode Badge */}
                          {msg.referenceEpisodeNumber && (
                            <div className={`p-2 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-2 border ${
                              isMe || isPanic || isUrgent
                                ? 'bg-black/20 text-white border-white/20'
                                : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 border-cyan-300 dark:border-cyan-800'
                            }`}>
                              <div>
                                <span className="font-mono font-bold block">{msg.referenceEpisodeNumber}</span>
                                <span className="text-[10px] opacity-90 block">{msg.referencePatientName}</span>
                              </div>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/30 text-white">4D LAB</span>
                            </div>
                          )}

                          {/* Message Content */}
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                          {/* Reactions & Delete Row */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            {/* Reactions display */}
                            <div className="flex flex-wrap gap-1">
                              {msg.reactions?.map((rx, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => addChatReaction(msg.id, rx.emoji)}
                                  className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15 text-white dark:text-slate-200 border border-white/20 flex items-center gap-0.5 hover:scale-105"
                                >
                                  <span>{rx.emoji}</span>
                                  <span className="font-bold">{rx.count}</span>
                                </button>
                              ))}
                            </div>

                            {/* Quick Emoji Bar (hover) */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/20 dark:bg-black/30 rounded-lg p-0.5 ml-auto">
                              {emojis.slice(0, 3).map(em => (
                                <button
                                  key={em}
                                  onClick={() => addChatReaction(msg.id, em)}
                                  className="hover:scale-125 transition-transform text-[11px]"
                                >
                                  {em}
                                </button>
                              ))}
                              {isMe && (
                                <button
                                  onClick={() => deleteChatMessage(msg.id)}
                                  className="text-white/70 hover:text-white p-0.5"
                                  title="Eliminar mensaje"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* LINKED EPISODE CHIP (PENDING TO SEND) */}
              {linkedEpisode && (
                <div className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/40 border-t border-cyan-200 dark:border-cyan-800 flex items-center justify-between gap-2 text-xs text-cyan-900 dark:text-cyan-200">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold">{linkedEpisode.episodeNumber}</span>
                    <span className="truncate">{linkedEpisode.patientName}</span>
                  </div>
                  <button
                    onClick={() => setLinkedEpisode(null)}
                    className="p-1 hover:bg-cyan-200 dark:hover:bg-cyan-900 rounded text-cyan-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* COMPOSER / INPUT BAR */}
              <form onSubmit={handleSendMessage} className="p-2 sm:p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 space-y-2">
                {/* Priority Selection and Quick Action Chips */}
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPriority('normal')}
                      className={`px-2 py-0.8 rounded-lg text-[10px] font-bold transition-colors ${
                        priority === 'normal'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('urgente')}
                      className={`px-2 py-0.8 rounded-lg text-[10px] font-bold transition-colors ${
                        priority === 'urgente'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                      }`}
                    >
                      ⚠️ Urgente
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('panico')}
                      className={`px-2 py-0.8 rounded-lg text-[10px] font-extrabold transition-colors ${
                        priority === 'panico'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 hover:bg-rose-200'
                      }`}
                    >
                      🚨 STAT / Pánico
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowSnippetsModal(true)}
                      className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 text-[10px] font-bold flex items-center gap-1"
                      title="Mensajes rápidos predeterminados"
                    >
                      <Zap className="w-3 h-3 text-teal-600" />
                      <span>Plantillas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowEpisodeModal(true)}
                      className="px-2 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 text-[10px] font-bold flex items-center gap-1"
                      title="Vincular orden o episodio del paciente"
                    >
                      <Paperclip className="w-3 h-3 text-cyan-600" />
                      <span>Orden</span>
                    </button>
                  </div>
                </div>

                {/* Input Text & Send */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder={
                      activeDirectUserId 
                        ? `Mensaje directo para ${activeDirectUserObj?.fullName.split(' ')[0]}...`
                        : `Escribir en ${activeChannelObj?.slug}...`
                    }
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() && !linkedEpisode}
                    className={`p-2.5 rounded-xl text-white shadow-xs transition-all cursor-pointer ${
                      messageInput.trim() || linkedEpisode
                        ? 'bg-teal-600 hover:bg-teal-500 active:scale-95'
                        : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SNIPPETS MODAL */}
      <ChatQuickSnippetsModal
        isOpen={showSnippetsModal}
        onClose={() => setShowSnippetsModal(false)}
        activeDepartmentScope={activeChannelObj?.department}
        onSelectSnippet={(text, prio) => {
          setMessageInput(prev => (prev ? `${prev} ${text}` : text));
          if (prio) setPriority(prio);
        }}
      />

      {/* EPISODE SELECTOR MODAL */}
      <ChatEpisodeSelectorModal
        isOpen={showEpisodeModal}
        onClose={() => setShowEpisodeModal(false)}
        onSelectEpisode={ep => {
          setLinkedEpisode(ep);
        }}
      />
    </>
  );
};
