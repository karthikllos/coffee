"use client";

import { useEffect, useState } from "react";
import { fetchPayments } from "@/actions/useractions";

export default function Supporters({ username }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchPayments(username);
        setPayments(data);
      } catch (err) {
        console.error("Failed to fetch payments", err);
      }
    };

    fetchData();
  }, [username]);

  return (
    <div className="bg-slate-900 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-5">Recent Supporters</h2>
      <ul>
        {payments.map((p) => (
          <li key={p._id} className="my-2">
            {p.name} donated ₹{p.amount} — “{p.message || "No message"}”
          </li>
        ))}
      </ul>
      {payments.length === 0 && <p className="text-gray-400">No supporters yet.</p>}
    </div>
  );
}
