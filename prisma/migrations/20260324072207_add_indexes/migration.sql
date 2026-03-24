-- CreateIndex
CREATE INDEX "DeliveryAttempt_jobId_idx" ON "DeliveryAttempt"("jobId");

-- CreateIndex
CREATE INDEX "DeliveryAttempt_subscriberId_idx" ON "DeliveryAttempt"("subscriberId");

-- CreateIndex
CREATE INDEX "DeliveryAttempt_status_idx" ON "DeliveryAttempt"("status");

-- CreateIndex
CREATE INDEX "DeliveryAttempt_attemptedAt_idx" ON "DeliveryAttempt"("attemptedAt");

-- CreateIndex
CREATE INDEX "Job_eventId_idx" ON "Job"("eventId");

-- CreateIndex
CREATE INDEX "Job_pipelineId_idx" ON "Job"("pipelineId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "Pipeline_isActive_idx" ON "Pipeline"("isActive");

-- CreateIndex
CREATE INDEX "Pipeline_createdAt_idx" ON "Pipeline"("createdAt");

-- CreateIndex
CREATE INDEX "Subscriber_pipelineId_idx" ON "Subscriber"("pipelineId");

-- CreateIndex
CREATE INDEX "Subscriber_isActive_idx" ON "Subscriber"("isActive");

-- CreateIndex
CREATE INDEX "WebhookEvent_pipelineId_idx" ON "WebhookEvent"("pipelineId");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");

-- CreateIndex
CREATE INDEX "WebhookEvent_receivedAt_idx" ON "WebhookEvent"("receivedAt");
