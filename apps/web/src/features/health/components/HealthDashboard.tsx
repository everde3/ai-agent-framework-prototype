import { useHealthCheck } from '../hooks/useHealthCheck';
import { formatUptime } from '@repo/isomorphic-utils';

export function HealthDashboard() {
  const { health, loading, error, refetch } = useHealthCheck();

  if (loading) {
    return (
      <div className="health-dashboard">
        <h1>System Health Dashboard</h1>
        <div className="health-status">
          <div className="status-dot loading"></div>
          <span>Checking system health...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="health-dashboard">
        <h1>System Health Dashboard</h1>
        <div className="health-status">
          <div className="status-dot unhealthy"></div>
          <span>System Unavailable</span>
        </div>
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={refetch}
          style={{ 
            marginTop: '1rem', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="health-dashboard">
        <h1>System Health Dashboard</h1>
        <div className="health-status">
          <div className="status-dot unhealthy"></div>
          <span>No Health Data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="health-dashboard">
      <h1>System Health Dashboard</h1>
      
      <div className="health-status">
        <div className={`status-dot ${health.status}`}></div>
        <span>System is {health.status}</span>
      </div>

      <div className="health-details">
        <div className="detail-item">
          <div className="detail-label">Uptime</div>
          <div className="detail-value">{formatUptime(health.uptime)}</div>
        </div>
        
        <div className="detail-item">
          <div className="detail-label">Last Check</div>
          <div className="detail-value">
            {new Date(health.timestamp).toLocaleTimeString()}
          </div>
        </div>
        
        {health.version && (
          <div className="detail-item">
            <div className="detail-label">Version</div>
            <div className="detail-value">{health.version}</div>
          </div>
        )}
        
        <div className="detail-item">
          <div className="detail-label">Status Code</div>
          <div className="detail-value">200 OK</div>
        </div>
      </div>

      <p style={{ marginTop: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>
        Health status updates every 5 seconds
      </p>
    </div>
  );
}