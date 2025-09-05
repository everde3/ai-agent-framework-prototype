import { type Db, ObjectId } from "mongodb";

import {
  updateLlmLogById as dtoUpdateLlmLogById,
  getFirstWaitingLlmLogBatchByParentId,
  getLatestLlmLog,
  insertLlmLog,
  pushBatchToLlmLogByParentId,
  setBatchLeasesTimeOnLlmLogByParentId,
  setBatchStatusOnLlmLogByParentId,
} from "@repo/dto";
import type { ILlmLog, LlmLogStatus } from "@repo/models";
import { type AiQueryRequestUrlParams } from "@repo/service-contracts";
import type { PartiallyOptional } from "@repo/utils-isomorphic";

import { PromptNames } from "../prompt/prompt-registry";
import { ProviderModel } from "../providers/model-registry";

type LLMLogType = AiQueryRequestUrlParams["responseStyle"];
export type TriggeredBy =
  | { type: "user"; user_id: ObjectId }
  | { type: string; log_id: string };

/**
 * Service for creating, updating, and tracking LLM logs and batch processing state.
 * Supports recursive summarization, partner discovery, leasing, and parent/child log updates.
 */
export class LlmLoggingService {
  private companyId: ObjectId;
  private db: Db;
  private userId: ObjectId | null;
  private modelId: ProviderModel["model"];
  private onWriteHook:
    | ((log: PartiallyOptional<ILlmLog, "_id">) => Promise<void>)
    | null;

  private context: Record<string, unknown> = {};
  private promptVariables?: Record<string, unknown>;
  private promptName?: string;
  private promptWithVariables?: string;
  private text: string | Record<string, unknown> = "";
  private type: LLMLogType = "structured";

  private usage: Record<string, any> = {};
  private triggeredBy: TriggeredBy | null = null;

  private promptHash: string | null = null;
  private boundLogId: ObjectId | null = null; // When set, subsequent writes update this record

  constructor(props: {
    companyId: ObjectId;
    db: Db;
    promptHash?: string;
    modelId?: ProviderModel["model"];
    userId?: ObjectId;
    context?: Record<string, unknown>;
    onWriteHook?: (log: PartiallyOptional<ILlmLog, "_id">) => Promise<void>;
    type?: LLMLogType;
    triggeredBy?: TriggeredBy;
  }) {
    this.companyId = props.companyId;
    this.db = props.db;
    this.modelId = props.modelId ?? "claude-3-5-sonnet-v2";
    this.userId = props.userId ?? null;
    this.context = props.context ?? {};
    this.onWriteHook = props.onWriteHook ?? null;
    this.type = props.type ?? "structured";
    this.triggeredBy = props.triggeredBy ?? null;
    this.promptHash = props.promptHash ?? null;
  }

  /** Initialize local builder state for streaming logs (no DB write yet). */
  public initializeStreamingLog(data: {
    modelId: ProviderModel["model"];
    promptName: string;
    promptWithVariables: string;
    promptVariables: Record<string, unknown>;
    promptHash: string;
    context?: Record<string, unknown>;
    type?: LLMLogType;
    triggeredBy?: TriggeredBy;
  }) {
    this.modelId = data.modelId;
    this.promptName = data.promptName;
    this.promptWithVariables = data.promptWithVariables;
    this.promptVariables = data.promptVariables;
    this.text = "";
    this.context = data.context ?? {};
    this.type = data.type ?? "structured";
    this.triggeredBy = data.triggeredBy ?? null;
    this.promptHash = data.promptHash ?? this.promptHash;
  }

  /** Bind to an existing log ID for future updates. */
  public async bindTo(logId: ObjectId) {
    this.boundLogId = logId;
  }

  /** Create and bind a new top-level log. Returns its ID. */
  public async createAndBindLog(overrides?: {
    modelId?: ProviderModel["model"];
    promptName?: string;
    promptWithVariables?: string;
    promptVariables?: Record<string, unknown>;
    context?: Record<string, unknown>;
    type?: LLMLogType;
    triggeredBy?: TriggeredBy;
    llmResponse?: string;
    promptHash?: string;
  }): Promise<ObjectId> {
    this.modelId = overrides?.modelId ?? this.modelId;
    this.promptName = overrides?.promptName ?? this.promptName;
    this.promptWithVariables =
      overrides?.promptWithVariables ?? this.promptWithVariables;
    this.promptVariables = overrides?.promptVariables ?? this.promptVariables;
    this.context = { ...this.context, ...(overrides?.context ?? {}) };
    this.type = overrides?.type ?? this.type;
    this.triggeredBy = overrides?.triggeredBy ?? this.triggeredBy;
    this.text = overrides?.llmResponse ?? this.text;
    this.promptHash = overrides?.promptHash ?? this.promptHash;

    const doc: PartiallyOptional<ILlmLog, "_id"> = {
      type: this.type,
      created_at: new Date(),
      company_id: this.companyId,
      user_id: this.userId ?? null,
      triggered_by: this.triggeredBy ?? null,
      prompt_name: this.promptName ?? "",
      prompt: this.promptWithVariables ?? "",
      prompt_hash: this.promptHash ?? null,
      prompt_variables: (this.promptVariables ?? {}) as Record<string, unknown>,
      llm_model: this.modelId,
      llm_response: this.text ?? "",
      usage: {},
      context: this.context ?? {},
      batches: [],
    };

    const id = await insertLlmLog({ db: this.db, llmLog: doc });
    this.boundLogId = id;
    if (this.onWriteHook) await this.onWriteHook({ ...(doc as any), _id: id });
    return id;
  }

  /** Create a new work-unit log for the next processing level. */
  public async createNextLevelLog(args: {
    promptName: string;
    promptWithVariables: string;
    promptVariables: Record<string, unknown> | Record<string, unknown>[];
    modelId?: ProviderModel["model"];
    context?: Record<string, unknown>;
    type?: LLMLogType;
    triggeredBy?: TriggeredBy;
    promptHash?: string;
  }): Promise<ObjectId> {
    const {
      promptName,
      promptWithVariables,
      promptVariables,
      modelId = this.modelId,
      context = {},
      type = "structured",
      triggeredBy = null,
      promptHash = this.promptHash,
    } = args;

    const row: PartiallyOptional<ILlmLog, "_id"> = {
      type,
      created_at: new Date(),
      company_id: this.companyId,
      user_id: this.userId ?? null,
      triggered_by: triggeredBy,
      prompt_name: promptName,
      prompt: promptWithVariables,
      prompt_hash: promptHash,
      prompt_variables: promptVariables,
      llm_model: modelId,
      llm_response: "",
      usage: {},
      context,
      batches: [],
    };
    return await insertLlmLog({ db: this.db, llmLog: row });
  }

  /** Generic log creation (unbound). Useful for children you don’t want bound. */
  public async createLlmLog(args: {
    modelId?: ProviderModel["model"];
    promptName: string;
    promptVariables: Record<string, unknown> | Record<string, unknown>[];
    promptWithVariables?: string;
    context?: Record<string, unknown>;
    type?: LLMLogType;
    triggeredBy?: TriggeredBy | null;
    llmResponse?: string;
    promptHash?: string;
  }): Promise<ObjectId> {
    const {
      modelId = this.modelId,
      promptName,
      promptVariables,
      promptWithVariables = "",
      context = {},
      type = "structured",
      triggeredBy = null,
      llmResponse = "",
      promptHash = this.promptHash,
    } = args;

    const row: PartiallyOptional<ILlmLog, "_id"> = {
      type,
      created_at: new Date(),
      company_id: this.companyId,
      user_id: this.userId ?? null,
      triggered_by: triggeredBy,
      prompt_name: promptName,
      prompt: promptWithVariables,
      prompt_variables: promptVariables,
      prompt_hash: promptHash,
      llm_model: modelId,
      llm_response: llmResponse,
      usage: {},
      context,
      batches: [],
    };
    return await insertLlmLog({ db: this.db, llmLog: row });
  }

  /** Create a child output log and push it to parent.batches as waiting. */
  public async createOutputChunkLog(params: {
    parentId: ObjectId;
    promptName: string;
    prompt: string;
    promptVariables: Record<string, unknown>;
    responseText: string;
    modelId?: ProviderModel["model"];
    context?: Record<string, unknown>;
    level?: number;
    promptHash?: string;
  }): Promise<ObjectId> {
    const {
      parentId,
      promptName,
      prompt,
      promptVariables,
      responseText,
      modelId = this.modelId,
      context = {},
      level = 0,
      promptHash = this.promptHash,
    } = params;

    const child: PartiallyOptional<ILlmLog, "_id"> = {
      type: "structured",
      created_at: new Date(),
      company_id: this.companyId,
      user_id: this.userId ?? null,
      triggered_by: null,
      prompt_name: promptName,
      prompt,
      prompt_hash: promptHash,
      prompt_variables: promptVariables,
      llm_model: modelId,
      llm_response: responseText,
      usage: {},
      context: { ...context, recursiveSummary: true },
      batches: [],
    };

    const childId = await insertLlmLog({ db: this.db, llmLog: child });
    await pushBatchToLlmLogByParentId({
      db: this.db,
      parentId,
      logId: childId,
      level,
      status: "waiting",
    });
    return childId;
  }

  /** Write final response/usage/context to bound log. Inserts if unbound. */
  public async processResult(data: {
    context?: Record<string, unknown>;
    response: string | Record<string, unknown>;
    usage: Record<string, unknown>;
    modelId?: ProviderModel["model"];
    promptName?: string;
    promptWithVariables?: string;
    promptVariables?: Record<string, unknown>;
  }) {
    this.modelId = data.modelId ?? this.modelId;
    this.promptName = data.promptName ?? this.promptName;
    this.promptWithVariables =
      data.promptWithVariables ?? this.promptWithVariables;
    this.promptVariables = data.promptVariables ?? this.promptVariables;
    this.context = { ...this.context, ...data.context };

    this.text = data.response ?? this.text;
    this.usage = data.usage ?? this.usage;

    if (this.boundLogId) {
      await dtoUpdateLlmLogById({
        db: this.db,
        id: this.boundLogId,
        update: {
          llm_response: this.text,
          usage: { ...this.usage },
          context: this.context,
          prompt: this.promptWithVariables,
          prompt_variables: this.promptVariables,
        } as Partial<ILlmLog>,
      });
      return;
    }

    await this.logToDb(this.type);
  }

  /** Append chunk text and usage to bound log (creates if unbound). */
  public async processChunk(chunk: {
    textChunk: string;
    usage?: Record<string, unknown>;
    type?: LLMLogType;
  }) {
    this.text += chunk.textChunk;

    if (chunk.usage) {
      this.usage = chunk.usage;
      this.type = chunk.type ?? "structured";

      if (this.boundLogId) {
        await dtoUpdateLlmLogById({
          db: this.db,
          id: this.boundLogId,
          update: { llm_response: this.text, usage: this.usage as any },
        });
        return;
      }
      await this.logToDb(this.type);
    }
  }

  /** Inserts and binds log if nothing exists yet (legacy path). */
  private async logToDb(type: LLMLogType) {
    const log: PartiallyOptional<ILlmLog, "_id"> = {
      type,
      created_at: new Date(),
      company_id: this.companyId,
      user_id: this.userId ?? null,
      triggered_by: this.triggeredBy ?? null,
      prompt_name: this.promptName ?? "",
      prompt: this.promptWithVariables ?? "",
      prompt_hash: this.promptHash ?? null,
      prompt_variables: (this.promptVariables ?? {}) as Record<string, unknown>,
      llm_model: this.modelId,
      llm_response: this.text,
      usage: { ...this.usage },
      context: this.context,
      batches: [],
    };

    const id = await insertLlmLog({ db: this.db, llmLog: log });
    this.boundLogId = id;
    if (this.onWriteHook) await this.onWriteHook({ ...(log as any), _id: id });
  }

  /** Update prompt variables or context for any log by ID. */
  public async updateLlmLogById(args: {
    id: ObjectId;
    promptVariables?: Record<string, unknown>;
    context?: Record<string, unknown>;
  }) {
    const update: Partial<ILlmLog> = {
      prompt_variables: args.promptVariables,
      context: args.context,
    };

    await dtoUpdateLlmLogById({ db: this.db, id: args.id, update });
  }

  /** Find first waiting partner batch for a parent log. */
  public async firstWaitingPartner(parentId: ObjectId) {
    return await getFirstWaitingLlmLogBatchByParentId({
      db: this.db,
      parentId,
    });
  }

  /** Claim a partner by setting lease time to now + leaseMs. */
  public async claimPartnerLease(
    parentId: ObjectId,
    partnerId: ObjectId,
    leaseMs = 15_000
  ) {
    const leaseUntil = new Date(Date.now() + leaseMs);
    await setBatchLeasesTimeOnLlmLogByParentId(
      this.db,
      parentId,
      partnerId,
      leaseUntil
    );
  }

  /** Set a batch's status (e.g., to in_progress or complete). */
  public async setBatchStatus(
    parentId: ObjectId,
    logId: ObjectId,
    level: number,
    status: LlmLogStatus
  ) {
    await setBatchStatusOnLlmLogByParentId({
      db: this.db,
      parentId,
      logId,
      level,
      status,
    });
  }

  /** Push a new batch entry to a parent LLM log's `batches` array. */
  public async pushBatch(
    parentId: ObjectId,
    logId: ObjectId,
    level: number,
    status: LlmLogStatus
  ) {
    await pushBatchToLlmLogByParentId({
      db: this.db,
      parentId,
      logId,
      level,
      status,
    });
  }

  /** Write final output for a top-level parent log. */
  public async finalizeParentResponse(
    parentId: ObjectId,
    response: string,
    usage: Record<string, unknown> = {},
    context: Record<string, unknown> = {}
  ) {
    await dtoUpdateLlmLogById({
      db: this.db,
      id: parentId,
      update: { llm_response: response, usage, context } as Partial<ILlmLog>,
    });
  }

  /** Get latest log where the prompt hash matches. */
  public async getLastLogByPromptHash({
    promptHash,
    promptName,
  }: {
    promptHash: string;
    promptName: PromptNames;
  }) {
    if (!promptHash) return null;

    const latestLog = await getLatestLlmLog({
      db: this.db,
      companyId: this.companyId,
      conditions: { prompt_hash: promptHash, prompt_name: promptName },
    });

    return latestLog || null;
  }

  /** Get latest log where a prompt variable matches a value. */
  public async getLastLogByPromptVariable(
    promptKey: string,
    promptValue: unknown
  ) {
    if (!promptKey || promptValue === undefined || promptValue === null)
      return null;

    const latestLog = await getLatestLlmLog({
      db: this.db,
      companyId: this.companyId,
      conditions: { [`prompt_variables.${promptKey}`]: promptValue },
    });

    return latestLog || null;
  }
}
