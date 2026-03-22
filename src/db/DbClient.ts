import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type { Fallible } from "@/types"
import type { PgResult } from "./PgResult"

/**
 * DB アクセスの唯一の入り口。
 * 生の NodePgDatabase はコールバック内にスコープされ、外部に漏れない。
 */
export interface DbClient {
  /** 書き込み操作を実行し、PG エラーを Result に変換する。insert / update / delete に使う。 */
  execute<T>(fn: (db: NodePgDatabase) => Promise<T>): Promise<PgResult<T>>

  /** 読み取り操作を実行する。PG エラーはそのまま throw する。select に使う。 */
  query<T>(fn: (db: NodePgDatabase) => Promise<T>): Promise<T>

  /**
   * トランザクション内で DB 操作を実行する。
   * コールバックが `ok: false` を返した場合は自動でロールバックされる。
   * トランザクション自体の失敗（接続断等）は例外として伝播する。
   */
  transaction<F extends Fallible>(fn: (client: DbClient) => Promise<F>): Promise<F>
}
