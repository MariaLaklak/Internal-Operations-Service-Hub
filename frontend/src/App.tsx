import { useEffect, useState } from 'react';
import { getRequests } from './api/requests';
import { RequestForm } from './components/RequestForm';
import { RequestList } from './components/RequestList';
import type { Request } from './types/request';

export default function App() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getRequests().then(setRequests).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : 'Could not load requests.');
    });
  }, []);

  return (
    <main className="page-shell">
      <header>
        <p className="eyebrow">Internal Operations Service Hub</p>
        <h1>What can we help with?</h1>
        <p className="intro">Send a request to the right department and keep its progress in view.</p>
      </header>
      <section className="workspace">
        <div className="panel">
          <h2>New request</h2>
          <RequestForm onCreated={(request) => setRequests((current) => [request, ...current])} />
        </div>
        <div className="panel">
          <h2>Your requests</h2>
          {error && <p className="error" role="alert">{error}</p>}
          <RequestList requests={requests} />
        </div>
      </section>
    </main>
  );
}
