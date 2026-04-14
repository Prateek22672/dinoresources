import type { AiTopic } from "../aiSyllabus";

export const compilerDesign: Record<string, AiTopic[]> = {
  "1": [],
  "2": [],
  "3": [
    {
      id: "cd-u3-t1",
      title: "Syntax-Directed Translation — Test Topic",
      progress: 0,
      status: "locked",
      content: `### Compiler Design Test
This entire topic is inline to verify **Compiler Design** loads correctly.

- Point one
- Point two
- Point three`,
      questions: [
        {
          id: "cd-u3-t1-q1",
          question: "Test question for Compiler Design — is this rendering?",
          answers: {
            detailed:   "**Yes**, this is the detailed answer rendered from an inline string.",
            simplified: "Yes, it works.",
          },
          isFree: true,
        },
      ],
    },
  ],
  "4": [],
  "5": [],
};