require("dotenv").config({ path: "backend/.env" });
const mongoose = require("mongoose");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const db = mongoose.connection.db;
  const docs = await db.collection("coursedocuments")
    .find({}, { projection: { name: 1, courseId: 1, chunksCount: 1, processedForAI: 1, processedAt: 1 } })
    .toArray();
  const totalChunks = await db.collection("documentchunks").countDocuments();
  const chunksPerCourse = await db.collection("documentchunks")
    .aggregate([
      { $group: { _id: "$courseId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();

  console.log(JSON.stringify({ docs, totalChunks, chunksPerCourse }, null, 2));
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
