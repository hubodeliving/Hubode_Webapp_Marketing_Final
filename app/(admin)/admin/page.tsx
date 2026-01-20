import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // When a user navigates to "/admin", immediately redirect to "/admin/login"
  redirect('/admin/login');
}