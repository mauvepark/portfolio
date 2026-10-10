import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { AdminPanel } from '@/components/admin/AdminPanel';

export const metadata: Metadata = {
  title: 'Admin — Noor Ali',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="wrap">
      <SiteHeader />
      <AdminPanel />
    </div>
  );
}
