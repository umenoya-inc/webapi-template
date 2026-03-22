import { Hono } from "hono"
import { openAPIRouteHandler } from "hono-openapi"
import { authRoutes } from "./api/auth"
import { healthRoute } from "./api/healthRoute"
import { todoRoutes } from "./api/todo"
import { userRoutes } from "./api/user"

const app = new Hono()

app.route("/health", healthRoute)
app.route("/auth", authRoutes)
app.route("/todos", todoRoutes)
app.route("/users", userRoutes)

app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: { title: "WebAPI Template", version: "1.0.0" },
    },
  }),
)

export default app
