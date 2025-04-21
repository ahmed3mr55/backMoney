const express = require("express");
const cors = require("cors");
const connectDB = require("./routes/db");
require("dotenv").config();
const { verifyToken } = require("./routes/verifyToken");
const xss = require("xss-clean");
connectDB();

// Middleware
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(xss());

const PORT = process.env.PORT || 5000;

// Views
app.set("view engine", "ejs");

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/transfer", verifyToken, require("./routes/transfer"));
app.use("/api/profile", verifyToken, require("./routes/profile"));;
app.use("/api/admin/transactions", verifyToken, require("./routes/admin/transactionAdmin"));
app.use("/api/admin", verifyToken, require("./routes/admin/users"));
app.use("/password", require("./routes/password"));
app.use("/api/visa", verifyToken, require("./routes/visaG"));
app.use("/api/pay/visa", require("./routes/pay"));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
