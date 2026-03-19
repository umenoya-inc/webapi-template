import { Hono } from "hono"
import { openAPIRouteHandler } from "hono-openapi"
import { healthRoute } from "./api/healthRoute"
import { getUserByIdRoute } from "./api/user/getUserByIdRoute"
import { listUsersRoute } from "./api/user/listUsersRoute"
import { postUserRoute } from "./api/user/postUserRoute"

const app = new Hono()

app.route("/health", healthRoute)
app.route("/users", postUserRoute)
app.route("/users", listUsersRoute)
app.route("/users", getUserByIdRoute)

app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: { title: "WebAPI Template", version: "1.0.0" },
    },
  }),
)

export default app
