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
  Zap, 
  Paperclip, 
  AlertTriangle, 
  Users, 
  Radio, 
  FlaskConical, 
  Building2, 
  Syringe, 
  Smile, 
  Trash2, 
  Search, 
  UserCheck, 
  CheckCheck, 
  ShieldCheck, 
  Clock, 
  Phone, 
  Info,
  Layers,
  ChevronDown
} from 'lucide-react';

export const InternalChatView: React.FC = () => {
  const {
    chatMessages,
    activeChatChannelId,
    setActiveChatChannelId,
    activeDirectUserId,
    setActiveDirectUserId,
    currentStaffUser,
    setCurrentStaffUser,
    staffUsers,
    sendChatMessage,
    markChatMessagesAsRead,
    addChatReaction,
    deleteChatMessage,
    clearChatChannelHistory
  } = useClinic();

  const [messageInput, setMessageInput] = useState('');
  const [priority, setPriority] = useState<ChatMessagePriority>('normal');
  const [linkedEpisode, setLinkedEpisode] = useState<LabEpisode | null>(null);
  const [showSnippetsModal, setShowSnippetsModal] = useState(false);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'canales' | 'directos'>('canales');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    const currentTarget = activeDirectUserId ? `dm_${activeDirectUserId}` : activeChatChannelId;
    markChatMessagesAsRead(currentTarget);
  }, [activeChatChannelId, activeDirectUserId, chatMessages.length]);

  const activeChannelObj = LAB_CHAT_CHANNELS.find(c => c.id === activeChatChannelId);
  const activeDirectUserObj = staffUsers.find(u => u.id === activeDirectUserId);

  const filteredMessages = chatMessages.filter(msg => {
    if (activeDirectUserId) {
      const isDirect = (msg.senderId === currentStaffUser.id && msg.recipientId === activeDirectUserId) ||
                       (msg.senderId === activeDirectUserId && msg.recipientId === currentStaffUser.id) ||
                       (msg.channelId === `dm_${activeDirectUserId}` || msg.channelId === `dm_${currentStaffUser.id}`);
      if (!isDirect) return false;
    } else {
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

  const emojis = ['👍', '🧪', '✅', '🚨', '⏱️', '❤️', '👏', '🔬'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl shadow-md shadow-teal-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Sistema de Comunicación Interna & Intercom LABVACLINIC
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-xs font-bold">
                En Vivo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Coordinación instantánea entre Recepción, Analistas/Laboratorio, Área Administrativa y Dirección Técnica.
            </p>
          </div>
        </div>

        {/* Identity & Simulation Switcher */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700 w-full md:w-auto">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mi Identidad Activa:</span>
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300 truncate max-w-[180px]">
              {currentStaffUser.fullName}
            </span>
          </div>
          <select
            value={currentStaffUser.id}
            onChange={e => {
              const u = staffUsers.find(user => user.id === e.target.value);
              if (u) setCurrentStaffUser(u);
            }}
            className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
          >
            {staffUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.fullName} ({user.roleName.split('/')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[680px]">
        {/* Sidebar Channels and Users (1 column) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          {/* Channel / Direct Tabs */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex gap-2">
            <button
              onClick={() => setActiveTab('canales')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'canales'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Canales ({LAB_CHAT_CHANNELS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('directos')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'directos'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Directo ({staffUsers.length - 1})</span>
            </button>
          </div>

          {/* List items */}
          <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
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
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-2 border ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-100 shadow-xs'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs block truncate">{ch.slug}</span>
                        <span className="text-[11px] text-slate-500 truncate block">{ch.name}</span>
                      </div>
                    </div>
                    {unread > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
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
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-2 border ${
                        isActive
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-900 dark:text-cyan-100 shadow-xs'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                            {user.fullName.charAt(0)}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white"></span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs block truncate">{user.fullName}</span>
                          <span className="text-[10px] text-slate-500 truncate block">{user.roleName}</span>
                        </div>
                      </div>
                      {unread > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
            )}
          </div>

          {/* Quick Help Card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Trazabilidad ISO 15189:</span>
            <p>Todos los avisos de pánico y validaciones clínicas quedan respaldados con estampa de tiempo.</p>
          </div>
        </div>

        {/* Conversation Stream & Composer (3 columns) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          {/* Active Channel Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                {activeDirectUserId ? <Users className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  {activeDirectUserId ? activeDirectUserObj?.fullName : activeChannelObj?.slug}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeDirectUserId 
                    ? `${activeDirectUserObj?.roleName} • Sede ${activeDirectUserObj?.assignedBranch}`
                    : activeChannelObj?.description}
                </p>
              </div>
            </div>

            {/* Channel search */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en mensajes..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Messages List Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-20 space-y-3 text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-semibold">No hay mensajes en este canal.</p>
                <p className="text-xs">Inicie la conversación o utilice una plantilla rápida predeterminada.</p>
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
                    {/* Sender & Timestamp */}
                    <div className="flex items-center gap-2 mb-1 px-1 text-xs text-slate-500">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{msg.senderName}</span>
                      <span>•</span>
                      <span className="text-slate-400">{msg.senderRole}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-xs space-y-2 text-xs relative ${
                        isPanic
                          ? 'bg-rose-600 text-white border-2 border-rose-400 font-medium'
                          : isUrgent
                          ? 'bg-amber-500 text-white border-2 border-amber-300 font-medium'
                          : isMe
                          ? 'bg-teal-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {/* Priority Header */}
                      {(isPanic || isUrgent) && (
                        <div className="flex items-center gap-1.5 pb-1 border-b border-white/20 text-xs font-black uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
                          <span>{isPanic ? 'ALERTA STAT / VALOR DE PÁNICO' : 'PRIORIDAD URGENTE'}</span>
                        </div>
                      )}

                      {/* Linked Episode Box */}
                      {msg.referenceEpisodeNumber && (
                        <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-3 border ${
                          isMe || isPanic || isUrgent
                            ? 'bg-black/20 text-white border-white/20'
                            : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 border-cyan-300 dark:border-cyan-800'
                        }`}>
                          <div>
                            <span className="font-mono font-bold block">{msg.referenceEpisodeNumber}</span>
                            <span className="text-[11px] opacity-90 block">{msg.referencePatientName}</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-black/30 text-white">
                            Orden LABVACLINIC
                          </span>
                        </div>
                      )}

                      {/* Message Text */}
                      <p className="leading-relaxed text-sm whitespace-pre-wrap">{msg.content}</p>

                      {/* Reactions & Actions Footer */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        {/* Reactions tags */}
                        <div className="flex flex-wrap gap-1">
                          {msg.reactions?.map((rx, idx) => (
                            <button
                              key={idx}
                              onClick={() => addChatReaction(msg.id, rx.emoji)}
                              className="px-2 py-0.5 rounded-full text-xs bg-black/15 text-white dark:text-slate-200 border border-white/20 flex items-center gap-1 hover:scale-105"
                            >
                              <span>{rx.emoji}</span>
                              <span className="font-bold text-[11px]">{rx.count}</span>
                            </button>
                          ))}
                        </div>

                        {/* Reaction Picker on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/20 dark:bg-black/30 rounded-lg p-1 ml-auto">
                          {emojis.slice(0, 4).map(em => (
                            <button
                              key={em}
                              onClick={() => addChatReaction(msg.id, em)}
                              className="hover:scale-125 transition-transform text-xs"
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
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* LINKED EPISODE PREVIEW (IF ATTACHED) */}
          {linkedEpisode && (
            <div className="px-4 py-2 bg-cyan-50 dark:bg-cyan-950/40 border-t border-cyan-200 dark:border-cyan-800 flex items-center justify-between gap-3 text-xs text-cyan-900 dark:text-cyan-200">
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono font-bold">{linkedEpisode.episodeNumber}</span>
                <span className="truncate">{linkedEpisode.patientName}</span>
                <span className="text-slate-400">({linkedEpisode.requestedTests.join(', ')})</span>
              </div>
              <button
                onClick={() => setLinkedEpisode(null)}
                className="p-1 hover:bg-cyan-200 dark:hover:bg-cyan-900 rounded text-cyan-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* COMPOSER FORM */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-3">
            {/* Priority and Action Buttons Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Prioridad:</span>
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
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
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
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
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-colors ${
                    priority === 'panico'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 hover:bg-rose-200'
                  }`}
                >
                  🚨 STAT / Pánico
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSnippetsModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-teal-600" />
                  <span>Plantillas Clínicas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEpisodeModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <Paperclip className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Vincular Orden</span>
                </button>
              </div>
            </div>

            {/* Text Input Row */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder={
                  activeDirectUserId 
                    ? `Enviar mensaje directo a ${activeDirectUserObj?.fullName}...`
                    : `Escribir mensaje en ${activeChannelObj?.slug}...`
                }
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() && !linkedEpisode}
                className={`px-5 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                  messageInput.trim() || linkedEpisode
                    ? 'bg-teal-600 hover:bg-teal-500 active:scale-95'
                    : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <span>Enviar</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

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
    </div>
  );
};
