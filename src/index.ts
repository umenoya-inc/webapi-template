import { Hono } from "hono";
import { healthRoute } from "./routes/health";

const app = new Hono();

app.route("/health", healthRoute);

export default app;
