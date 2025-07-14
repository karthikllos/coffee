import mongoose from "mongoose";
import User from "@/models/user";
import PaymentPage from "@/components/Paymentpage";
import Supporters from "@/components/Supporters";

export default async function UsernamePage(context) {
  const params = await context.params;  // ✅ await params
  const { username } = params;

  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ username }).lean();

  if (!user) return <div className="text-white">User not found</div>;

  return (
    <div className="text-white bg-black min-h-screen">
      <div className="relative w-full h-80">
        <img src="/cover.gif" alt="Cover" className="object-cover w-full h-full" />
        <div className="absolute left-1/2 -bottom-12 transform -translate-x-1/2">
          <img
            src={user.profilepic || "/profile.jpg"}
            alt="Profile"
            className="rounded-full w-24 h-24 border-4 border-white"
          />
        </div>
      </div>

      <div className="pt-20 text-center px-4">
        <h2 className="text-xl font-semibold">@{user.username}</h2>
        <p className="text-gray-400 mt-1">Creating amazing content for the community</p>
      </div>

      <div className="pt-12 px-8 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2">
            <Supporters username={user.username} />
          </div>
          <div className="w-full lg:w-1/2">
            <PaymentPage username={user.username} />
          </div>
        </div>
      </div>
    </div>
  );
}
