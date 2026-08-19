import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  const response = await axios.get(url);

  const generationModels = response.data.models.filter((m) =>
    m.supportedGenerationMethods?.includes("generateContent")
  );

  console.log("Models available to your key that support generateContent:\n");
  generationModels.forEach((m) => console.log(m.name));

  process.exit(0);
}

run();