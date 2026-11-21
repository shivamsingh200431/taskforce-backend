import dotenv from "dotenv";
import express from "express";
import { pathToFileURL } from "node:url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import householdRoutes from "./routes/householdRoutes.js";
import choreRoutes from "./routes/choreRoutes.js";
import recurringChoreRoutes from "./routes/recurringChoreRoutes.js";
import recurringSchedulerService from "./services/recurringScheduler.service.cjs";

const { startSchedulerLoop, runSchedulerTick } = recurringSchedulerService;

dotenv.config();

const app = express();
const port = Number.parseInt(process.env.PORT || "5000", 10);

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Taskforce Api Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/households", householdRoutes);
app.use("/api/chores", choreRoutes);
app.use("/api/recurring-chores", recurringChoreRoutes);

const startServer = async () => {
    await connectDB();
    await runSchedulerTick(new Date());

    const scheduler = startSchedulerLoop();

    const server = app.listen(port, () => {
        console.log(`server running on port ${port}`);
    });

    const shutdown = async () => {
        scheduler.stop();
        server.close();
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);

    return server;
};

if (
    process.argv[1] &&
    pathToFileURL(process.argv[1]).href === import.meta.url
) {
    startServer().catch((error) => {
        console.error("Server startup failed:", error);
        process.exitCode = 1;
    });
}

export { app, startServer };
export default app;
