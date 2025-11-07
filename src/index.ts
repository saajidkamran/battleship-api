//  # Entry point (start server)// src/index.ts
import app from "./app";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Battleship API running on port ${PORT}`));
