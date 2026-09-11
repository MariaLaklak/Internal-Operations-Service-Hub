export type Department = 'IT' | 'Human Resources' | 'Finance';
export type RequestStatus = 'Submitted' | 'In Progress' | 'Resolved';
export type ActorAlias = 'demo-employee' | 'it-staff-001';

export type Request = {
  id: string;
  title: string;
  description: string;
  department: Department;
  requester: string;
  requiresApproval: boolean;
  status: RequestStatus;
  createdAt: string;
};

export type CreateRequestInput = {
  title: string;
  description: string;
  department: Department;
  requiresApproval: boolean;
};
