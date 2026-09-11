export type Department = 'IT' | 'Human Resources' | 'Finance';

export type Request = {
  id: string;
  title: string;
  description: string;
  department: Department;
  requester: string;
  requiresApproval: boolean;
  status: string;
  createdAt: string;
};

export type CreateRequestInput = {
  title: string;
  description: string;
  department: Department;
  requiresApproval: boolean;
};
