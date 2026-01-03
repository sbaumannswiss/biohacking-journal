import { redirect } from 'next/navigation';

// Redirect old /biohack route to new /stats route
export default function BiohackPage() {
    redirect('/stats');
}
