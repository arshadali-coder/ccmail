import React from 'react';
import { 
  CheckSquare, Square, RefreshCw, ArrowLeft, MailOpen, Mail, 
  Trash2, ChevronLeft, ChevronRight, Inbox, Tag, Users, Info, Star, Trash
} from 'lucide-react';
import EmailView from './EmailView';

export default function InboxView({
  filteredEmails,
  selectedIds,
  viewingEmail,
  setViewingEmail,
  handleToggleStar,
  handleToggleSelectAll,
  handleSelectOne,
  handleOpenEmail,
  handleBulkMarkRead,
  handleBulkTrash,
  handleSingleTrash,
  handleRefreshInbox,
  isRefreshing,
  setEmails,
  showToast,
  setComposeTo,
  setComposeSubject,
  setComposeBody,
  setIsComposeOpen
}) {
  return (
    <section className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-200/60 flex flex-col overflow-hidden">
      
      {/* TOOLBAR */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 text-gray-600 bg-gray-50/50 min-h-[48px]">
        {/* Left side actions */}
        <div className="flex items-center gap-3">
          {!viewingEmail && (
            <>
              <button 
                onClick={handleToggleSelectAll}
                title="Select all"
                className="p-1 hover:bg-gray-200 rounded text-gray-500 transition"
              >
                {filteredEmails.length > 0 && filteredEmails.every(e => selectedIds.has(e.id)) ? (
                  <CheckSquare size={18} className="text-blue-600" />
                ) : (
                  <Square size={18} />
                )}
              </button>
              <button 
                onClick={handleRefreshInbox}
                title="Refresh Inbox"
                className={`p-2 hover:bg-gray-200 rounded-full transition cursor-pointer ${isRefreshing ? 'animate-spin text-blue-500' : ''}`}
              >
                <RefreshCw size={16} />
              </button>
            </>
          )}

          {viewingEmail && (
            <button 
              onClick={() => setViewingEmail(null)}
              className="flex items-center gap-1 py-1 px-3 hover:bg-gray-200 rounded-full text-sm text-[#041E49] font-medium transition cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to List</span>
            </button>
          )}

          {/* FLOATING ACTION STRIP (when items are selected) */}
          {/* To-do Need to Update this */}
          {selectedIds.size > 0 && !viewingEmail && (
            <div className="flex items-center gap-1 bg-[#D3E3FD] px-3 py-1 rounded-full text-[#041E49] border border-blue-200 animate-pulse duration-1000">
              <span className="text-xs font-semibold mr-2">{selectedIds.size} Selected</span>
              <button 
                onClick={() => handleBulkMarkRead(true)}
                title="Mark as Read"
                className="p-1.5 hover:bg-blue-200 text-blue-800 rounded-full cursor-pointer"
              >
                <MailOpen size={15} />
              </button>
              <button 
                onClick={() => handleBulkMarkRead(false)}
                title="Mark as Unread"
                className="p-1.5 hover:bg-blue-200 text-blue-800 rounded-full cursor-pointer"
              >
                <Mail size={15} />
              </button>
              <button 
                onClick={handleBulkTrash}
                title="Move to Bin"
                className="p-1.5 hover:bg-blue-200 text-red-700 rounded-full cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Right side actions (Pagination indicator) */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>1-{filteredEmails.length} of {filteredEmails.length}</span>
          <button 
            onClick={() => showToast("Showing first page updates")}
            className="p-1.5 hover:bg-gray-200 rounded-full ml-1 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => showToast("Showing first page updates")}
            className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* MAIN LIST & EMAIL DETAILS */}
      <div className="flex-1 overflow-y-auto">
        {viewingEmail ? (
          <EmailView 
            viewingEmail={viewingEmail}
            handleToggleStar={handleToggleStar}
            handleSingleTrash={handleSingleTrash}
            setComposeTo={setComposeTo}
            setComposeSubject={setComposeSubject}
            setComposeBody={setComposeBody}
            setIsComposeOpen={setIsComposeOpen}
          />
        ) : (
          <div className="divide-y divide-gray-100/60">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 bg-gray-100 rounded-full text-gray-400">
                  <Inbox size={42} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-gray-700">Your list is clear</h4>
                  <p className="text-xs text-gray-400 max-w-sm">No emails found in your active filters or search terms.</p>
                </div>
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = selectedIds.has(email.id);
                return (
                  <div 
                    key={email.id}
                    onClick={() => handleOpenEmail(email)}
                    className={`
                      flex items-center justify-between px-4 py-3 transition-all cursor-pointer border-l-4 text-sm relative group
                      ${email.unread 
                        ? 'bg-white border-l-[#0b57d0] font-semibold text-gray-900' 
                        : 'bg-gray-50/30 border-l-transparent text-gray-600'
                      }
                      ${isSelected ? 'bg-blue-50/45' : 'hover:bg-gray-100/50'}
                    `}
                  >
                    {/* Selector checkbox & Star */}
                    <div className="flex items-center gap-3.5 w-1/4 min-w-[180px] z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOne(email.id, e);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare size={17} className="text-[#0b57d0]" />
                        ) : (
                          <Square size={17} />
                        )}
                      </button>
                      
                      <button 
                        onClick={(e) => handleToggleStar(email.id, e)}
                        className="transition cursor-pointer"
                      >
                        <Star 
                          size={16} 
                          className={email.starred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-400'} 
                        />
                      </button>

                      {/* Sender name */}
                      <span className="truncate max-w-[110px] sm:max-w-none text-[13px]">
                        {email.sender}
                      </span>
                    </div>

                    {/* Subject Header & Short Description Snip */}
                    <div className="flex-1 flex items-center gap-2 px-3 overflow-hidden">
                      <span className="truncate text-[13px] text-gray-800 font-medium">
                        {email.subject}
                      </span>
                      <span className="text-gray-400 font-normal truncate text-[12px]">
                        — {email.snippet}
                      </span>
                    </div>

                    {/* Inline micro-actions visible on hover */}
                    <div className="hidden group-hover:flex items-center gap-1.5 absolute right-20 bg-white shadow px-2 py-1 rounded-lg border border-gray-100 z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEmails(prev => prev.map(ev => ev.id === email.id ? { ...ev, unread: !ev.unread } : ev));
                          showToast(`Conversation marked as ${email.unread ? 'read' : 'unread'}`);
                        }}
                        title={email.unread ? "Mark as Read" : "Mark as Unread"}
                        className="p-1 hover:bg-gray-100 text-gray-600 rounded cursor-pointer"
                      >
                        {email.unread ? <MailOpen size={14} /> : <Mail size={14} />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSingleTrash(email.id);
                        }}
                        title="Move to Bin"
                        className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                      >
                        <Trash size={14} />
                      </button>
                    </div>

                    {/* Timestamp Info */}
                    <div className="w-16 text-right text-xs text-gray-400 whitespace-nowrap pl-2">
                      {email.time}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

    </section>
  );
}
