'use client';
import { useRouter, usePathname } from 'next/navigation';
import { T } from '@/lib/theme';

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function Nav() {
  const router     = useRouter();
  const path       = usePathname();
  const onHome     = path === '/';
  const onScan     = path === '/scan';
  const onSchedule = path === '/schedule';

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: T.surface,
      borderTop: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.07)',
      paddingBottom: 'env(safe-area-inset-bottom, 4px)',
    }}>

      {/* Garden */}
      <button onClick={() => router.push('/')} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 3, padding: '10px 0 10px',
        background: 'none', border: 'none', cursor: 'pointer',
        color: onHome ? T.green : T.muted,
        minHeight: 56, transition: 'color 0.15s',
      }}>
        <HomeIcon active={onHome} />
        <span style={{ fontSize: 10, fontWeight: onHome ? 700 : 500, letterSpacing: 0.3 }}>Garden</span>
      </button>

      {/* Scan — primary action: green pill */}
      <button onClick={() => router.push('/scan')} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '8px 0 10px',
        background: 'none', border: 'none', cursor: 'pointer',
        minHeight: 56,
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          background: onScan ? T.greenDark : T.green,
          color: '#fff', borderRadius: 16, padding: '8px 22px',
          boxShadow: onScan ? 'none' : `0 3px 12px rgba(46,125,50,0.35)`,
          transition: 'background 0.15s, box-shadow 0.15s',
        }}>
          <CameraIcon />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>Scan</span>
        </div>
      </button>

      {/* Schedule */}
      <button onClick={() => router.push('/schedule')} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 3, padding: '10px 0 10px',
        background: 'none', border: 'none', cursor: 'pointer',
        color: onSchedule ? T.green : T.muted,
        minHeight: 56, transition: 'color 0.15s',
      }}>
        <CalendarIcon active={onSchedule} />
        <span style={{ fontSize: 10, fontWeight: onSchedule ? 700 : 500, letterSpacing: 0.3 }}>Schedule</span>
      </button>

    </nav>
  );
}
