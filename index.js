import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    status: "online",
    bot: "ADEZ-MD"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ADEZ-MD server running on ${PORT}`);
});
