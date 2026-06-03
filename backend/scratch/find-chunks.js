require("dotenv").config({ path: "backend/.env" });
const mongoose = require("mongoose");

async function main() {
  const phrase = process.argv.slice(2).join(" ").trim();

  if (!phrase) {
    console.error('Usage: node backend/scratch/find-chunks.js "risk governance"');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

  const db = mongoose.connection.db;
  const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const rows = await db
    .collection("documentchunks")
    .find(
      {
        $or: [
          { content: regex },
          { "metadata.topic": regex },
          { "metadata.headingTrail": regex },
          { "metadata.semanticType": regex },
        ],
      },
      {
        projection: {
          courseId: 1,
          documentId: 1,
          pageNumber: 1,
          chunkIndex: 1,
          content: 1,
          "metadata.documentTitle": 1,
          "metadata.fileName": 1,
          "metadata.topic": 1,
          "metadata.headingTrail": 1,
          "metadata.semanticType": 1,
        },
      },
    )
    .limit(20)
    .toArray();

  const results = rows.map((row) => ({
    id: String(row._id),
    courseId: String(row.courseId),
    documentId: String(row.documentId),
    pageNumber: row.pageNumber ?? row.metadata?.pageNumber ?? null,
    chunkIndex: row.chunkIndex,
    topic: row.metadata?.topic ?? null,
    headingTrail: row.metadata?.headingTrail ?? [],
    semanticType: row.metadata?.semanticType ?? null,
    documentTitle: row.metadata?.documentTitle ?? row.metadata?.fileName ?? "Uploaded Document",
    preview: String(row.content || "").replace(/\s+/g, " ").slice(0, 500),
  }));

  console.log(
    JSON.stringify(
      {
        phrase,
        count: results.length,
        results,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
