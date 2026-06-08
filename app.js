require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

app.use(cors({
origin: process.env.CLIENT_URL || "*",
methods: ["GET", "POST", "PUT", "DELETE"],
allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use((req, res, next) => {
console.log(`${req.method} ${req.originalUrl}`);
next();
});

app.get("/healthz", (req, res) => {
res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);

app.use((err, req, res, next) => {
console.error("Unhandled error:", err);

```
if (res.headersSent) {
    return next(err);
}

res.status(500).json({
    message: "Server error"
});
```

});

module.exports = app;
