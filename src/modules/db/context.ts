import type { DbContext } from "./DbContext";
import { client } from "./client";
import { toDbContext } from "./toDbContext";

export const context: DbContext = toDbContext(client);
