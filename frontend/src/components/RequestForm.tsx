import { FormEvent, useState } from 'react';
import { createRequest } from '../api/requests';
import type { Department, Request } from '../types/request';

const departments: Department[] = ['IT', 'Human Resources', 'Finance'];

type RequestFormProps = {
  onCreated: (request: Request) => void;
};

export function RequestForm({ onCreated }: RequestFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>('IT');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const request = await createRequest({ title, description, department, requiresApproval });
      onCreated(request);
      setTitle('');
      setDescription('');
      setRequiresApproval(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Request failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} required maxLength={2000} />
      </label>
      <label>
        Department
        <select value={department} onChange={(event) => setDepartment(event.target.value as Department)}>
          {departments.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label className="checkbox-label">
        <input type="checkbox" checked={requiresApproval} onChange={(event) => setRequiresApproval(event.target.checked)} />
        This request requires approval
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit request'}</button>
    </form>
  );
}
