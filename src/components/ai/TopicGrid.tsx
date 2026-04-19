
import { CheckCircle2, PlayCircle, Circle, BrainCircuit, ArrowRight } from "lucide-react";
import genai from "@/assets/aiWhite.png";

export function TopicGrid({ topics, activeUnit, subjectName, onSelectTopic, onGenerate }) {

  const statusConfig = {
    completed:     { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: "Done" },
    "in-progress": { icon: <PlayCircle   className="w-4 h-4 text-sky-400" />,     label: "In progress" },
    locked:        { icon: <Circle       className="w-4 h-4 text-neutral-700" />, label: "Not started" },
  };

  return (
    <div className="p-4 sm:p-6">

      {/* Header */}
      <div className="mb-5">
        <h3 className="text-xl sm:text-2xl font-bold text-neutral-100 mb-1">
          Unit {activeUnit}
        </h3>
        <p className="text-neutral-500 text-sm">
          {topics.length} part{topics.length !== 1 ? "s" : ""}
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-neutral-800 rounded-xl">
          <p className="text-neutral-600 text-sm text-center px-6">
            No parts assigned to Unit {activeUnit} yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">

          {topics.map((topic, idx) => {
            const statusKey = topic.status in statusConfig ? topic.status : "locked";
            const { icon } = statusConfig[statusKey];

            return (
              <button
                key={topic.id}
                onClick={() => onSelectTopic(topic)}
                className="group text-left bg-[#141414] border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-200 hover:bg-[#191919] flex flex-col"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="shrink-0 mt-0.5">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-neutral-600 mb-0.5">
                      Part {String(idx + 1).padStart(2, "0")}
                    </p>
                    <h4 className="text-sm font-medium text-neutral-200 leading-snug group-hover:text-neutral-100 transition-colors">
                      {topic.title}
                    </h4>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-700 group-hover:text-neutral-500 shrink-0 mt-1 transition-colors" />
                </div>

                <div className="mt-auto space-y-1.5 w-full">
                  <div className="flex justify-between text-xs">
                    <span className={topic.progress > 0 ? "text-neutral-400" : "text-neutral-700"}>
                      {topic.progress > 0 ? `${topic.progress}%` : "Not started"}
                    </span>
                    <span className="text-neutral-700">
                      {Array.isArray(topic.questions) ? topic.questions.length : 0} Q{(!Array.isArray(topic.questions) || topic.questions.length !== 1) ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        topic.progress === 100
                          ? "bg-emerald-500"
                          : topic.progress > 0
                          ? "bg-sky-500"
                          : "bg-transparent"
                      }`}
                      style={{ width: `${topic.progress}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}

          {/* Generate CTA */}
          <button
            onClick={onGenerate}
            className="xl:col-span-2 group rounded-xl border border-neutral-800 hover:border-neutral-700 bg-[#141414] hover:bg-[#191919] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 mt-1 text-left"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-neutral-500">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span className="font-semibold tracking-widest text-[10px] uppercase">Practice Mode</span>
              </div>
              <h4 className="text-sm font-medium text-neutral-200 mb-0.5 group-hover:text-neutral-100 transition-colors">
                Generate All Framed Questions
              </h4>
              <p className="text-neutral-600 text-xs max-w-sm">
                Practice all exam-framed questions across every part in Unit {activeUnit}.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 bg-neutral-800 group-hover:bg-neutral-700 text-neutral-200 font-medium px-4 py-2 rounded-lg transition-colors text-sm w-full sm:w-auto justify-center">
              Generate
              <img src={genai} alt="AI" className="w-3.5 h-3.5 opacity-70" />
            </div>
          </button>

        </div>
      )}
    </div>
  );
}