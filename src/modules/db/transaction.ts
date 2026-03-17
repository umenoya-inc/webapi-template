import type { Result } from "@/types/Result";
import type { DbContext } from "./DbContext";
import { client } from "./client";
import { toDbContext } from "./toDbContext";

export const transaction = async <T, E>(
  fn: (ctx: DbContext) => Promise<Result<T, E>>,
): Promise<Result<T, E | "transaction_failed">> => {
  try {
    return await client.transaction(async (tx) => {
      const result = await fn(toDbContext(tx));
      if (!result.ok) {
        tx.rollback();
      }
      return result;
    });
  } catch {
    return { ok: false, error: "transaction_failed" };
  }
};
