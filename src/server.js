import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import householdRoutes from "./routes/householdRoutes.js";
import choreRoutes from "./routes/choreRoutes.js";
import recurringChoreRoutes from "./routes/recurringChoreRoutes.js";
import {
    startSchedulerLoop,
    runSchedulerTick
} from "./services/recurringScheduler.service.cjs";

dotenv.config();

const app = express();
const Port = process.env.Port || 5000;

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

    const server = app.listen(Port, () => {
        console.log(`server running on port ${Port}`);
    });

    const shutdown = async () => {
        scheduler.stop();
        server.close();
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
};

startServer().catch((error) => {
    console.error("Server startup failed:", error);
    process.exitCode = 1;
});

export default app;
