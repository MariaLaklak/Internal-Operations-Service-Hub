import type { Request } from '../types/request';

type RequestListProps = {
  requests: Request[];
};

export function RequestList({ requests }: RequestListProps) {
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
        </article>
      ))}
    </div>
  );
}
