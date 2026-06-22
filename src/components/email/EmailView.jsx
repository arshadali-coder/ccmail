import React from 'react';
import { Star, Trash, SendHorizontal, ExternalLink } from 'lucide-react';

export default function EmailView({
  viewingEmail,
  handleToggleStar,
  handleSingleTrash,
  setComposeTo,
  setComposeSubject,
  setComposeBody,
  setIsComposeOpen
}) {
  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200 select-text">
      {/* Mail subject panel */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold">
              {viewingEmail.category}
            </span>
            <span className="text-xs text-gray-400 font-mono">ID: {viewingEmail.id}</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight leading-tight">
            {viewingEmail.subject}
          </h2>
        </div>
        
        {/* Action Bar */}
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => handleToggleStar(viewingEmail.id, e)}
            className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
            title="Star email"
          >
            <Star 
              size={18} 
              className={viewingEmail.starred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} 
            />
          </button>
          <button 
            onClick={() => handleSingleTrash(viewingEmail.id)}
            className="p-2 hover:bg-red-50 text-red-600 rounded-full transition cursor-pointer"
            title="Move to Bin"
          >
            <Trash size={18} />
          </button>
        </div>
      </div>

      {/* Sender/Recipient Detail Banner */}
      <div className="flex items-center justify-between border-y border-gray-100 py-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {viewingEmail.sender.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-800 text-sm">{viewingEmail.sender}</span>
              <span className="text-xs text-gray-400">&lt;{viewingEmail.senderEmail}&gt;</span>
            </div>
            <p className="text-xs text-gray-500">to me</p>
          </div>
        </div>
        
        <div className="text-right text-xs text-gray-400">
          <div>{viewingEmail.date}</div>
          <div>{viewingEmail.time}</div>
        </div>
      </div>

      {/* Email Body Block */}
      <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-sans max-w-3xl bg-gray-50/40 p-5 rounded-2xl border border-gray-100">
        {viewingEmail.body}
      </div>

      {/* Quick actions row */}
      <div className="pt-4 border-t border-gray-100 flex gap-3">
        <button 
          onClick={() => {
            setComposeTo(viewingEmail.senderEmail);
            setComposeSubject(`Re: ${viewingEmail.subject}`);
            setIsComposeOpen(true);
          }}
          className="flex items-center gap-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white px-5 py-2 rounded-full text-sm font-medium shadow-sm transition cursor-pointer"
        >
          <SendHorizontal size={15} />
          <span>Reply</span>
        </button>
        <button 
          onClick={() => {
            setComposeSubject(`Fwd: ${viewingEmail.subject}`);
            setComposeBody(`---------- Forwarded message ---------\nFrom: ${viewingEmail.sender} <${viewingEmail.senderEmail}>\nDate: ${viewingEmail.date}\nSubject: ${viewingEmail.subject}\n\n${viewingEmail.body}`);
            setIsComposeOpen(true);
          }}
          className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-full text-sm font-medium transition cursor-pointer"
        >
          <ExternalLink size={15} />
          <span>Forward</span>
        </button>
      </div>
    </div>
  );
}
