// A deliberately diverse seed set spanning task types, since routing
// difficulty correlates more with task type than with surface features
// like length. Category is metadata for humans reading this file — the
// actual training label comes from the judge, not from this tag.
export const SEED_PROMPTS = [
  // Factual / lookup — should almost always stay on the cheap tier
  { prompt: "What is the capital of Japan?", category: "factual" },
  { prompt: "Who wrote Pride and Prejudice?", category: "factual" },
  { prompt: "What year did World War II end?", category: "factual" },
  { prompt: "What is the boiling point of water in Celsius?", category: "factual" },
  { prompt: "How many continents are there?", category: "factual" },
  { prompt: "What is the chemical symbol for gold?", category: "factual" },

  // Casual / conversational — trivially cheap tier
  { prompt: "Hi, how are you?", category: "casual" },
  { prompt: "What's a good name for a coffee shop?", category: "casual" },
  { prompt: "Tell me a fun fact about octopuses.", category: "casual" },
  { prompt: "What's the weather usually like in April?", category: "casual" },

  // Simple code — often fine on cheap tier
  { prompt: "Write a function to reverse a string in Python.", category: "code_simple" },
  { prompt: "How do I check if a list is empty in JavaScript?", category: "code_simple" },
  { prompt: "What does the 'const' keyword do in JavaScript?", category: "code_simple" },

  // Complex code / debugging — often needs the strong tier
  { prompt: "Debug this: a React useEffect hook is causing an infinite render loop when it updates state that it also depends on.", category: "code_complex" },
  { prompt: "Design a rate limiter that handles distributed nodes without a shared clock.", category: "code_complex" },
  { prompt: "Explain why this SQL query is slow and how to optimize it: a query joining 5 tables with no indexes on foreign keys.", category: "code_complex" },
  { prompt: "Write a thread-safe LRU cache in Python from scratch, explaining the concurrency tradeoffs.", category: "code_complex" },

  // Reasoning / multi-step — usually needs the strong tier
  { prompt: "If a train leaves city A at 60mph and another leaves city B at 90mph toward each other, and the cities are 450 miles apart, when do they meet?", category: "reasoning" },
  { prompt: "Explain step by step why the halting problem is undecidable.", category: "reasoning" },
  { prompt: "Walk me through the tradeoffs between eventual consistency and strong consistency in distributed databases.", category: "reasoning" },
  { prompt: "Compare and contrast REST, GraphQL, and gRPC for a high-throughput internal microservices architecture.", category: "reasoning" },
  { prompt: "Analyze the failure modes of a system using optimistic locking under high write contention.", category: "reasoning" },

  // Creative / long-form — mixed, depends on depth requested
  { prompt: "Write a haiku about autumn.", category: "creative_short" },
  { prompt: "Give me three tagline ideas for a productivity app.", category: "creative_short" },
  { prompt: "Write a detailed short story about a lighthouse keeper who discovers something impossible, with a twist ending.", category: "creative_long" },
  { prompt: "Draft a nuanced blog post explaining the ethical tradeoffs of AI-generated art for a general audience.", category: "creative_long" },

  // Ambiguous / borderline — genuinely useful for a classifier to see
  { prompt: "What's 15% of 240?", category: "borderline" },
  { prompt: "Summarize the plot of Hamlet in two sentences.", category: "borderline" },
  { prompt: "Explain the difference between TCP and UDP.", category: "borderline" },
  { prompt: "What's the difference between a mutex and a semaphore?", category: "borderline" },

  // Deliberately hard — targeting known weak points of mid-size models
  { prompt: "A store offers a 30% discount, then an additional 15% off the discounted price, then charges 8% sales tax on the final amount. If the original price was $85, what is the final price? Show each step.", category: "hard_math" },
  { prompt: "Three switches outside a room control three bulbs inside. You can flip switches any number of times, but can only enter the room once. How do you determine which switch controls which bulb?", category: "hard_logic" },
  { prompt: "Design a database schema and indexing strategy for a system that must support both real-time inventory updates from 10,000 warehouses and complex analytical queries across 5 years of history, without the analytical queries degrading write throughput.", category: "hard_architecture" },
  { prompt: "A function computes the nth Fibonacci number using naive recursion with no memoization. For n=40, estimate roughly how many recursive calls occur, and explain the growth rate.", category: "hard_cs_theory" },
  { prompt: "In a room of 30 people, what is the approximate probability that at least two share a birthday? Explain the reasoning, not just the formula.", category: "hard_math" },
  { prompt: "Explain the subtle difference between eventual consistency and causal consistency with a concrete example where the distinction actually changes application behavior.", category: "hard_reasoning" },
  { prompt: "A distributed system uses a Raft consensus cluster of 5 nodes. If 2 nodes fail simultaneously, walk through exactly what happens to leader election, write availability, and read consistency.", category: "hard_architecture" },
  { prompt: "Write a solution to detect a cycle in a linked list using O(1) extra space, then explain precisely why the two-pointer approach is guaranteed to meet inside the cycle rather than looping past it.", category: "hard_cs_theory" },
  { prompt: "You have 9 identical-looking balls, one of which is slightly heavier. Using a balance scale only twice, how do you find the heavier ball? Explain the strategy, not just the answer.", category: "hard_logic" },
  { prompt: "A cache has a 90% hit rate at 10ms average hit latency and 200ms average miss latency. If traffic doubles and the hit rate drops to 75% due to cache eviction pressure, what is the new average latency, and what does this reveal about capacity planning?", category: "hard_math" },
];