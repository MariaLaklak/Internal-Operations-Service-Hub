# Internal Operations Service Hub Specifications 

## 1. Problem and Context

Employees currently ask for help through different and unorganized communication channels. 
For example, an employee may report that their laptop has a problem, request access to a software system, request an employment letter,
or ask for approval for a work expense.

Because there is no single system for managing these requests, a request may be forgotten or sent to the wrong person. 
It may also be unclear who is responsible for handling it, what its current status is, or who should approve it.

The company therefore needs one internal system where employees can submit requests, the responsible departments can handle them, 
and everyone involved can follow their progress.


## 2. Known Facts

- The product is a company-internal system.
- The first version will support requests for IT, Human Resources, and Finance.
- Employees currently use different and unorganized channels to request help which makes things complicated.
- Requests may be forgotten or sent to the wrong person.
- Request ownership, status, and approval may be unclear.
- The company wants one system in which requests can be submitted, handled, and followed.

## 3. Actors and Stakeholders

### Employee (Requester)

The employee is the person who needs help and submits a request. The employee should be able to provide the request details 
and follow its progress.

### Department Staff

Staff members from IT, Human Resources, and Finance receive and handle requests related to their departments. 
They review requests, provide updates, and complete the necessary work.

### Approver

The approver is the person responsible for approving or rejecting requests that require authorization, such as work
expenses or software access.

### Company Management

Company management should be careful in ensuring that employee requests are handled clearly and efficiently.

### System Administrator

The system administrator manages user access and ensures that the correct employees and department staff can use the system.

## 4. Functional Requirements

### 4.1 User Access

- The system must allow registered users to sign in.
- Each user must have one role: Employee, Department Staff, or Approver.
- The system must show features according to the user's role.

### 4.2 Request Submission

- An employee must be able to create a request.
- A request must contain a title, description, and department.
- The available departments must be IT, Human Resources, and Finance.
- The employee must be able to indicate whether the request requires approval.
- The system must save the request with a creation date and an initial status.

### 4.3 Request Viewing

- An employee must be able to view their own requests.
- Department staff must be able to view requests sent to their department.
- Each request must display its title, description, department, requester,
  responsible staff member, approval result, status, and creation date.

### 4.4 Request Assignment

- Department staff must be able to assign a request to themselves.
- The system must display the staff member responsible for the request.
- A request cannot have more than one responsible staff member at a time.

### 4.5 Status Management

- A new request must initially have the status `Submitted`.
- The responsible staff member must be able to change the status to
  `In Progress` or `Resolved`.
- The system must display the current request status to the employee.

### 4.6 Approval

- An approver must be able to view requests that require approval.
- The approver must be able to approve or reject a request.
- The system must display the approval decision to the employee and
  department staff.

### 4.7 Comments

- The employee and responsible department staff member must be able to
  add comments to a request.
- Each comment must display its author and creation date.

### 4.8 Request History

- The system must record important changes made to a request.
- The request history must show status and approval changes.

## 5. Non-Functional Requirements

### 5.1 Security and Privacy

- Users must log in before using the system.
- Passwords must be stored securely.
- Employees can only see the requests they created.
- Department staff can only manage requests related to their department.
- Only approvers can approve or reject requests.

### 5.2 Usability

- The system should be simple and easy to understand.
- Forms should clearly show which fields are required.
- If the user enters something incorrectly, the system should display a clear error message.
- Request statuses and approval results should be easy to see and understand.
- The pages should have simple and consistent navigation.

### 5.3 Performance

- Pages should load within a reasonable amount of time.
- When a user submits a request or adds a comment, the result should appear without a long delay.

### 5.4 Reliability

- The system should not create a request if required information is missing.
- Saved requests, comments, and changes should not be lost.
- If an action fails, the system should show an error message instead of giving no response.

### 5.5 Compatibility

- The system should work on modern web browsers.
- It should display correctly on common laptop screen sizes.

### 5.6 Maintainability

- The code should be organized and easy to understand.
- Names used for files, functions, and variables should be clear and consistent.
- Repeated parts of the application should be reused when possible.

## 6. Assumptions, Constraints, and Unknowns

### 6.1 Assumptions

- Every user will have a registered account.
- Each user will have one role: Employee, Department Staff, or Approver.
- Each department will have at least one staff member.
- Every request will be sent to one department only.
- A department staff member can assign a request to themselves.
- Some requests will require approval, while others will not.
- The employee who creates a request can follow its status and add comments.
- The system will use three request statuses: `Submitted`, `In Progress`, and `Resolved`.

### 6.2 Constraints

- The project must be completed during the five-week academy.
- The first version will be a web application.
- The project will focus on the main request process and will not include every feature that a real company system might have.
- The project must remain simple enough to design, develop, and test within the available time.

### 6.3 Unknowns

- How will new users be registered in the system?
- Who will decide whether a request requires approval?
- Can an approver also be a department staff member?
- What should happen if a request is sent to the wrong department?
- Can a resolved request be reopened?
- Can an employee cancel a request after submitting it?
- Should requests have different priority levels?
- How long should request history be stored?
- Will the system need email notifications in a future version?


## 7. Non-Goals

The first version of the Internal Operations Service Hub will not include:

- Appointment or time-slot booking.
- Email, SMS, or phone notifications.
- File or document attachments.
- Live chat between users.
- Artificial intelligence features and design.
- Advanced reports or analytics dashboards.
- Priority levels for requests.
- The ability to reopen resolved requests.
- Integration with other company systems.
- A mobile application.
- Support for external customers.
- Automatic user registration using company accounts.

## 8. Acceptance Criteria

### 8.1 User Login

- Given that a user has a registered account,
- when they enter the correct email and password,
- then the system should log them in and show the correct page for their role.

### 8.2 Creating a Request

- Given that an employee is logged in,
- when they enter a title, description, and department and submit the form,
- then the system should create the request with the status `Submitted`.

### 8.3 Missing Information

- Given that an employee leaves a required field empty,
- when they try to submit the request,
- then the system should not create it and should show which field is missing.

### 8.4 Viewing Requests

- Given that an employee has submitted requests,
- when they open their request list,
- then they should only see the requests they created.

### 8.5 Assigning a Request

- Given that a department staff member is viewing an unassigned request from their department,
- when they assign the request to themselves,
- then their name should appear as the responsible staff member.

### 8.6 Updating the Status

- Given that a request is assigned to a department staff member,
- when the staff member changes its status to `In Progress` or `Resolved`,
- then the new status should be saved and visible to the employee.

### 8.7 Approving a Request

- Given that a request requires approval,
- when an approver approves or rejects it,
- then the decision should be saved and visible to the employee and department staff.

### 8.8 Adding a Comment

- Given that an employee or responsible staff member is viewing a request,
- when they add a comment,
- then the comment should appear with the author's name and the date.

### 8.9 Unauthorized Access

- Given that a user does not have permission to view a request,
- when they try to access it,
- then the system should deny access and should not show the request information.

### 8.10 Simultaneous Requests

- Given that two employees submit different requests at the same time,
- when both forms contain valid information,
- then both requests should be saved separately without losing or mixing their information.

