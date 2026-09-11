import { useState } from 'react';
import { updateRequestStatus } from '../api/requests';
import type { ActorAlias, Request } from '../types/request';

type RequestListProps = {
  requests: Request[];
  actorAlias: ActorAlias;
  onStatusUpdated: (request: Request) => void;
};

export function RequestList({ requests, actorAlias, onStatusUpdated }: RequestListProps) {
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  if (requests.length === 0) {
    return <p className="empty-state">No requests submitted yet.</p>;
  }

  return (
    <div className="request-list">
      {requests.map((request) => (
        <article className="request-item" key={request.id}>
          <div className="request-heading">
            <h3>{request.title}</h3>
            <span className="status">{request.status}</span>
          </div>
          <p>{request.description}</p>
          <dl>
            <div><dt>Department</dt><dd>{request.department}</dd></div>
            <div><dt>Created</dt><dd>{new Date(request.createdAt).toLocaleString()}</dd></div>
          </dl>
          {actionErrors[request.id] && <p className="error request-error" role="alert">{actionErrors[request.id]}</p>}
          {request.status === 'Submitted' && (
            <button
              className="request-action"
              type="button"
              disabled={updatingRequestId === request.id}
              onClick={() => {
                setUpdatingRequestId(request.id);
                setActionErrors((current) => ({ ...current, [request.id]: '' }));
                updateRequestStatus(request.id, actorAlias)
                  .then(onStatusUpdated)
                  .catch((actionError: unknown) => {
                    setActionErrors((current) => ({
                      ...current,
                      [request.id]: actionError instanceof Error ? actionError.message : 'Could not update request status.'
                    }));
                  })
                  .finally(() => setUpdatingRequestId(null));
              }}
            >
              {updatingRequestId === request.id ? 'Updating...' : 'Move to In Progress'}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
