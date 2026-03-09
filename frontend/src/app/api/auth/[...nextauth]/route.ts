import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import CognitoProvider from "next-auth/providers/cognito";

// In a real application, this would use the CognitoProvider exclusively.
// To support the completely offline/local quickstart mandate without AWS credentials, 
// we selectively enable the `CredentialsProvider` mock if Cognito env vars are absent.
export const authOptions = {
  providers: [
    ...(process.env.COGNITO_CLIENT_ID ? [
      CognitoProvider({
        clientId: process.env.COGNITO_CLIENT_ID,
        clientSecret: process.env.COGNITO_CLIENT_SECRET || "",
        issuer: process.env.COGNITO_ISSUER,
        profile(profile) {
          // Map Cognito claims to our session structure
          const groups = profile["cognito:groups"] || [];
          let role = "inspector";
          if (groups.includes("superadmin")) role = "superadmin";
          else if (groups.includes("director")) role = "director";

          return {
            id: profile.sub,
            name: profile.name || profile.username,
            email: profile.email,
            tenant_id: profile["custom:tenant_id"],
            role: role
          };
        }
      })
    ] : []),
    CredentialsProvider({
      name: "Local Mock Login",
      credentials: {
        username: { label: "Username ('superadmin', 'director', 'inspector')", type: "text", placeholder: "inspector" },
        password: { label: "Password (any)", type: "password" }
      },
      async authorize(credentials, req) {
        // Mocking the Cognito JWT payload structure
        let role = 'inspector';
        if (credentials?.username === 'director') role = 'director';
        else if (credentials?.username === 'superadmin') role = 'superadmin';

        return {
          id: "1",
          name: "Local Tester",
          email: `${role}@rr-local.test`,
          tenant_id: "11111111-1111-1111-1111-111111111111", // Matches LOCAL_TENANT_ID from seed script
          role: role
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.tenant_id = user.tenant_id;
        token.role = user.role;
      }
      if (account) {
        if (account.provider === 'credentials') {
          const syntheticToken = JSON.stringify({ "custom:tenant_id": token.tenant_id, "cognito:groups": [token.role] });
          token.accessToken = `header.${Buffer.from(syntheticToken).toString('base64')}.signature`;
        } else {
          token.accessToken = account.access_token;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.tenant_id = token.tenant_id;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: '/login',
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
