interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

export function Loading({ message = 'Loading...', fullPage = false }: LoadingProps) {
  const content = (
    <div style={{ textAlign: 'center', padding: '32px' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 12px',
        }}
      />
      <p style={{ color: '#6b7280' }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
