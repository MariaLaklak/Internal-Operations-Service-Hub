# Internal Operations Service Hub - Data Model

## 1. Domain

The data model describes the information that the Internal Operations Service Hub needs to remember. The main entities are User, Department, Request, Comment, Approval, and Request History.

### 1.1 Main Entities

#### User

A User represents anyone who can sign in to the system.

Important information:

* User ID
* Name
* Email
* Securely stored password
* Role
* Department, when needed

A user has one role: `Employee`, `Department Staff`, or `Approver`.

#### Department

A Department represents one of the departments that receives requests.

The first version contains:

* IT
* Human Resources
* Finance

Each department can receive many requests and can have many department staff members.

#### Request

A Request represents help or a service requested by an employee.

Important information:

* Request ID
* Title
* Description
* Current status
* Creation date
* Whether approval is required
* Requesting employee
* Target department
* Responsible staff member, if assigned

Each request belongs to one employee and one department. It can have no more than one responsible staff member at a time.

#### Comment

A Comment is a message added to a request by the employee or responsible staff member.

Important information:

* Comment ID
* Content
* Author
* Creation date
* Related request

A request can have many comments, but each comment belongs to one request and has one author.

#### Approval

An Approval stores the decision made for a request that requires authorization.

Important information:

* Approval ID
* Decision
* Approver
* Decision date
* Related request

The decision can be `Approved` or `Rejected`. A request that does not require approval will not have an approval record.

#### Request History

Request History records important changes made to a request.

Important information:

* History ID
* Type of change
* Previous value
* New value
* Date of change
* User who made the change
* Related request

The history must record status and approval changes. One request can have many history records.

### 1.2 Relationships and Ownership

* One employee can create many requests.
* Each request is created by one employee.
* One department can receive many requests.
* Each request is sent to one department.
* One department can have many staff members.
* A request can have zero or one responsible staff member.
* One request can contain many comments.
* Each comment belongs to one request and one author.
* A request requiring approval can have one approval decision.
* One approver can make decisions for many requests.
* One request can have many history records.
* Each history record belongs to one request.

The employee owns the requests they create from a visibility point of view. The target department is responsible for handling them.

## 2. Lifecycle and Rules

### 2.1 Request Lifecycle

A new request always begins with the status:

```text
Submitted
```

After a department staff member takes responsibility for it, its status can change to:

```text
In Progress
```

When the required work is complete, its status can change to:

```text
Resolved
```

The main lifecycle is:

```text
Submitted → In Progress → Resolved
```

The first version does not allow a resolved request to be reopened.

### 2.2 Approval Lifecycle

A request can either require approval or not require approval.

If approval is required, it waits for an approver’s decision. The approver can set the result to:

* `Approved`
* `Rejected`

The decision must be visible to the employee and department staff and must also be recorded in the request history.

### 2.3 Important Rules

* Every user must have one registered account and one role.
* Every request must have a title, description, target department, requester, creation date, and status.
* Every new request must begin with the status `Submitted`.
* Every request must belong to only one department.
* A request can have only one responsible staff member at a time.
* The responsible staff member must belong to the request’s target department.
* Employees can only view requests they created.
* Department staff can only manage requests sent to their department.
* Only the responsible staff member can update an assigned request.
* Only an approver can approve or reject a request.
* Only authorized users can view or comment on a request.
* Every comment must keep its author and creation date.
* Status and approval changes must create history records.
* Two simultaneous submissions must create two separate requests.

Questions that are still listed as unknowns in `product-spec.md`, such as reopening requests or moving them to another department, are not added to this model yet.

## 3. Storage

I chose a relational data model because the system contains information with clear relationships. For example, requests are connected to users and departments, while comments, approvals, and history are connected to requests.

A relational model will also help enforce important rules, such as having one requester, one target department, and no more than one responsible staff member for each request.

### 3.1 Durable Information

The following information must be stored permanently:

* Users and their roles
* Departments
* Requests and their current statuses
* Request ownership and department
* Responsible staff assignments
* Comments and their authors
* Approval decisions
* Request history

This information must remain available after a user signs out or the application restarts.

### 3.2 Derived Information

Some information can be calculated when needed instead of being stored separately.

Examples include:

* The number of requests created by an employee
* The number of requests belonging to a department
* Whether a request is assigned
* The number of unresolved requests
* The number of requests waiting for approval

Avoiding unnecessary duplicate information will reduce the risk of inconsistent data.

## 4. Access

The application must be able to find information based on the user’s role and the action being performed.

The main access patterns are:

* Find a user by email during login.
* Find all requests created by one employee.
* Find all requests sent to one department.
* Find requests assigned to one staff member.
* Find requests by their current status.
* Find requests that require approval.
* Open one request with its comments, approval, and history.
* Display comments and history in date order.

Indexes should only be added for information that is searched frequently. During implementation, useful indexes may include:

* User email, because it is used during login and must be unique.
* Requester and creation date, to display an employee’s requests.
* Department and status, to display a department’s request queue.
* Responsible staff member and status, to display assigned work.
* Request and creation date for comments and history.

These indexes support real product queries without adding unnecessary complexity.

## 5. Connection to the Requirements

This data model comes directly from `product-spec.md` and `architecture.md`.

* The login requirement creates the User entity and its role.
* The supported departments create the Department entity.
* Request submission creates the Request entity.
* Assignment requires a connection between a request and one staff member.
* Status management requires storing the current request status.
* Approval requirements create the Approval entity.
* Comment requirements create the Comment entity.
* History requirements create Request History records.
* Privacy requirements determine which users can access each request.
* Reliability requirements require separate and durable storage for simultaneous requests.

