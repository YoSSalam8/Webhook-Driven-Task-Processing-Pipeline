# Webhook-Driven Task Processing Pipeline

A backend service that receives webhooks, queues them for asynchronous processing, applies a configured transformation, and delivers the processed result to one or more subscriber endpoints.

This project was built as a simplified event-processing pipeline inspired by webhook automation platforms. It focuses on reliability, separation of concerns, traceability, and background job processing.

---

## Features

- CRUD API for managing pipelines
- Unique source URL for each pipeline
- Asynchronous webhook ingestion using a job queue
- Background worker for processing jobs
- Three processing action types:
  - `extract_fields`
  - `uppercase_text`
  - `add_metadata`
- Delivery of processed results to subscriber URLs
- Retry logic for failed deliveries
- Job status and delivery attempt tracking
- Unit tests for major error paths
- Coverage reporting
- PostgreSQL for persistence
- Redis + BullMQ for queue processing
- Dockerized infrastructure
- GitHub Actions CI pipeline

---

## Tech Stack

- **TypeScript**
- **Node.js**
- **Express**
- **PostgreSQL**
- **Prisma**
- **Redis**
- **BullMQ**
- **Axios**
- **Vitest**
- **Docker**
- **GitHub Actions**

---

## Architecture Overview

The project uses a **layered backend architecture** combined with an **event-driven asynchronous processing model**.

### API Layer
Responsible for:
- managing pipelines
- accepting incoming webhooks
- exposing job history and status endpoints

### Database Layer
PostgreSQL stores:
- pipelines
- subscribers
- webhook events
- jobs
- delivery attempts

### Queue Layer
Redis + BullMQ are used to enqueue background jobs after webhook ingestion.

### Worker Layer
A separate worker process consumes queued jobs, processes payloads, delivers results to subscribers, and records outcomes.

---

## Project Structure


.
├── src
│   ├── config
│   ├── controllers
│   ├── lib
│   ├── processors
│   ├── queue
│   ├── routes
│   ├── services
│   ├── workers
│   ├── app.ts
│   └── server.ts
├── prisma
│   ├── migrations
│   └── schema.prisma
├── tests
├── .github
│   └── workflows
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
Data Flow
A user creates a pipeline.
The system generates a unique sourceKey for that pipeline.
External systems send webhooks to /webhooks/:sourceKey.
The API stores the webhook as an event and creates a job record.
The job is pushed to BullMQ.
The worker picks up the job asynchronously.
The worker processes the payload using the configured action.
The processed result is sent to all active subscribers.
Delivery attempts are recorded in the database.
The final job status is updated based on processing and delivery outcomes.
Processing Actions
1) extract_fields

Extracts only the configured fields from the incoming payload.

Example config:

{
  "fields": ["orderId", "email", "amount"]
}

Example input:

{
  "orderId": "ORD-1001",
  "email": "test@example.com",
  "amount": 250,
  "note": "extra field"
}

Example output:

{
  "orderId": "ORD-1001",
  "email": "test@example.com",
  "amount": 250
}
2) uppercase_text

Reads the text field and converts it to uppercase.

Example input:

{
  "text": "hello world"
}

Example output:

{
  "text": "HELLO WORLD"
}
3) add_metadata

Wraps the original payload and appends processing metadata.

Example output:

{
  "original": {
    "message": "hello"
  },
  "metadata": {
    "pipelineId": "pipeline-id",
    "eventId": "event-id",
    "processedAt": "2026-03-23T23:00:00.000Z"
  }
}
Database Schema

Main entities:

Pipeline: defines the source, action type, and config
Subscriber: target URL that receives processed data
WebhookEvent: raw incoming webhook payload
Job: background processing unit for each webhook event
DeliveryAttempt: logs each attempt to deliver results to subscribers
Indexing

To improve performance and scalability, indexes were added on common query paths such as:

pipelineId
eventId
status
jobId
subscriberId
timestamp fields used in history lookups

This helps the system remain efficient as the number of pipelines, jobs, and delivery attempts grows.

API Endpoints
Pipelines
Create pipeline

POST /api/pipelines

List pipelines

GET /api/pipelines

Get pipeline by ID

GET /api/pipelines/:id

Update pipeline

PATCH /api/pipelines/:id

Delete pipeline

DELETE /api/pipelines/:id

Webhooks
Receive webhook

POST /webhooks/:sourceKey

This endpoint accepts an incoming webhook, stores it, creates a job, and queues it for background processing.

Jobs
List jobs

GET /api/jobs

Get job by ID

GET /api/jobs/:id

Returns:

job status
processed result
linked event
linked pipeline
delivery attempts
Example Usage
Create a pipeline
{
  "name": "Order Pipeline",
  "actionType": "extract_fields",
  "actionConfig": {
    "fields": ["orderId", "email", "amount"]
  },
  "subscribers": [
    {
      "targetUrl": "https://example.com/webhook"
    }
  ]
}
Send a webhook
{
  "orderId": "ORD-1001",
  "email": "test@example.com",
  "amount": 250,
  "note": "extra field"
}
Processed result
{
  "orderId": "ORD-1001",
  "email": "test@example.com",
  "amount": 250
}
Job Statuses

The system uses the following job statuses:

queued
processing
completed
partially_failed
failed
Meaning
completed: processing finished and all deliveries succeeded
partially_failed: processing finished but some deliveries failed
failed: processing failed or all deliveries failed
Retry Logic

Delivery retries are handled per subscriber.

Current behavior
Up to 3 attempts per subscriber
Retries happen for:
network errors
HTTP 5xx
HTTP 429
HTTP 4xx responses are treated as non-retryable failures, except 429

Each attempt is recorded in the DeliveryAttempt table.

Running the Project Locally
Prerequisites
Node.js
Docker Desktop
npm
1. Install dependencies
npm install
2. Start infrastructure services
docker compose up -d postgres redis
3. Run database migrations
npx prisma migrate dev
4. Start the API server
npm run dev
5. Start the worker

In a separate terminal:

npm run worker
Environment Variables

Example .env:

DATABASE_URL="postgresql://app:app@localhost:5432/webhook_pipeline?schema=public"
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
Testing

Run all tests:

npm test

Run coverage:

npm run test:coverage

The test suite covers:

controller error handling
webhook error paths
job retrieval error handling
processing service behavior
delivery failures and retry behavior
CI

GitHub Actions is configured to run the CI pipeline on push and pull requests.

The workflow currently:

installs dependencies
generates the Prisma client
runs type checks
builds the project

This ensures that the codebase remains type-safe and buildable.

Docker

The project includes Docker configuration for:

PostgreSQL
Redis

The current development workflow uses Docker for infrastructure and local Node processes for the API server and worker.

A full Compose setup for running the entire application stack inside containers can be added as a production-style extension.

Design Decisions
Why asynchronous processing?

Webhook ingestion should be fast and resilient. Processing inside the request lifecycle would tightly couple response time to business logic and subscriber availability.

Why BullMQ?

BullMQ provides a clean way to handle background jobs, retries, and worker separation using Redis.

Why PostgreSQL?

The project needs strong relational tracking between pipelines, jobs, events, subscribers, and delivery attempts.

Why separate API and worker?

This keeps responsibilities clear:

API accepts and records work
worker performs background processing
Why log delivery attempts in the database?

This improves traceability, observability, and debugging. It also makes job history much more useful.

Why add indexes?

Indexes improve performance on the most common read paths, especially for job history, delivery tracking, and pipeline-related lookups.

Trade-offs and Future Improvements

Possible improvements for a production version:

authentication and authorization
webhook signature verification
rate limiting
dead-letter queues
better structured logging
metrics and monitoring
dashboard UI
idempotency keys
subscriber management endpoints beyond pipeline creation
full app containerization for one-command startup
Demo Notes

A good demo flow is:

Create a pipeline
Send a webhook
Show the immediate Webhook accepted response
Open the job details
Show:
processed result
final job status
delivery attempts

A strong example is a partially_failed job where:

processing succeeds
one subscriber succeeds
one subscriber fails

This demonstrates both the happy path and failure handling.

Author

Built as an internship final project to demonstrate backend engineering skills in:

API design
background processing
reliability
queue-based systems
testing and validation
TypeScript backend development
