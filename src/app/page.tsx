import { redirect } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

export default async function Home() {
  const token = await getAuthToken();
  if (token) redirect('/dashboard');
  else redirect('/login');
}
