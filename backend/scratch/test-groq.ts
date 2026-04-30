import "dotenv/config";
import Groq from "groq-sdk";

async function testGroq() {
  try {
    console.log("Initializing Groq...");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log("Sending chat completion request...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Hello" }],
      model: "llama-3.1-8b-instant",
    });
    console.log("Response:", chatCompletion.choices[0]?.message?.content);
  } catch (error) {
    console.error("Groq Test Error:", error);
  }
}

void testGroq();
