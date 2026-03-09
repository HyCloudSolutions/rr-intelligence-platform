import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session?.user?.role === 'superadmin') {
    redirect('/superadmin');
  } else if (session?.user?.role === 'director') {
    redirect('/director/dashboard');
  } else {
    redirect('/inspector/queue');
  }
}
