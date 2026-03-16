import { Hono } from "hono";
import { healthRoute } from "./routes/healthRoute";

const app = new Hono();

app.route("/health", healthRoute);

export default app;
