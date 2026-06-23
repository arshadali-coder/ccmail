"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import InboxView from '../components/email/InboxView';
import ComposeModal from '../components/email/ComposeModal';
import Toast from '../components/common/Toast';
import OnboardingWizard from '../components/common/OnboardingWizard';

import { supabase } from '../lib/supabase-client';

export default function App() {
  const router = useRouter();

  // Application State
  const [emails, setEmails] = useState([]);
  const [activeTab, setActiveTab] = useState('Inbox'); // 'Inbox', 'Starred', 'Sent', 'Drafts', 'Bin'
  const [activeCategory, setActiveCategory] = useState('primary'); // 'primary', 'promotions', 'social', 'updates'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewingEmail, setViewingEmail] = useState(null);
  
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Modals & UI Toggles
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compose State
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Toast helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Load session & active user
  useEffect(() => {
    async function initSession() {
      const activeEmail = localStorage.getItem('ccmail_active_session_email');
      if (!activeEmail) {
        router.push('/login');
        return;
      }
      setUserEmail(activeEmail);

      const savedStr = localStorage.getItem('ccmail_accounts_sessions');
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        const activeAccount = saved[activeEmail.toLowerCase()];
        if (activeAccount && activeAccount.session) {
          await supabase.auth.setSession(activeAccount.session);
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Fetch profiles table to see if onboarding is completed
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("onboarded, full_name, position, dob, signature")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          if (!profile.onboarded) {
            setShowOnboarding(true);
          } else {
            setUserProfile(profile);
          }
        } else {
          setShowOnboarding(true);
        }
      } else {
        router.push('/login');
      }
    }
    initSession();
  }, [router]);

  // Fetch emails for the active user
  useEffect(() => {
    if (!userId) return;

    async function loadEmails() {
      try {
        const res = await fetch(`/api/emails?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(entry => {
            const msg = entry.message || {};
            const senderProfile = msg.sender || {};
            return {
              id: entry.id, // mailbox entry ID
              messageId: msg.id,
              sender: senderProfile.full_name || senderProfile.email || msg.sender_email || "System",
              senderEmail: senderProfile.email || msg.sender_email || "system@ccmail.dev",
              subject: msg.thread?.subject || "(No Subject)",
              snippet: entry.folder === "draft" && !msg.snippet ? "(Draft)" : (msg.snippet || ""),
              body: msg.body_html || "",
              time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "21:10",
              date: msg.created_at ? new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "Jun 22, 2026",
              unread: !entry.is_read,
              starred: entry.is_starred,
              category: "primary",
              tab: entry.folder === "trash" ? "Bin" : (entry.folder === "draft" ? "Drafts" : (entry.folder.charAt(0).toUpperCase() + entry.folder.slice(1)))
            };
          });
          setEmails(mapped);
        }
      } catch (err) {
        console.error("Error loading database emails:", err);
      }
    }
    loadEmails();
  }, [userId]);

  // Helper selectors
  const totalInboxUnread = useMemo(() => {
    return emails.filter(e => e.tab === 'Inbox' && e.unread).length;
  }, [emails]);

  const totalDraftsCount = useMemo(() => {
    return emails.filter(e => e.tab === 'Drafts').length;
  }, [emails]);

  const categoryUnreadCount = (category) => {
    return emails.filter(e => e.tab === 'Inbox' && e.category === category && e.unread).length;
  };

  // Filter logic
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      // 1. Sidebar tab filter
      if (activeTab === 'Inbox') {
        if (email.tab !== 'Inbox') return false;
      } else if (activeTab === 'Starred') {
        if (!email.starred) return false;
      } else if (activeTab === 'Sent') {
        if (email.tab !== 'Sent') return false;
      } else if (activeTab === 'Drafts') {
        if (email.tab !== 'Drafts') return false;
      } else if (activeTab === 'Bin') {
        if (email.tab !== 'Bin') return false;
      }

      // 2. Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          email.sender.toLowerCase().includes(query) ||
          email.subject.toLowerCase().includes(query) ||
          email.snippet.toLowerCase().includes(query) ||
          email.body.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [emails, activeTab, activeCategory, searchQuery]);

  // Operations
  const handleToggleStar = async (id, e) => {
    e.stopPropagation();
    // Find current state
    const target = emails.find(email => email.id === id);
    if (!target) return;
    const nextStarred = !target.starred;

    // Optimistically update frontend
    setEmails(prev => prev.map(email => email.id === id ? { ...email, starred: nextStarred } : email));
    showToast(nextStarred ? "Starred email" : "Unstarred email");

    try {
      const res = await fetch('/api/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_starred: nextStarred })
      });
      if (!res.ok) {
        // Rollback on error
        setEmails(prev => prev.map(email => email.id === id ? { ...email, starred: !nextStarred } : email));
        showToast("Failed to update star status");
      }
    } catch (err) {
      setEmails(prev => prev.map(email => email.id === id ? { ...email, starred: !nextStarred } : email));
      showToast("Network error updating star");
    }
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredEmails.map(e => e.id);
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    
    const newSelected = new Set(selectedIds);
    if (allSelected) {
      visibleIds.forEach(id => newSelected.delete(id));
    } else {
      visibleIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const handleSelectOne = (id, e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleOpenEmail = async (email) => {
    // Show email view immediately (body will load in background if not already present)
    setViewingEmail(email);

    if (!email.body) {
      try {
        const res = await fetch(`/api/emails?messageId=${email.messageId}`);
        if (res.ok) {
          const detail = await res.json();
          const cleanBody = detail.body_html || "";
          
          // Update cached email in list
          setEmails(prev => prev.map(e => e.id === email.id ? { ...e, body: cleanBody } : e));
          // Update currently viewed email
          setViewingEmail(prev => prev && prev.id === email.id ? { ...prev, body: cleanBody } : prev);
        }
      } catch (err) {
        console.error("Failed to fetch email body:", err);
      }
    }

    // Mark as read in DB if it was unread
    if (email.unread) {
      // Optimistically mark as read
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, unread: false } : e));
      try {
        await fetch('/api/emails', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: email.id, is_read: true })
        });
      } catch (err) {
        console.error("Failed to mark email as read in DB:", err);
      }
    }
  };

  const handleBulkMarkRead = async (readStatus = true) => {
    const selectedList = Array.from(selectedIds);
    if (selectedList.length === 0) return;

    // Optimistically update UI
    setEmails(prev => prev.map(email => {
      if (selectedIds.has(email.id)) {
        return { ...email, unread: !readStatus };
      }
      return email;
    }));
    setSelectedIds(new Set());
    showToast(`Marked selected as ${readStatus ? 'read' : 'unread'}`);

    try {
      const res = await fetch('/api/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedList, is_read: readStatus })
      });
      if (!res.ok) {
        showToast("Failed to update status on server");
      }
    } catch (err) {
      showToast("Network error performing bulk update");
    }
  };

  const handleBulkTrash = async () => {
    const selectedList = Array.from(selectedIds);
    if (selectedList.length === 0) return;

    // Optimistically update UI
    setEmails(prev => prev.map(email => {
      if (selectedIds.has(email.id)) {
        return { ...email, tab: 'Bin' };
      }
      return email;
    }));
    setSelectedIds(new Set());
    showToast("Moved selected conversations to Bin");

    try {
      const res = await fetch('/api/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedList, folder: 'trash' })
      });
      if (!res.ok) {
        showToast("Failed to move to Bin on server");
      }
    } catch (err) {
      showToast("Network error moving to Bin");
    }
  };

  const handleSingleTrash = async (id) => {
    // Optimistically update UI
    setEmails(prev => prev.map(email => email.id === id ? { ...email, tab: 'Bin' } : email));
    setViewingEmail(null);
    showToast("Moved conversation to Bin");

    try {
      const res = await fetch('/api/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, folder: 'trash' })
      });
      if (!res.ok) {
        showToast("Failed to move to Bin on server");
      }
    } catch (err) {
      showToast("Network error moving to Bin");
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!composeTo) {
      showToast("Please specify a recipient");
      return;
    }

    if (!userId) {
      showToast("User session not found. Please log in.");
      return;
    }

    setIsComposeOpen(false);
    showToast("Sending email...");

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          html: composeBody,
          senderId: userId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Message sent successfully!");
        // Reload emails to get the new entry
        const refreshRes = await fetch(`/api/emails?userId=${userId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const mapped = refreshData.map(entry => {
            const msg = entry.message || {};
            const senderProfile = msg.sender || {};
            return {
              id: entry.id,
              messageId: msg.id,
              sender: senderProfile.full_name || senderProfile.email || msg.sender_email || "System",
              senderEmail: senderProfile.email || msg.sender_email || "system@ccmail.dev",
              subject: msg.thread?.subject || "(No Subject)",
              snippet: entry.folder === "draft" && !msg.snippet ? "(Draft)" : (msg.snippet || ""),
              body: msg.body_html || "",
              time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "21:10",
              date: msg.created_at ? new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "Jun 22, 2026",
              unread: !entry.is_read,
              starred: entry.is_starred,
              category: "primary",
              tab: entry.folder === "trash" ? "Bin" : (entry.folder === "draft" ? "Drafts" : (entry.folder.charAt(0).toUpperCase() + entry.folder.slice(1)))
            };
          });
          setEmails(mapped);
        }
      } else {
        showToast(data.error || "Failed to send email");
      }
    } catch (err) {
      showToast("Failed to connect to email server");
    } finally {
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
    }
  };

  const handleRefreshInbox = async () => {
    if (!userId) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/emails?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(entry => {
          const msg = entry.message || {};
          const senderProfile = msg.sender || {};
          return {
            id: entry.id,
            messageId: msg.id,
            sender: senderProfile.full_name || senderProfile.email || msg.sender_email || "System",
            senderEmail: senderProfile.email || msg.sender_email || "system@ccmail.dev",
            subject: msg.thread?.subject || "(No Subject)",
            snippet: entry.folder === "draft" && !msg.snippet ? "(Draft)" : (msg.snippet || ""),
            body: msg.body_html || "",
            time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "21:10",
            date: msg.created_at ? new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "Jun 22, 2026",
            unread: !entry.is_read,
            starred: entry.is_starred,
            category: "primary",
            tab: entry.folder === "trash" ? "Bin" : (entry.folder === "draft" ? "Drafts" : (entry.folder.charAt(0).toUpperCase() + entry.folder.slice(1)))
          };
        });
        setEmails(mapped);
        showToast("Inbox refreshed");
      }
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#F6F8FC] font-sans antialiased text-[#1F1F1F] overflow-hidden">
      
      {/* GLOBAL BANNER / TOAST NOTIFICATION */}
      <Toast message={toastMessage} />

      {/* MOBILE DRAWER BACKDROP */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity"
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalInboxUnread={totalInboxUnread}
        totalDraftsCount={totalDraftsCount}
        setViewingEmail={setViewingEmail}
        setIsComposeOpen={setIsComposeOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col pt-3 pr-3 pl-3 lg:pl-0 pb-3 overflow-hidden">
        
        {/* HEADER TOOLBAR */}
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setMobileSidebarOpen={setMobileSidebarOpen}
          isProfileOpen={isProfileOpen}
          setIsProfileOpen={setIsProfileOpen}
          showToast={showToast}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
        />

        {/* WORKSPACE PREVIEW WHITE BOX */}
        <InboxView 
          filteredEmails={filteredEmails}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          activeTab={activeTab}
          viewingEmail={viewingEmail}
          setViewingEmail={setViewingEmail}
          handleToggleStar={handleToggleStar}
          handleToggleSelectAll={handleToggleSelectAll}
          handleSelectOne={handleSelectOne}
          handleOpenEmail={handleOpenEmail}
          handleBulkMarkRead={handleBulkMarkRead}
          handleBulkTrash={handleBulkTrash}
          handleSingleTrash={handleSingleTrash}
          handleRefreshInbox={handleRefreshInbox}
          isRefreshing={isRefreshing}
          setEmails={setEmails}
          showToast={showToast}
          setComposeTo={setComposeTo}
          setComposeSubject={setComposeSubject}
          setComposeBody={setComposeBody}
          setIsComposeOpen={setIsComposeOpen}
        />
      </div>

      {/* FLOATING RICH EMAIL COMPOSER MODAL */}
      <ComposeModal 
        isComposeOpen={isComposeOpen}
        setIsComposeOpen={setIsComposeOpen}
        composeTo={composeTo}
        setComposeTo={setComposeTo}
        composeSubject={composeSubject}
        setComposeSubject={setComposeSubject}
        composeBody={composeBody}
        setComposeBody={setComposeBody}
        handleSendEmail={handleSendEmail}
        showToast={showToast}
        userSignature={userProfile?.signature}
      />

      {/* ONBOARDING FLOW OVERLAY */}
      {showOnboarding && (
        <OnboardingWizard 
          userId={userId}
          userEmail={userEmail}
          showToast={showToast}
          onComplete={({ fullName, position, dob, signature }) => {
            setShowOnboarding(false);
            setUserProfile({ full_name: fullName, position, dob, signature });
            handleRefreshInbox();
          }}
        />
      )}

    </div>
  );
}