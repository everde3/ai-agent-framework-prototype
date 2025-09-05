# Queue Pools

SME: Doug Akridge

## Introduction

Queue pools are a way to manage a pool of workers that can process a queue of tasks. The pools are responsible for managing the workers and the queue, it will process a task and then move on to the next task.

There are two pools that are currently implemented:

- `cursorPool` - This pool is used to process a cursor of documents.
- `taskPool` - This pool is used to process a queue of tasks.

Both pools use [fastq](https://github.com/mcollina/fastq) under the hood, a great library by Matteo Collina. I should also mention [@supercharge/promise-pool](https://github.com/supercharge/promise-pool) as the original inspiration for this utility function. The reason it wasn't used is because it doesn't support dynamic arrays so a queue was better suited for our use cases.

Both pools are very similar, the primary difference is the input. The `cursorPool` takes a cursor and the `taskPool` takes an array of tasks.

## Usage

### cursorPool

```typescript
import { cursorPool } from "@repo/utils-isomorphic";

const cursor = await db.collection("users").find({}).cursor();

await cursorPool({
  cursor,
  concurrency: 10,
  handler: async (doc) => {
    // do something with doc
  },
});
```

### taskPool

```typescript
import { taskPool } from "@repo/utils-isomorphic";

const tasks = [
  {
    id: 1,
    name: "task 1",
  },
  {
    id: 2,
    name: "task 2",
  },
  {
    id: 3,
    name: "task 3",
  },
];

const pool = await taskPool({
  initialTasks: [],
  concurrency: 10,
  process: async (task) => {
    // do something with task
  },
});

tasks.forEach((task) => pool.addToQueue(task));

await pool.whenDone();
```
