import { SendMessageCommand } from "@aws-sdk/client-sqs";
import crypto from "crypto";

import { sqsClient } from "@repo/aws-sdk";

export type QueueMessage = {
  parentLogId: string;
  sourceLogId: string;
  level: number;
  companyId: string;
  userId: string;
  promptName: string;
  promptVariables: Record<string, any>;
  context: Record<string, any>;
  parentStartLLMTime: number;
  startLLMTime: number;
  type: string;
};

export const enqueueNextLevelSummarization = async (props: QueueMessage) => {
  // Ensure we have an SQS queue URL from the environment variables
  const sqsQueueUrl = process.env.AI_SUMMARIZATION_SQS_QUEUE_URL;
  if (!sqsQueueUrl) {
    throw new Error("SQS queue URL is not set");
  }

  const message = JSON.stringify({
    ...props,
  });
  // concurrent invocations of the ETLs. Random Number from 1 to 3
  const MessageGroupID = (Math.floor(Math.random() * 3) + 1).toString();
  const MessageDeduplicationId = crypto
    .createHash("md5")
    .update(message)
    .digest("hex");
  try {
    const params = {
      MessageBody: message,
      QueueUrl: sqsQueueUrl,
      MessageGroupId: MessageGroupID.toString(),
      MessageDeduplicationId: `${MessageDeduplicationId}`,
    };
    const command = new SendMessageCommand(params);

    await sqsClient.send(command);
  } catch (err) {
    const error = err as { name: string };
    if (error.name === "RequestThrottled" || error.name === "UnknownEndpoint") {
      // These error codes represent throttling behavior on the queue.
      // We should retry the message after a short delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await enqueueNextLevelSummarization(props);
    } else {
      console.error(err);
    }
  }
};
