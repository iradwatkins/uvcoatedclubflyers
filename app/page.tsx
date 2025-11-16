export default function Home() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉 UV Coated Club Flyers</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Welcome to your Docker development environment!</p>
        <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '8px', maxWidth: '500px' }}>
          <p>✅ Next.js running inside Docker</p>
          <p>✅ PostgreSQL ready at localhost:5448</p>
          <p>✅ Redis ready at localhost:6302</p>
          <p>✅ MinIO ready at localhost:9102</p>
        </div>
      </div>
    </main>
  );
}
