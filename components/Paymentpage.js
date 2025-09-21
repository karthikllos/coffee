"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const PaymentPage = ({ username }) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(0);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // preset amounts (like chai widget)
  const predefinedAmounts = [50, 100, 200, 500];

  useEffect(() => {
    if (username) getData();
  }, [username]);

  const getData = async () => {
    try {
      const res = await fetch(
        `/api/payments?username=${encodeURIComponent(username)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch payments");
      const paymentData = await res.json();
      setPayments(Array.isArray(paymentData) ? paymentData : []);
    } catch (err) {
      console.error("Error fetching payments:", err);
    }
  };

  const handleSubmit = async () => {
    if (!username) {
      toast.error("Cannot process payment: Username is missing.");
      return;
    }

    const finalAmount = isCustom ? parseInt(customAmount) : amount;

    if (!name || !finalAmount) {
      toast.error("Name and amount are required!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          message,
          amount: finalAmount,
          to_username: username,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      toast.success("Payment sent successfully!");

      // ✅ NEW: Trigger AI Thank-You Generator via custom event
      try {
        window.dispatchEvent(
          new CustomEvent("payments-updated", {
            detail: {
              username,
              payment: {
                _id: `temp_${Date.now()}`,
                name,
                message,
                amount: finalAmount,
                createdAt: new Date().toISOString(),
              },
              showThankYou: true, // ✅ NEW: Flag to trigger thank-you modal
            },
          })
        );
      } catch {}

      setName("");
      setMessage("");
      setAmount(0);
      setCustomAmount("");
      setIsCustom(false);

      await getData();
      router.refresh();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[color:var(--border)] shadow-[0_0_24px_var(--accent-shadow)]">
      {/* Header with Mac-style dots */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
          Make a Payment
        </h2>
        <p className="text-lg font-semibold text-[color:var(--muted)]">
          Support{" "}
          <span className="text-[color:var(--accent-solid)]">@{username}</span>
        </p>
      </div>

      {/* Name input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Your name (optional)"
          className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-pink-500"
          style={{
            backgroundColor: "var(--surface-2, #f8fafc)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Message input */}
      <div className="mb-4">
        <textarea
          placeholder="Say something nice..."
          className="w-full p-4 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
          style={{
            backgroundColor: "var(--surface-2, #f8fafc)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Amount selection */}
      <div className="flex justify-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Custom toggle */}
          <button
            onClick={() => {
              setIsCustom(true);
              setAmount(0);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium border-2 ${
              isCustom
                ? "bg-pink-500 text-white border-pink-500"
                : "bg-gray-100 dark:bg-gray-700"
            }`}
            style={{ borderColor: isCustom ? "" : "var(--border)" }}
          >
            ×
          </button>
          {/* Preset buttons */}
          {predefinedAmounts.map((a) => (
            <button
              key={a}
              onClick={() => {
                setAmount(a);
                setIsCustom(false);
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium border-2 ${
                amount === a && !isCustom
                  ? "bg-pink-500 text-white border-pink-500"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
              style={{
                borderColor:
                  amount === a && !isCustom ? "" : "var(--border)",
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount input */}
      {isCustom && (
        <div className="mb-4">
          <input
            type="number"
            min="1"
            placeholder="Enter amount..."
            className="w-full p-3 rounded-xl border text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={{
              backgroundColor: "var(--surface-2, #f8fafc)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-500 to-red-800 hover:from-pink-600 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading
          ? "Processing..."
          : `Support ₹${isCustom ? customAmount || "1" : amount} ☕`}
      </button>
    </div>
  );
};

export default PaymentPage;