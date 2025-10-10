import React, { useState, useEffect } from 'react';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test if localStorage is available
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (e) {
      setError('localStorage not available');
      setIsLoading(false);
      return;
    }

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2>Loading AutoMotive Marketplace...</h2>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: 'red' }}>
          <h2>Error: {error}</h2>
          <p>Please check your browser settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🚗 AutoMotive Marketplace</h1>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Home</a>
            <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Vehicles</a>
            <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Login</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <section style={{ 
            backgroundColor: 'white', 
            padding: '2rem', 
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Welcome to AutoMotive!</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#666' }}>
              Your premier destination for buying and selling vehicles. Browse our extensive collection 
              of cars, motorcycles, and commercial vehicles with AI-powered search and recommendations.
            </p>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Features */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>🔍 Smart Search</h3>
              <p>AI-powered vehicle search with intelligent recommendations based on your preferences.</p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>💬 Live Chat</h3>
              <p>Real-time messaging between buyers and sellers for instant communication.</p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>📊 Analytics</h3>
              <p>Comprehensive analytics and insights for sellers to optimize their listings.</p>
            </div>
          </div>

          {/* Status */}
          <div style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            color: '#155724',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>✅ Test App is Working!</h3>
            <p style={{ margin: 0 }}>
              This is a simplified test version. If you can see this, React is working correctly.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '2rem',
        textAlign: 'center',
        marginTop: '2rem'
      }}>
        <p>&copy; 2024 AutoMotive Marketplace. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
