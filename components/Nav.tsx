'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { T } from '@/lib/theme';

// Critically damped (no overshoot) — default UI transitions
const SPRING_UI  = { type: 'spring' as const, bounce: 0,    duration: 0.35 };
// Fast snap — finger-press feedback, must feel instant
const SPRING_TAP = { type: 'spring' as const, bounce: 0,    duration: 0.18 };
// Underdamped — FAB & momentum-driven reveals feel physical
const SPRING_FAB = { type: 'spring' as const, bounce: 0.18, duration: 0.42 };

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

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <circle cx="12" cy="7" r="4"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
    </svg>
  );
}

function CameraIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function UploadIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.4} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TabButton({ label, active, onClick, children }: {
  label: string; active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.86 }}
      transition={SPRING_TAP}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 4, padding: '10px 0',
        background: 'none', border: 'none', cursor: 'pointer',
        color: active ? T.green : T.muted,
        minHeight: 56,
      }}>
      <div style={{ position: 'relative', padding: '6px 18px', borderRadius: 14 }}>
        {active && (
          <motion.div
            layoutId="nav-pill"
            style={{ position: 'absolute', inset: 0, borderRadius: 14, background: T.greenLight }}
            transition={SPRING_UI}
          />
        )}
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      </div>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: 0.3 }}>{label}</span>
    </motion.button>
  );
}

export function Nav() {
  const router = useRouter();
  const path   = usePathname();
  const [fabOpen, setFabOpen] = useState(false);

  const go = (dest: string) => {
    setFabOpen(false);
    router.push(dest);
  };

  const ACTIONS = [
    { label: 'Take photo',   icon: <CameraIcon size={18} />, dest: '/scan?mode=camera' },
    { label: 'Upload photo', icon: <UploadIcon />,           dest: '/scan?mode=upload' },
  ];

  return (
    <>
      {/* Scrim behind the open speed dial */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setFabOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(25,29,25,0.32)' }}
          />
        )}
      </AnimatePresence>

      {/* ── M3 FAB speed dial ── */}
      <div style={{
        position: 'fixed', right: 16, zIndex: 120,
        bottom: 'calc(env(safe-area-inset-bottom, 4px) + 76px)',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12,
      }}>
        <AnimatePresence>
          {fabOpen && ACTIONS.map((a, i) => (
            <motion.button
              key={a.label}
              onClick={() => go(a.dest)}
              initial={{ opacity: 0, y: 14, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.85 }}
              transition={{ ...SPRING_FAB, delay: fabOpen ? (ACTIONS.length - 1 - i) * 0.04 : 0 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: T.surface, color: T.greenDark,
                border: 'none', borderRadius: 16,
                padding: '13px 18px',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.08)',
              }}>
              {a.icon}
              {a.label}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Main FAB — M3 large shape (16px radius), rotates + to × when open */}
        <motion.button
          onClick={() => setFabOpen(o => !o)}
          whileTap={{ scale: 0.92 }}
          animate={{
            rotate: fabOpen ? 45 : 0,
            background: fabOpen ? T.greenDark : T.green,
          }}
          transition={SPRING_FAB}
          aria-label={fabOpen ? 'Close scan menu' : 'Scan a plant'}
          style={{
            width: 56, height: 56, borderRadius: 16,
            color: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: T.shadowGreen,
          }}>
          {fabOpen ? <PlusIcon /> : <CameraIcon />}
        </motion.button>
      </div>

      {/* ── Bottom navigation bar ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(246,250,246,0.82)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.55)',
        display: 'flex', alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 4px)',
      }}>
        <LayoutGroup>
          <TabButton label="Garden" active={path === '/'} onClick={() => go('/')}>
            <HomeIcon active={path === '/'} />
          </TabButton>
          <TabButton label="Schedule" active={path === '/schedule'} onClick={() => go('/schedule')}>
            <CalendarIcon active={path === '/schedule'} />
          </TabButton>
          <TabButton label="Profile" active={path === '/profile'} onClick={() => go('/profile')}>
            <ProfileIcon active={path === '/profile'} />
          </TabButton>
        </LayoutGroup>
      </nav>
    </>
  );
}
