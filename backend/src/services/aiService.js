const generateRoadmap = async (goal) => {
  const response = await fetch("http://localhost:8000/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: `Create a learning roadmap for this goal: ${goal}`,
    }),
  });

  if (!response.ok) {
    throw new Error("RAG service failed");
  }

  const data = await response.json();

  let answer = data.answer;
  if(Array.isArray(answer)){
    answer = answer.map((item) => item.text || "").join("");
  }
  return {
    goal,
    roadmap: data.answer,
    sources: data.sources,
  };
};

// const generateQuiz = async (topic) => {
//   const response = await fetch("http://localhost:8000/ask", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       question: `Create a 5-question multiple-choice quiz about ${topic}.
// Use only the information available in the document.
// For each question provide:
// 1. question
// 2. four options
// 3. correct answer
// 4. topic`,
//     }),
//   });

//   if (!response.ok) {
//     throw new Error("RAG service failed");
//   }

//   const data = await response.json();

//   let answer = data.answer;

//   if (Array.isArray(answer)) {
//     answer = answer
//       .map((item) => item.text || "")
//       .join("");
//   }

//   return {
//     topic,
//     quiz: answer,
//     sources: data.sources,
//   };
// };

// const generateQuiz = async (topic) => {
//   const response = await fetch("http://localhost:8000/quiz", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       topic,
//     }),
//   });

//   if (!response.ok) {
//     throw new Error("RAG quiz service failed");
//   }

//   const data = await response.json();

//   let quiz = data.quiz;

//   if (Array.isArray(quiz)) {
//     quiz = quiz.map((item) => item.text || "").join("");
//   }

//   return {
//     topic,
//     quiz,
//     sources: data.sources,
//   };
// };

const generateQuiz = async (topic) => {
  const response = await fetch("http://localhost:8000/quiz", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: topic.trim(),
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error("RAG quiz response:", responseText);
    throw new Error(`RAG quiz service failed: ${responseText}`);
  }

  let data;

  try {
    data = JSON.parse(responseText);
  } catch (error) {
    throw new Error("RAG returned invalid JSON");
  }

  let quiz = data.quiz;

  if (Array.isArray(quiz)) {
    quiz = quiz.map((item) => item.text || "").join("");
  }

  return {
    topic,
    quiz,
    sources: data.sources,
  };
};
export { generateQuiz };

export default generateRoadmap;

