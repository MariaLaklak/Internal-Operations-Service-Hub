import { useEffect, useState } from 'react';
import { getRequests } from './api/requests';
import { RequestForm } from './components/RequestForm';
import { RequestList } from './components/RequestList';
import type { ActorAlias, Request } from './types/request';

const teachingActors: { label: string; alias: ActorAlias }[] = [
  { label: 'Demo Employee', alias: 'demo-employee' },
  { label: 'IT Department Staff', alias: 'it-staff-001' }
];

export default function App() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState('');
  const [actorAlias, setActorAlias] = useState<ActorAlias>('demo-employee');

  useEffect(() => {
    getRequests().then(setRequests).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : 'Could not load requests.');
    });
  }, []);

  return (
    <main className="page-shell">
      <header>
        <p className="eyebrow">Internal Operations Service Hub</p>
        <h1>What can we help you with?</h1>
        <p className="intro">Send a request to the right department and keep its progress in view.</p>
      </header>
      <section className="panel teaching-actor" aria-labelledby="teaching-actor-heading">
        <h2 id="teaching-actor-heading">Teaching actor</h2>
        <label htmlFor="actor-select">Local-development teaching actor</label>
        <select
          id="actor-select"
          value={actorAlias}
          onChange={(event) => setActorAlias(event.target.value as ActorAlias)}
        >
          {teachingActors.map((actor) => (
            <option key={actor.alias} value={actor.alias}>{actor.label}</option>
          ))}
        </select>
        <p className="helper-text">For local teaching only. This selector is not authentication.</p>
      </section>
      <section className="workspace">
        <div className="panel">
          <h2>New request</h2>
          <RequestForm
            actorAlias={actorAlias}
            onCreated={(request) => setRequests((current) => [request, ...current])}
          />
        </div>
        <div className="panel">
          <h2>Your requests</h2>
          {error && <p className="error" role="alert">{error}</p>}
          <RequestList
            requests={requests}
            actorAlias={actorAlias}
            onStatusUpdated={(updatedRequest) => {
              setRequests((current) => current.map((request) => (
                request.id === updatedRequest.id ? updatedRequest : request
              )));
            }}
          />
        </div>
      </section>
    </main>
  );
}
