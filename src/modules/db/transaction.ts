import type { Result } from "@/types/Result";
import type { DbContext } from "./DbContext";
import { client } from "./client";
import { toDbContext } from "./toDbContext";

const rollbackSymbol = Symbol("rollback");

export const transaction = async <T, E>(
  fn: (ctx: DbContext) => Promise<Result<T, E>>,
): Promise<Result<T, E | "transaction_failed">> => {
  let failedResult: Result<T, E> | undefined;
  try {
    return await client.transaction(async (tx) => {
      const result = await fn(toDbContext(tx));
      if (!result.ok) {
        failedResult = result;
        throw rollbackSymbol;
      }
      return result;
    });
  } catch (e) {
    if (e === rollbackSymbol && failedResult) {
      return failedResult;
    }
    return { ok: false, error: "transaction_failed" };
  }
};
