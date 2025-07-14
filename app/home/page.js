"use client";

import React from "react";
import { useSession } from "next-auth/react";
import PaymentPage from "@/components/Paymentpage";

const UserProfilePage = ({ params }) => {
  const { username } = params;
  const { data: session } = useSession();

  return (
    <div className="text-white bg-black min-h-screen">
      {/* Cover Image */}
      <div className="relative w-full h-80">
        <img
          src="/cover.gif"
          alt="Cover"
          className="object-cover w-full h-full"
        />

        {/* Profile Picture */}
        <div className="absolute left-1/2 -bottom-12 transform -translate-x-1/2">
          <img
            src={session?.user?.image || "/profile.jpg"}
            alt="Profile"
            className="rounded-full w-24 h-24 border-4 border-white"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="pt-20 text-center px-4">
        <h2 className="text-xl font-semibold">@{username}</h2>
        <p className="text-gray-400 mt-1">Creating amazing content for the community</p>
        <p className="text-gray-400 mt-1 text-sm">
          1,000 supporters · 45 posts · $8,000 received
        </p>
      </div>

      {/* Main Content */}
      <div className="pt-12 px-8 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Supporters */}
          <div className="w-full lg:w-1/2 bg-slate-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-5">Recent Supporters</h2>
            <ul className="mx-2">
              <li className="my-2">Shubham donated $30 — “Thanks!”</li>
              <li className="my-2">Aarav donated $20 — “Keep going 💪”</li>
              <li className="my-2">Nina donated $50 — “Love your work!”</li>
              <li className="my-2">Liam donated $10 — “Cheers!”</li>
            </ul>
          </div>

          {/* Payment Form */}
          <div className="w-full lg:w-1/2 bg-slate-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-5">Make a Payment</h2>
            <PaymentPage to_username={username} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
