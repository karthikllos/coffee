// lib/auth.js - OPTIMIZED VERSION

import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import connectDb from "./connectDb";
import User from "../models/user";
import bcryptjs from "bcryptjs";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: false, // ❌ TURN OFF IN PRODUCTION
  trustHost: true,

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          await connectDb();

          const user = await User.findOne({
            $or: [
              { email: credentials.email.toLowerCase() },
              { username: credentials.email.toLowerCase() },
            ],
          })
            .select("+password +loginAttempts +accountLocked +accountLockedUntil subscriptionPlan subscriptionStatus aiCredits isAdmin")
            .lean(); // ✅ USE LEAN FOR FASTER QUERIES

          if (!user) {
            throw new Error("No account found with this email");
          }

          // Check account lock
          if (user.accountLocked && user.accountLockedUntil > Date.now()) {
            throw new Error("Account temporarily locked. Try again later.");
          }

          if (!user.password) {
            throw new Error("Please sign in using your social account");
          }

          const isValidPassword = await bcryptjs.compare(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            // Update failed attempts (fire and forget - don't await)
            User.findByIdAndUpdate(user._id, {
              $inc: { loginAttempts: 1 },
            }).exec();
            
            throw new Error("Invalid password");
          }

          // Reset login attempts (fire and forget)
          User.findByIdAndUpdate(user._id, {
            accountLocked: false,
            loginAttempts: 0,
            accountLockedUntil: null,
            lastLoginAt: new Date(),
          }).exec();

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            username: user.username,
            image: user.profilepic,
            subscriptionPlan: user.subscriptionPlan || "Free",
            subscriptionStatus: user.subscriptionStatus || "inactive",
            aiCredits: user.aiCredits || 0,
            isAdmin: user.isAdmin || false,
          };
        } catch (error) {
          console.error("Auth error:", error.message);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authorization: { params: { scope: "r_liteprofile r_emailaddress" } },
    }),
  ],

  pages: {
    signIn: "/auth",
    error: "/auth",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) {
          const maybeEmail =
            profile?.email ||
            profile?.emailAddress ||
            profile?.elements?.[0]?.["handle~"]?.emailAddress;
          if (maybeEmail) user.email = maybeEmail;
        }

        if (!user.email) {
          console.error("No email from OAuth provider");
          return false;
        }

        await connectDb();

        const existingUser = await User.findOne({ email: user.email }).lean();

        if (!existingUser) {
          const baseUsername = (
            user.name?.replace(/\s+/g, "").toLowerCase() ||
            user.email.split("@")[0]
          ).slice(0, 24);
          
          let uniqueUsername = baseUsername;
          let suffix = 0;

          // ✅ OPTIMIZED: Check username existence more efficiently
          while (await User.exists({ username: uniqueUsername })) {
            suffix += 1;
            uniqueUsername = `${baseUsername}${suffix}`.slice(0, 30);
          }

          await User.create({
            email: user.email,
            name: user.name,
            profilepic: user.image,
            username: uniqueUsername,
            isOAuthUser: true,
            isEmailVerified: true,
            oauthProviders: [
              {
                provider: account.provider,
                providerId: account.providerAccountId,
              },
            ],
            lastLoginAt: new Date(),
          });
        } else {
          // ✅ UPDATE ONLY IF NEEDED (fire and forget)
          User.updateOne(
            { _id: existingUser._id },
            {
              lastLoginAt: new Date(),
              $addToSet: {
                oauthProviders: {
                  provider: account.provider,
                  providerId: account.providerAccountId,
                },
              },
            }
          ).exec();
        }

        return true;
      } catch (err) {
        console.error("signIn callback error:", err);
        return true; // ✅ Still allow login even if DB update fails
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.subscriptionPlan = user.subscriptionPlan || "Free";
        token.subscriptionStatus = user.subscriptionStatus || "inactive";
        token.aiCredits = user.aiCredits || 0;
        token.isAdmin = user.isAdmin || false;
      }

      if (trigger === "update" && session) {
        token.subscriptionPlan = session.subscriptionPlan;
        token.subscriptionStatus = session.subscriptionStatus;
        token.aiCredits = session.aiCredits;
      }

      // ✅ ONLY REFRESH FROM DB OCCASIONALLY (not every request)
      const shouldRefresh = !token.lastRefresh || Date.now() - token.lastRefresh > 60000;
      
      if (shouldRefresh) {
        try {
          await connectDb();
          const dbUser = await User.findOne({ email: token.email })
            .select('_id username profilepic subscriptionPlan subscriptionStatus aiCredits isAdmin')
            .lean();
          
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.username = dbUser.username;
            token.subscriptionPlan = dbUser.subscriptionPlan || "Free";
            token.subscriptionStatus = dbUser.subscriptionStatus || "inactive";
            token.aiCredits = dbUser.aiCredits || 0;
            token.isAdmin = dbUser.isAdmin || false;
            token.profilepic = dbUser.profilepic;
            token.lastRefresh = Date.now();
          }
        } catch (err) {
          console.error("jwt refresh error:", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.subscriptionPlan = token.subscriptionPlan || "Free";
        session.user.subscriptionStatus = token.subscriptionStatus || "inactive";
        session.user.aiCredits = token.aiCredits || 0;
        session.user.isAdmin = token.isAdmin || false;
        session.user.profilepic = token.profilepic;
      }
      return session;
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/`;
    },
  },
};
