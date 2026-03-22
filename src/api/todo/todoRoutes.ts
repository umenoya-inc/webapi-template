import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { createTodo, findTodoById, listTodos as dbListTodos } from "@/db/todo"
import { defineRoute } from "../defineRoute"
import { getTodoById } from "./getTodoById"
import { listTodos } from "./listTodos"
import { postTodo } from "./postTodo"

/** TODO API のルートをまとめた Hono インスタンス。 */
export const todoRoutes = new Hono()

todoRoutes.post(
  "/",
  ...defineRoute({
    effect: postTodo,
    provide: () => ({
      service: { createTodo },
      context: { db: globalDbContext },
    }),
    description: "TODO を新規作成する",
  }),
)

todoRoutes.get(
  "/",
  ...defineRoute({
    effect: listTodos,
    provide: () => ({
      service: { listTodos: dbListTodos },
      context: { db: globalDbContext },
    }),
    description: "TODO 一覧を取得する",
  }),
)

todoRoutes.get(
  "/:id",
  ...defineRoute({
    effect: getTodoById,
    provide: () => ({
      service: { findTodoById },
      context: { db: globalDbContext },
    }),
    description: "ID を指定して TODO を取得する",
  }),
)
