// app/groups/[id]/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Users, ArrowLeft, Paperclip, Smile } from "lucide-react";
import toast from "react-hot-toast";

export default function StudyGroupChatPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const [groupId, setGroupId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Polling interval for real-time updates
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    // Extract group ID from params
    const extractGroupId = async () => {
      const resolvedParams = await params;
      setGroupId(resolvedParams.id);
    };
    extractGroupId();
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (status === "authenticated" && groupId) {
      fetchGroupData();
      fetchMessages();

      // Start polling for new messages every 5 seconds
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(true);
      }, 5000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [status, router, groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchGroupData = async () => {
    try {
      const res = await fetch(`/api/study-groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
      }
    } catch (error) {
      console.error("Failed to fetch group:", error);
      toast.error("Failed to load group data");
    }
  };

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const res = await fetch(`/api/study-groups/${groupId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      if (!silent) {
        console.error("Failed to fetch messages:", error);
        toast.error("Failed to load messages");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);

      const res = await fetch(`/api/study-groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading || status === "loading" || !groupId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/groups")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {group?.name || "Study Group"}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{group?.memberCount || 0} members</span>
                {group?.subject && (
                  <>
                    <span>•</span>
                    <span>{group.subject}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender?._id === session?.user?.id;
              return (
                <div
                  key={message._id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md ${
                      isOwnMessage
                        ? "bg-emerald-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    } rounded-2xl p-4 shadow`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold mb-1 opacity-75">
                        {message.sender?.username || "Unknown"}
                      </p>
                    )}
                    <p className="break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        isOwnMessage ? "text-emerald-100" : "text-gray-500"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl p-3 border border-gray-300 dark:border-gray-600 focus-within:border-emerald-500 transition">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                className="w-full bg-transparent resize-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows="1"
                style={{
                  minHeight: "24px",
                  maxHeight: "120px",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}