import type { AiTopic } from "../aiSyllabus";

import u3t1q1Detailed   from "../answers/ai/u3-t1-q1-detailed.md?raw";
import u3t1q1Simplified from "../answers/ai/u3-t1-q1-simplified.md?raw";

export const artificialIntelligence: Record<string, AiTopic[]> = {
  "1": [],
  "2": [],
  "3": [
    {
      id: "ai-u3-t1",
      title: "Knowledge Representation & Reasoning",
      progress: 0,
      status: "locked",
      content: `### Knowledge Representation
This is placeholder content for testing. Replace this with a proper **.md** import once you confirm everything works.

**Propositional Logic** deals with True/False statements.

**First-Order Logic** adds variables and quantifiers like ∀ and ∃.`,
      questions: [
        {
          id: "ai-u3-t1-q1",
          question: "What is the difference between Propositional Logic and First-Order Logic?",
          answers: {
            detailed:   u3t1q1Detailed,
            simplified: u3t1q1Simplified,
          },
          isFree: true,
        },
        {
          id: "ai-u3-t1-q2",
          question: "This is a placeholder locked question to test the paywall.",
          answers: {
            detailed:   "**Detailed answer** placeholder. Add a `.md` file when ready.",
            simplified: "Simplified answer placeholder.",
          },
          isFree: false,
        },
      ],
    },
  ],
  "4": [],
  "5": [],
};