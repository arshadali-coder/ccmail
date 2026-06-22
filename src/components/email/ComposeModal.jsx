import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Trash2, Minimize2, Maximize2, Minus, 
  Bold, Italic, Underline 
} from 'lucide-react';

export default function ComposeModal({
  isComposeOpen,
  setIsComposeOpen,
  composeTo,
  setComposeTo,
  composeSubject,
  setComposeSubject,
  composeBody,
  setComposeBody,
  handleSendEmail,
  showToast,
  userSignature
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // CC / BCC states
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');

  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && isComposeOpen) {
      if (editorRef.current.innerHTML !== composeBody) {
        editorRef.current.innerHTML = composeBody;
      }
      // Pre-fill signature if composer is empty and signature exists
      if (!composeBody && userSignature) {
        const formattedSig = `<br/><br/>--<br/>${userSignature.replace(/\n/g, '<br/>')}`;
        editorRef.current.innerHTML = formattedSig;
        setComposeBody(formattedSig);
      }
    }
  }, [isComposeOpen, composeBody, userSignature, setComposeBody]);

  if (!isComposeOpen) return null;

  const formatText = (command) => {
    document.execCommand(command, false, null);
  };

  // Compose CSS state classes
  let modalClass = "fixed bottom-0 right-4 sm:right-12 bg-white shadow-2xl border border-gray-200 flex flex-col z-50 transition-all duration-300 ";
  
  if (isMinimized) {
    modalClass += "w-[280px] sm:w-[320px] h-[48px] rounded-t-xl overflow-hidden";
  } else if (isMaximized) {
    modalClass += "inset-4 sm:inset-10 w-auto h-auto rounded-2xl";
  } else {
    modalClass += "w-full sm:w-[560px] h-[500px] sm:h-[600px] rounded-t-2xl";
  }

  return (
    <div className={modalClass}>
      
      {/* Header bar */}
      <div className="bg-[#EAF1FB] px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 border-b border-gray-200">
        <span className="font-semibold select-none">New Message</span>
        <div className="flex items-center gap-1.5">
          {/* Minimize button */}
          <button 
            type="button"
            onClick={() => setIsMinimized(!isMinimized)} 
            className="p-1 hover:bg-gray-200 rounded text-gray-500 transition cursor-pointer"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            <Minus size={15} />
          </button>
          
          {/* Maximize button */}
          {!isMinimized && (
            <button 
              type="button"
              onClick={() => setIsMaximized(!isMaximized)} 
              className="p-1 hover:bg-gray-200 rounded text-gray-500 transition cursor-pointer"
              title={isMaximized ? "Restore size" : "Maximize"}
            >
              {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          )}

          {/* Close button */}
          <button 
            type="button"
            onClick={() => setIsComposeOpen(false)} 
            className="p-1 hover:bg-gray-200 rounded text-gray-500 transition cursor-pointer"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Form content (hidden when minimized) */}
      {!isMinimized && (
        <form onSubmit={handleSendEmail} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-3 flex-1 flex flex-col overflow-hidden">
            
            {/* Recipient Field */}
            <div className="flex items-center border-b border-gray-100 pb-2 relative flex-shrink-0">
              <span className="text-xs font-semibold text-gray-400 w-12 uppercase select-none">To</span>
              <input 
                type="email" 
                required
                placeholder="recipient@example.com" 
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="w-full px-2 text-sm outline-none bg-transparent placeholder-gray-400 text-gray-800 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="absolute right-0 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer select-none"
              >
                {showCcBcc ? "Hide CC" : "Cc/Bcc"}
              </button>
            </div>

            {/* Collapsible CC / BCC fields */}
            {showCcBcc && (
              <div className="space-y-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/60 animate-in fade-in duration-200 flex-shrink-0">
                <div className="flex items-center border-b border-gray-200/55 pb-1.5">
                  <span className="text-[11px] font-semibold text-gray-400 w-10 uppercase select-none">Cc</span>
                  <input 
                    type="text" 
                    placeholder="cc@example.com" 
                    value={composeCc}
                    onChange={(e) => setComposeCc(e.target.value)}
                    className="w-full px-2 text-xs outline-none bg-transparent placeholder-gray-400 text-gray-800"
                  />
                </div>
                <div className="flex items-center pb-1">
                  <span className="text-[11px] font-semibold text-gray-400 w-10 uppercase select-none">Bcc</span>
                  <input 
                    type="text" 
                    placeholder="bcc@example.com" 
                    value={composeBcc}
                    onChange={(e) => setComposeBcc(e.target.value)}
                    className="w-full px-2 text-xs outline-none bg-transparent placeholder-gray-400 text-gray-800"
                  />
                </div>
              </div>
            )}

            {/* Subject Field */}
            <div className="flex items-center border-b border-gray-100 pb-2 flex-shrink-0">
              <span className="text-xs font-semibold text-gray-400 w-12 uppercase select-none">Subject</span>
              <input 
                type="text" 
                placeholder="Enter email subject" 
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="w-full px-2 text-sm outline-none bg-transparent placeholder-gray-400 text-gray-800"
              />
            </div>

            {/* Rich text editor area */}
            <div className="flex-1 flex flex-col min-h-0 pt-1 overflow-hidden">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning={true}
                className="w-full flex-1 text-sm outline-none overflow-y-auto p-2 min-h-[120px] text-gray-800"
                onInput={(e) => setComposeBody(e.currentTarget.innerHTML)}
              />
            </div>
          </div>

          {/* Formatting Bar */}
          <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-1 bg-gray-50/30 flex-shrink-0">
            <button
              type="button"
              onClick={() => formatText("bold")}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition cursor-pointer"
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={() => formatText("italic")}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition cursor-pointer"
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              type="button"
              onClick={() => formatText("underline")}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition cursor-pointer"
              title="Underline"
            >
              <Underline size={16} />
            </button>
          </div>

          {/* Action strip */}
          <div className="p-4 bg-[#F8F9FA] border-t border-gray-150 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <button 
                type="submit"
                className="bg-[#0b57d0] hover:bg-[#0842a0] text-white font-semibold px-6 py-2.5 rounded-full text-sm shadow-md transition cursor-pointer"
              >
                Send
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsComposeOpen(false);
                  showToast("Draft saved.");
                }}
                className="px-4 py-2 hover:bg-gray-200 text-gray-600 rounded-full text-sm transition cursor-pointer"
              >
                Save Draft
              </button>
            </div>

            <button 
              type="button" 
              onClick={() => {
                setIsComposeOpen(false);
                setComposeTo('');
                setComposeSubject('');
                setComposeBody('');
              }}
              className="p-2 hover:bg-red-50 text-red-500 rounded-full transition cursor-pointer"
              title="Discard draft"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
