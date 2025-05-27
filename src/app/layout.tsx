import "./globals.css"
import SessionProvider from "@/components/SessionProvider"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/route"
import { Providers } from './providers'

export const metadata = {
  title: "BinTrack - Smart Waste Management",
  description: "Track bins, earn rewards, make a difference",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
