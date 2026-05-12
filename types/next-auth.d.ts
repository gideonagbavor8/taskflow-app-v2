import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      workspaceId: string | null
      workspaceName: string | null
    } & DefaultSession["user"]
  }
}
