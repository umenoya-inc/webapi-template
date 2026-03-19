import { Hono } from "hono"
import { openAPIRouteHandler } from "hono-openapi"
import { healthRoute } from "./routes/healthRoute"
import { userRoute } from "./routes/userRoute"

const app = new Hono()

app.route("/health", healthRoute)
app.route("/users", userRoute)

app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: { title: "WebAPI Template", version: "1.0.0" },
    },
  }),
)

export default app
