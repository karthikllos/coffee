// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/auth";

const handler = NextAuth(authOptions);

// Re-export authOptions so other routes can import it
export { handler as GET, handler as POST, authOptions };
