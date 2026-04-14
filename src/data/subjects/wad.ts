import type { AiTopic } from "../aiSyllabus";

// ── Uncomment each import as you create the .md file ──────────────────────
// import u3t1q1Detailed   from "../answers/wad/u3-t1-q1-detailed.md?raw";
// import u3t1q1Simplified from "../answers/wad/u3-t1-q1-simplified.md?raw";
// import u3t1q2Detailed   from "../answers/wad/u3-t1-q2-detailed.md?raw";
// import u3t1q2Simplified from "../answers/wad/u3-t1-q2-simplified.md?raw";
// import u3t1q3Detailed   from "../answers/wad/u3-t1-q3-detailed.md?raw";
// import u3t1q3Simplified from "../answers/wad/u3-t1-q3-simplified.md?raw";
// import u3t1q4Detailed   from "../answers/wad/u3-t1-q4-detailed.md?raw";
// import u3t1q4Simplified from "../answers/wad/u3-t1-q4-simplified.md?raw";
// import u3t1q5Detailed   from "../answers/wad/u3-t1-q5-detailed.md?raw";
// import u3t1q5Simplified from "../answers/wad/u3-t1-q5-simplified.md?raw";
// import u3t1q6Detailed   from "../answers/wad/u3-t1-q6-detailed.md?raw";
// import u3t1q6Simplified from "../answers/wad/u3-t1-q6-simplified.md?raw";
// import u3t1q7Detailed   from "../answers/wad/u3-t1-q7-detailed.md?raw";
// import u3t1q7Simplified from "../answers/wad/u3-t1-q7-simplified.md?raw";

export const webAppDevelopment: Record<string, AiTopic[]> = {
  "1": [],
  "2": [],
  "3": [
    {
      id: "wad-u3-t1",
      title: "XML and JSON",
      progress: 0,
      status: "locked",
      content: `### Unit 3 Syllabus — XML and JSON

**XML:** Syntax of XML, document structure, and document type definition, namespaces, XML schemas, document object model, presenting XML using CSS, XSLT, XPath, XQuery, FLOWR.

**JSON:** Features, JSON vs. XML, JSON data types, JSON objects, JSON arrays, JSON HTML.

**Practice:** Designing XML schemas and creating JSON objects for data representation.`,
      questions: [
        {
          id: "wad-u3-t1-q1",
          question: "Explain the syntax and basic document structure of XML.",
          answers: {
            detailed:   "placeholder",
            simplified: "placeholder",
          },
          isFree: true,
        },
        {
          id: "wad-u3-t1-q2",
          question: "Explain the role of Document Type Definition (DTD) and XML Schemas in XML.",
          answers: {
            detailed:   "placeholder",
            simplified: "placeholder",
          },
          isFree: false,
        },
        {
          id: "wad-u3-t1-q3",
          question: "Explain the concept of Namespaces and the Document Object Model (DOM) in XML.",
          answers: {
            detailed:   "placeholder",
            simplified: "placeholder",
          },
          isFree: false,
        },
        {
          id: "wad-u3-t1-q4",
          question: "Explain how to present XML data using CSS and XSLT.",
          answers: {
            detailed:   "placeholder",
            simplified: "placeholder",
          },
          isFree: false,
        },
        {
          id: "wad-u3-t1-q5",
          question: "Explain the usage of XPath, XQuery, and the FLOWR expression.",
          answers: {
            detailed:   "placeholder",
            simplified: "placeholder",
          },
          isFree: false,
        },
        {
          id: "wad-u3-t1-q6",
          question: "Explain the features of JSON and provide a detailed comparison between JSON and XML.",
          answers: {
            detailed:   "placeholder",
            simplified: "placeholder",
          },
          isFree: false,
        },
        {
          id: "wad-u3-t1-q7",
          question: "Explain JSON data types, objects, and arrays with suitable examples.",
          answers: {
            detailed:   "placeholder",
            simplified: "placeholder",
          },
          isFree: false,
        },
      ],
    },
  ],
  "4": [],
  "5": [],
};