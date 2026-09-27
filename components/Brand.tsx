import Link from 'next/link';

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
        color: '#111',
        fontWeight: 700,
        fontSize: compact ? 16 : 20,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <span
        style={{
          width: compact ? 22 : 28,
          height: compact ? 22 : 28,
          borderRadius: 7,
          background: '#111',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: compact ? 13 : 16,
        }}
      >
        X
      </span>
      Xign
    </Link>
  );
}
