import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import LinkedInProvider from "next-auth/providers/linkedin";
import mongoose from "mongoose";
import User from "@/models/user";
import Payment from "@/models/Payment";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: { params: { scope: "read:user user:email" } }
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      console.log("SIGN IN CALLBACK USER:", user);

      try {
        if (!user.email) {
          console.error("No email found");
          return false;
        }

        await mongoose.connect(process.env.MONGODB_URI);
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          await User.create({
            email: user.email,
            name: user.name,
            profilepic: user.image,
            username:
              user.name?.replace(/\s+/g, "").toLowerCase() ||
              user.email.split("@")[0],
          });
        }

        return true;
      } catch (err) {
        console.error("signIn error:", err);
        return false;
      }
    },

    async session({ session }) {
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dbUser = await User.findOne({ email: session.user.email });

        if (dbUser) {
          session.user.id = dbUser._id.toString();
          session.user.username = dbUser.username;
          session.user.profilepic = dbUser.profilepic;
        }

        return session;
      } catch (err) {
        console.error("session callback error:", err);
        return session;
      }
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/home`;
    }
  }
});

export { handler as GET, handler as POST };
