// Dependencies
import { ObjectId } from "mongodb";
import { bench, describe, expect, it } from "vitest";

import { removeDuplicateObjectIDs } from ".";

const input = [
	"517fdbfb4c4a0873491ae19c",
	"517fdbfb4c4a0873491ae19d",
	"517fdbfb4c4a0873491ae19e",
	"517fdbfb4c4a0873491ae19f",
	new ObjectId("517fdbfb4c4a0873491ae19d"),
	new ObjectId("517fdbfb4c4a0873491ae19e"),
	new ObjectId("517fdbfb4c4a0873491ae19e"),
	new ObjectId("517fdbfb4c4a0873491ae19e"),
	new ObjectId("517fdbfb4c4a0873491ae19e"),
	new ObjectId("517fdbfb4c4a0873491ae19f"),
	new ObjectId("517fdbfb4c4a0873491ae29a"),
	new ObjectId("517fdbfb4c4a0873491ae29b"),
	new ObjectId("517fdbfb4c4a0873491ae29c"),
	new ObjectId("517fdbfb4c4a0873491ae29d"),
	new ObjectId("517fdbfb4c4a0873491ae29e"),
	new ObjectId("517fdbfb4c4a0873491ae29f"),
	"foo",
	"bar",
	"baz",
];

bench(
	"Filter, map, reduce",
	() => {
		input
			.filter((item) => ObjectId.isValid(item))
			.map((item) => item.toString())
			.reduce(
				(acc, item) => {
					if (!acc[item]) {
						acc[item] = new ObjectId(item);
					}

					return acc;
				},
				{} as { [key: string]: ObjectId }
			);
	},
	{ time: 1000 }
);

bench(
	"Use Object to remove duplicate ObjectIDs",
	() => {
		removeDuplicateObjectIDs(input);
	},
	{ time: 1000 }
);

bench(
	"Filter, map, Set",
	() => {
		const strings = input.filter((item) => ObjectId.isValid(item)).map((item) => item.toString());
		const uniqueStrings = [...new Set(strings)];
		uniqueStrings.map((item) => new ObjectId(item));
	},
	{ time: 1000 }
);
