# Webhook-Driven Task Processing Pipeline

A backend service that receives webhooks, queues them for asynchronous processing, applies a configured transformation, and delivers the processed result to one or more subscriber endpoints.

This project was built as a simplified event-processing pipeline inspired by webhook automation platforms. It focuses on reliability, separation of concerns, and traceability.

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
- PostgreSQL for persistence
- Redis + BullMQ for queue processing
- Dockerized infrastructure

---

## Tech Stack

- **TypeScript**
- **Node.js**
- **Express**
- **PostgreSQL**
- **Prisma**
- **Redis**
- **BullMQ**
- **Docker**
- **GitHub Actions** (to be used for CI)

---

## Architecture Overview

The system is split into four main parts:

### 1. API Server
Responsible for:
- managing pipelines
- accepting incoming webhooks
- exposing job history and status endpoints

### 2. PostgreSQL Database
Stores:
- pipelines
- subscribers
- webhook events
- jobs
- delivery attempts

### 3. Redis Queue
Used as the broker for background job processing.

### 4. Worker
Consumes queued jobs, applies the selected processing action, delivers the result to subscribers, and records the outcome.

---

## Data Flow

1. A user creates a pipeline.
2. The system generates a unique `sourceKey` for that pipeline.
3. External systems send webhooks to `/webhooks/:sourceKey`.
4. The API stores the webhook as an event and creates a job record.
5. The job is pushed to BullMQ.
6. The worker picks up the job asynchronously.
7. The worker processes the payload using the configured action.
8. The processed result is sent to all active subscribers.
9. Delivery attempts are recorded in the database.
10. The final job status is updated based on processing and delivery outcomes.

---

## Processing Actions

### 1. `extract_fields`
Extracts only the configured fields from the incoming payload.

Example config:

```json
{
  "fields": ["orderId", "email", "amount"]
}
2. uppercase_text

Reads the text field and converts it to uppercase.

Example input:

{
  "text": "hello world"
}

Example output:

{
  "text": "HELLO WORLD"
}
3. add_metadata

Wraps the original payload and appends processing metadata such as:

pipeline ID
event ID
processed timestamp
Database Schema

Main entities:

Pipeline: defines the source, action type, and config
Subscriber: target URL that receives processed data
WebhookEvent: raw incoming webhook payload
Job: background processing unit for each webhook event
DeliveryAttempt: logs each attempt to deliver results to subscribers
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
Docker

The project includes Docker configuration for:

PostgreSQL
Redis

A full Compose setup for the app and worker can be added for production-style execution, but the current local workflow uses Docker for infrastructure and local Node processes for development.

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

This demonstrates the asynchronous architecture clearly.

Author

Built as an internship final project to demonstrate backend engineering skills in:

API design
background processing
reliability
queue-based systems
TypeScript backend development