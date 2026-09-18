import { FormEvent, useState } from 'react';
import { createRequest, getRequestIntakeAdvice } from '../api/requests';
import type { ActorAlias, Department, Request, RequestIntakeAdvice } from '../types/request';

const departments: Department[] = ['IT', 'Human Resources', 'Finance'];

type RequestFormProps = {
  actorAlias: ActorAlias;
  onCreated: (request: Request) => void;
};

export function RequestForm({ actorAlias, onCreated }: RequestFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>('IT');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advice, setAdvice] = useState<RequestIntakeAdvice | null>(null);
  const [adviceError, setAdviceError] = useState('');
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);

  async function handleGetAdvice() {
    setAdviceError('');
    setIsGettingAdvice(true);

    try {
      setAdvice(await getRequestIntakeAdvice(description, actorAlias));
    } catch (adviceRequestError) {
      setAdvice(null);
      setAdviceError(adviceRequestError instanceof Error ? adviceRequestError.message : 'AI intake advice could not be produced.');
    } finally {
      setIsGettingAdvice(false);
    }
  }

  function handleUseSuggestion() {
    if (!advice) {
      return;
    }

    setTitle(advice.suggestedTitle);
    if (advice.suggestedDepartment) {
      setDepartment(advice.suggestedDepartment);
    }
  }

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
      setAdvice(null);
      setAdviceError('');
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
        <textarea
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            setAdvice(null);
            setAdviceError('');
          }}
          required
          maxLength={2000}
        />
      </label>
      <div className="intake-advice-actions">
        <button type="button" onClick={handleGetAdvice} disabled={isGettingAdvice || !description.trim()}>
          Get AI intake advice
        </button>
        {isGettingAdvice && <span role="status" aria-live="polite">Getting advice...</span>}
      </div>
      {adviceError && <p className="error" role="alert">{adviceError}</p>}
      {advice && (
        <section className="intake-advice" aria-labelledby="intake-advice-heading">
          <div className="intake-advice-heading">
            <h3 id="intake-advice-heading">AI intake advice</h3>
            <button type="button" className="secondary-action" onClick={handleUseSuggestion}>Use suggestion</button>
          </div>
          <dl>
            <div>
              <dt>Suggested title</dt>
              <dd>{advice.suggestedTitle}</dd>
            </div>
            <div>
              <dt>Suggested department</dt>
              <dd>{advice.suggestedDepartment ?? 'Needs clarification'}</dd>
            </div>
            <div>
              <dt>Summary</dt>
              <dd>{advice.summary}</dd>
            </div>
            <div>
              <dt>Missing information</dt>
              <dd>
                {advice.missingInformation.length > 0 ? (
                  <ul>
                    {advice.missingInformation.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : 'None identified'}
              </dd>
            </div>
            <div>
              <dt>Suggested next step</dt>
              <dd>{advice.suggestedNextStep}</dd>
            </div>
          </dl>
        </section>
      )}
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
