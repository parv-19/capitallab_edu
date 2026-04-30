import "dotenv/config";
import mongoose from "mongoose";

async function checkIndex() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected.");

    const db = mongoose.connection.db;
    const collections = await db?.listCollections().toArray();
    console.log("Collections:", collections?.map(c => c.name));

    const collection = db?.collection("documentchunks");
    const indexes = await collection?.listSearchIndexes().toArray();
    console.log("Search Indexes:", JSON.stringify(indexes, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error("Check Index Error:", error);
  }
}

void checkIndex();
