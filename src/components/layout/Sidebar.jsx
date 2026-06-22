import React from 'react';
import { ArrowLeft, PenTool, Inbox, Star, Send, File, Trash2 } from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  totalInboxUnread,
  totalDraftsCount,
  setViewingEmail,
  setIsComposeOpen,
  mobileSidebarOpen,
  setMobileSidebarOpen
}) {
  return (
    <aside className={`
      fixed inset-y-0 left-0 w-64 bg-[#F6F8FC] pt-4 px-3 flex flex-col z-40 transition-transform duration-300 lg:static lg:translate-x-0
      ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Brand Header */}
      <div className="flex items-center gap-2 px-3 mb-5">
        <button 
          onClick={() => setMobileSidebarOpen(false)}
          className="p-2 hover:bg-gray-200 rounded-full lg:hidden cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500 text-white font-bold text-lg">
            M
          </div>
          <span className="font-semibold text-xl text-[#444746] tracking-tight">CCmail</span>
        </div>
      </div>

      {/* Compose Button */}
      <button 
        onClick={() => {
          setIsComposeOpen(true);
          setMobileSidebarOpen(false);
        }}
        className="flex items-center gap-3 bg-[#C2E7FF] hover:bg-[#B1DCF9] hover:shadow-md text-[#001D35] font-semibold px-6 py-4 rounded-2xl w-fit transition-all duration-200 mb-5 ml-1 cursor-pointer"
      >
        <PenTool size={20} className="stroke-[2.5px]" />
        <span className="text-sm">Compose</span>
      </button>

      {/* Main Folder Tabs */}
      <nav className="flex-1 space-y-1">
        {[
          { id: 'Inbox', name: 'Inbox', icon: Inbox, count: totalInboxUnread },
          { id: 'Starred', name: 'Starred', icon: Star },
          { id: 'Sent', name: 'Sent', icon: Send },
          { id: 'Drafts', name: 'Drafts', icon: File, count: totalDraftsCount },
          { id: 'Bin', name: 'Bin', icon: Trash2 },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setViewingEmail(null);
                setMobileSidebarOpen(false);
              }}
              className={`flex items-center justify-between w-full px-4 py-2.5 rounded-full text-sm transition-all duration-150 cursor-pointer ${
                isActive 
                  ? 'bg-[#D3E3FD] font-semibold text-[#041E49]' 
                  : 'hover:bg-gray-200/80 text-[#444746]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-[#041E49] stroke-[2.5px]' : 'text-[#444746]'} />
                <span>{item.name}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full ${isActive ? 'bg-blue-200 text-[#041E49] font-bold' : 'bg-gray-200 text-gray-600'}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Brand Notes */}
      <div className="mt-auto p-4 border-t border-gray-200/60 text-xs text-gray-500 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>All systems active</span>
        </div>
        <p>© 2026 CCMail Development</p>
      </div>
    </aside>
  );
}
