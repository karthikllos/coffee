"use client";

import React, { useEffect, useState } from "react";
import { fetchPayments } from "@/actions/useractions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const PaymentPage = ({ username }) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (username) getData();
  }, [username]);

  const getData = async () => {
    try {
      const paymentData = await fetchPayments(username);
      setPayments(paymentData);
      toast.success("Supporters loaded!");
    } catch (err) {
      console.error("Error fetching payments:", err);
      toast.error("Failed to load payments.");
    }
  };

  const handleSubmit = async () => {
    if (!username) {
      toast.error("Cannot process payment: Username is missing.");
      return;
    }

    if (!name || !amount) {
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
          amount: parseInt(amount),
          to_username: username,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      toast.success("Payment sent successfully!");

      setName("");
      setMessage("");
      setAmount("");

      await getData();
      router.refresh();  // ✅ Force refresh of route (server side fetch data updated)
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-5">Make a Payment</h2>

      <p className="text-lg font-semibold mb-2 text-center">
        Support <span className="text-yellow-400">@{username}</span>
      </p>

      <input
        type="text"
        placeholder="Your name"
        className="w-full mb-3 p-2 rounded bg-slate-800 text-white"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <textarea
        placeholder="Message"
        className="w-full mb-3 p-2 rounded bg-slate-800 text-white"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount (e.g. 500)"
        className="w-full mb-3 p-2 rounded bg-slate-800 text-white"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`bg-yellow-500 text-black font-bold py-2 px-4 rounded w-full hover:bg-yellow-600 transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : "Send Coffee ☕"}
      </button>
    </div>
  );
};

export default PaymentPage;
