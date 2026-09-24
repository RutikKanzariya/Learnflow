const AI_SERVICE_URL = (
  process.env.AI_SERVICE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 180000);

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

const toText = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          return item.text || "";
        }
        if (item && typeof item === "object" && "content" in item) {
          return item.content || "";
        }
        return typeof item === "string" ? item : "";
      })
      .join("");
  }

  return typeof value === "string" ? value : "";
};

const stripCodeFences = (text) => {
  if (!text) return "";
  return text
    .replace(/^```(?:json|text|markdown)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
};

const extractJSON = (raw) => {
  if (raw && typeof raw === "object") return raw;

  const text = stripCodeFences(toText(raw));

  const startChars = [text.indexOf("{"), text.indexOf("[")].filter(
    (i) => i !== -1
  );

  const endChars = [text.lastIndexOf("}"), text.lastIndexOf("]")].filter(
    (i) => i !== -1
  );

  if (startChars.length === 0 || endChars.length === 0) {
    throw new Error("No JSON found in AI response");
  }

  const start = Math.min(...startChars);
  const end = Math.max(...endChars) + 1;

  return JSON.parse(text.slice(start, end));
};

const post = async (path, body) => {
  const response = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`RAG ${path} failed (${response.status}):`, responseText);
    throw new Error(`RAG service error (${response.status})`);
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new Error("RAG returned invalid JSON");
  }
};

// -------------------------------------------------------------
// Roadmap
// -------------------------------------------------------------

const generateRoadmap = async (goal, content) => {
  const data = await post("/roadmap", {
    goal,
    content: content || "",
  });

  let roadmap = toText(data.roadmap);

  if (Array.isArray(data.roadmap)) {
    roadmap = data.roadmap
      .map((item) => {
        if (typeof item === "string") return item;
        return item && typeof item === "object" && item.text ? item.text : "";
      })
      .join("");
  }

  roadmap = stripCodeFences(roadmap);

  return {
    goal,
    roadmap,
    sources: data.sources || 0,
    type: data.type || "roadmap",
  };
};

// -------------------------------------------------------------
// Ask (AI tutor)
// -------------------------------------------------------------

const askTutor = async (question) => {
  const data = await post("/ask", { question });

  let answer = toText(data.answer);

  if (Array.isArray(data.answer)) {
    answer = data.answer
      .map((item) => {
        if (typeof item === "string") return item;
        return item && typeof item === "object" && item.text ? item.text : "";
      })
      .join("");
  }

  answer = stripCodeFences(answer);

  return {
    answer,
    sources: data.sources || 0,
    type: data.type || "answer",
  };
};

// -------------------------------------------------------------
// Quiz
// -------------------------------------------------------------

const generateQuiz = async (topic, content) => {
  const data = await post("/quiz", {
    topic: topic.trim(),
    content: content || "",
  });

  const quiz = extractJSON(data.quiz);

  return {
    topic,
    quiz,
    sources: data.sources || 0,
  };
};

// -------------------------------------------------------------
// Flashcards
// -------------------------------------------------------------

const generateFlashcards = async (topic, content) => {
  const data = await post("/flashcards", {
    topic: topic.trim(),
    content: content || "",
  });

  let cards = Array.isArray(data.cards) ? data.cards : [];

  cards = cards
    .map((item) => {
      if (typeof item === "string") {
        return { front: item, back: "" };
      }
      return item;
    })
    .filter((item) => item && item.front && item.back);

  return {
    topic,
    cards,
    sources: data.sources || 0,
  };
};

export { generateQuiz, generateFlashcards, askTutor, generateRoadmap };
export default generateRoadmap;