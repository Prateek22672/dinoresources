import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { tbl, SubjectRow, SubjectQARow, EditorialRow, TopicRow } from "@/integrations/supabase/revamp";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import { toast } from "sonner";
import {
  PenSquare,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  FileUp,
  ExternalLink,
  Clapperboard,
  Briefcase,
  FileText,
  Youtube,
  Link2,
  ImagePlus,
} from "lucide-react";
import { AiIcon } from "@/components/BrandIcons";

const UNITS = [1, 2, 3, 4, 5];
const RES_CATEGORIES = ["Syllabus", "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "Previous Papers", "Additional Resources"];

function appendMarkdownBlock(current: string, block: string) {
  const trimmed = current.trimEnd();
  return trimmed ? `${trimmed}\n\n${block}` : block;
}

function escapeImageAlt(alt: string) {
  return (alt.trim() || "Study image").replace(/\\/g, "\\\\").replace(/\]/g, "\\]");
}

function buildImageMarkdown(alt: string, url: string) {
  return `![${escapeImageAlt(alt)}](${url.trim()})`;
}

function MarkdownImageInserter({
  onInsert,
  compact = false,
}: {
  onInsert: (markdown: string) => void;
  compact?: boolean;
}) {
  const [alt, setAlt] = useState("");
  const [url, setUrl] = useState("");

  const insert = () => {
    if (!url.trim()) {
      toast.error("Paste a public image link first");
      return;
    }

    onInsert(buildImageMarkdown(alt, url));
    setAlt("");
    setUrl("");
    toast.success("Image added to the answer");
  };

  return (
    <div className={`${compact ? "mt-2" : "mt-2.5"} rounded-xl border border-white/10 bg-white/[0.025] p-3`}>
      <p className="text-[11px] font-bold tracking-wider uppercase text-zinc-500 mb-2 flex items-center gap-1.5">
        <ImagePlus className="w-3.5 h-3.5" /> Add photo in answer
      </p>

      <div className="grid sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1.35fr)_auto] gap-2">
        <input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Caption / alt text"
          className="td-surface-2 rounded-lg px-3 h-9 text-xs text-white outline-none placeholder:text-zinc-600"
        />

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Google Drive image link or direct image URL"
          className="td-surface-2 rounded-lg px-3 h-9 text-xs text-white outline-none placeholder:text-zinc-600"
        />

        <button
          type="button"
          onClick={insert}
          className="td-btn-ghost px-3 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <ImagePlus className="w-3.5 h-3.5" /> Insert
        </button>
      </div>

      {!compact && (
        <p className="text-zinc-600 text-[11px] mt-2">
          Upload the image to Drive, set it to public view access, paste the link here, then preview the answer.
        </p>
      )}
    </div>
  );
}

export default function Contributor() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [unit, setUnit] = useState(1);
  const [qa, setQa] = useState<SubjectQARow[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [qaTopic, setQaTopic] = useState("");

  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [topicDraft, setTopicDraft] = useState("");
  const [mTopic, setMTopic] = useState("");

  const loadTopics = useCallback(async () => {
    if (!subjectId) return;

    const { data } = await tbl("unit_topics").select("*")
      .eq("subject_id", subjectId).eq("unit_number", unit)
      .order("order_index", { ascending: true });

    setTopics((data ?? []) as TopicRow[]);
  }, [subjectId, unit]);

  useEffect(() => {
    loadTopics();
    setQaTopic("");
    setMTopic("");
  }, [loadTopics]);

  const addTopic = async () => {
    if (!topicDraft.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await tbl("unit_topics").insert({
      subject_id: subjectId,
      unit_number: unit,
      title: topicDraft.trim(),
      order_index: topics.length,
      created_by: user?.id,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Topic added");
    setTopicDraft("");
    loadTopics();
  };

  const deleteTopic = async (t: TopicRow) => {
    if (!confirm(`Delete topic "${t.title}"? Its Q&A/materials move to General.`)) return;

    const { error } = await tbl("unit_topics").delete().eq("id", t.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Topic deleted");
      loadTopics();
      loadQa();
    }
  };

  const [mTitle, setMTitle] = useState("");
  const [mUrl, setMUrl] = useState("");
  const [mType, setMType] = useState<"pdf" | "youtube" | "link">("pdf");
  const [mCat, setMCat] = useState("Unit 1");

  const [syllabusUrl, setSyllabusUrl] = useState("");
  const [pyqTitle, setPyqTitle] = useState("");
  const [pyqUrl, setPyqUrl] = useState("");

  const addSubjectMaterial = async (category: string, url: string, title: string, type: "pdf" | "link" = "pdf"): Promise<boolean> => {
    if (!subjectId) {
      toast.error("Pick a subject first");
      return false;
    }

    if (!url.trim()) {
      toast.error("Paste the Drive/PDF link");
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("resources").insert({
      subject_id: subjectId,
      title: title.trim() || category,
      url: url.trim(),
      type,
      category,
      unit_number: null,
      created_by: user?.id,
    } as any);

    if (error) {
      toast.error(error.message);
      return false;
    }

    toast.success(`${category} added`);
    loadMaterials();
    return true;
  };

  const [editorials, setEditorials] = useState<EditorialRow[]>([]);
  const [edTitle, setEdTitle] = useState("");
  const [edUrl, setEdUrl] = useState("");
  const [edTopic, setEdTopic] = useState("");

  const [unitCounts, setUnitCounts] = useState<Record<number, number>>({});
  const [materials, setMaterials] = useState<any[]>([]);

  const loadCounts = useCallback(async () => {
    if (!subjectId) return;

    const { data } = await tbl("subject_qa").select("unit_number").eq("subject_id", subjectId);
    const map: Record<number, number> = {};

    (data ?? []).forEach((r: any) => {
      map[r.unit_number] = (map[r.unit_number] ?? 0) + 1;
    });

    setUnitCounts(map);
  }, [subjectId]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const loadMaterials = useCallback(async () => {
    if (!subjectId) return;

    const { data } = await supabase.from("resources").select("*").eq("subject_id", subjectId);
    setMaterials((data ?? []) as any[]);
  }, [subjectId]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const deleteMaterial = async (id: string) => {
    if (!confirm("Remove this material?")) return;

    const { error } = await supabase.from("resources").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Removed");
      loadMaterials();
    }
  };

  useEffect(() => {
    (async () => {
      const { data } = await tbl("subjects").select("*").order("name");
      const subs = (data ?? []) as SubjectRow[];

      setSubjects(subs);
      if (subs[0]) setSubjectId(subs[0].id);
    })();
  }, []);

  const loadQa = useCallback(async () => {
    if (!subjectId) return;

    setLoading(true);

    const { data } = await tbl("subject_qa").select("*")
      .eq("subject_id", subjectId).eq("unit_number", unit)
      .order("order_index", { ascending: true });

    setQa((data ?? []) as SubjectQARow[]);
    setLoading(false);
  }, [subjectId, unit]);

  useEffect(() => {
    loadQa();
  }, [loadQa]);

  const loadEditorials = useCallback(async () => {
    if (!subjectId) return;

    const { data } = await tbl("subject_editorial").select("*")
      .eq("subject_id", subjectId).eq("unit_number", unit).order("created_at", { ascending: false });

    setEditorials((data ?? []) as EditorialRow[]);
  }, [subjectId, unit]);

  useEffect(() => {
    loadEditorials();
  }, [loadEditorials]);

  const addEditorial = async () => {
    if (!edUrl.trim()) {
      toast.error("YouTube URL required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await tbl("subject_editorial").insert({
      subject_id: subjectId,
      unit_number: unit,
      topic_id: edTopic || null,
      title: edTitle.trim() || null,
      youtube_url: edUrl.trim(),
      created_by: user?.id,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Editorial added");
    setEdTitle("");
    setEdUrl("");
    setEdTopic("");
    loadEditorials();
  };

  const deleteEditorial = async (id: string) => {
    if (!confirm("Remove this editorial video?")) return;

    const { error } = await tbl("subject_editorial").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Removed");
      loadEditorials();
    }
  };

  const addQa = async () => {
    if (!q.trim()) {
      toast.error("Question required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await tbl("subject_qa").insert({
      subject_id: subjectId,
      unit_number: unit,
      question: q.trim(),
      answer_md: a,
      is_free: isFree,
      order_index: qa.length,
      created_by: user?.id,
      topic_id: qaTopic || null,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Q&A added");
    setQ("");
    setA("");
    setIsFree(false);
    loadQa();
    loadCounts();
  };

  const saveQa = async (item: SubjectQARow) => {
    const { error } = await tbl("subject_qa").update({
      question: item.question,
      answer_md: item.answer_md,
      is_free: item.is_free,
      topic_id: (item as any).topic_id ?? null,
    }).eq("id", item.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Saved");
    }
  };

  const deleteQa = async (id: string) => {
    if (!confirm("Delete this Q&A?")) return;

    const { error } = await tbl("subject_qa").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Deleted");
      loadQa();
      loadCounts();
    }
  };

  const addMaterial = async () => {
    if (!mTitle.trim() || !mUrl.trim()) {
      toast.error("Title and URL required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const unitNum = /^Unit (\d)/.exec(mCat)?.[1];

    const { error } = await supabase.from("resources").insert({
      subject_id: subjectId,
      title: mTitle.trim(),
      url: mUrl.trim(),
      type: mType,
      category: mCat as any,
      unit_number: unitNum ? Number(unitNum) : null,
      created_by: user?.id,
      topic_id: mCat === `Unit ${unit}` && mTopic ? mTopic : null,
    } as any);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Material added");
    setMTitle("");
    setMUrl("");
    loadMaterials();
  };

  return (
    <AppShell>
      <PageHero
        eyebrow="Contributor"
        eyebrowIcon={PenSquare}
        book={{ cover: "#7c6cf0", spine: "#5b4fc4", title: "FLAT" }}
        title="Contributor Studio"
        subtitle="Add Study-With-AI Q&A, upload materials and drop editorial videos - unit by unit."
        actions={
          <Link to="/contributor/jobs" className="td-btn-ghost px-5 py-3 rounded-full text-sm font-medium flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" /> Jobs content
          </Link>
        }
        stats={[
          { label: "Q&A in subject", value: Object.values(unitCounts).reduce((n, c) => n + c, 0), icon: AiIcon },
          { label: "Materials", value: materials.length, icon: FileUp },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="td-surface-2 rounded-full px-4 h-11 text-sm text-white outline-none min-w-[200px] max-w-full"
        >
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1 [&::-webkit-scrollbar]:hidden">
          {UNITS.map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`shrink-0 px-3.5 h-11 rounded-full text-sm font-medium flex items-center gap-1.5 ${unit === u ? "bg-white text-black" : "td-btn-ghost"}`}
            >
              Unit {u}
              {unitCounts[u] ? (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${unit === u ? "bg-black/10 text-black" : "td-surface-2 text-zinc-400"}`}>
                  {unitCounts[u]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="td-surface rounded-2xl p-4 mb-6">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 mb-2.5">
          Topics in Unit {unit} <span className="normal-case tracking-normal text-zinc-600">- divide the unit; Q&amp;A and materials can attach to a topic</span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {topics.map((t) => (
            <span key={t.id} className="td-surface-2 rounded-full pl-3.5 pr-1.5 py-1.5 text-[13px] text-zinc-200 font-medium flex items-center gap-1.5">
              {t.title}
              <button onClick={() => deleteTopic(t)} className="w-5 h-5 rounded-full hover:bg-red-500/25 flex items-center justify-center" title="Delete topic">
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </span>
          ))}

          <div className="flex items-center gap-1.5">
            <input
              value={topicDraft}
              onChange={(e) => setTopicDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTopic()}
              placeholder="New topic..."
              className="td-surface-2 rounded-full px-3.5 h-9 text-[13px] text-white outline-none placeholder:text-zinc-600 w-36"
            />

            <button onClick={addTopic} className="td-btn-ghost w-9 h-9 rounded-full flex items-center justify-center" title="Add topic">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="td-surface rounded-3xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
          <FileText className="w-4 h-4 td-accent-text" /> Syllabus &amp; PYQs <span className="text-zinc-600 text-xs font-normal">- whole subject</span>
        </h3>

        <p className="text-zinc-500 text-xs mb-4">Paste a Google Drive / PDF link. The syllabus is one combined document; add previous-year papers as separate links.</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold tracking-wider uppercase text-zinc-500">Syllabus (one link)</label>

            <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
              <input
                value={syllabusUrl}
                onChange={(e) => setSyllabusUrl(e.target.value)}
                placeholder="Drive / PDF link"
                className="flex-1 min-w-0 td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600"
              />

              <button
                onClick={async () => {
                  const ok = await addSubjectMaterial("Syllabus", syllabusUrl, "Syllabus");
                  if (ok) setSyllabusUrl("");
                }}
                className="td-btn-primary px-4 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold tracking-wider uppercase text-zinc-500">PYQ paper (add each)</label>

            <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
              <input
                value={pyqTitle}
                onChange={(e) => setPyqTitle(e.target.value)}
                placeholder="e.g. 2023 End-sem"
                className="sm:w-32 td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600"
              />

              <input
                value={pyqUrl}
                onChange={(e) => setPyqUrl(e.target.value)}
                placeholder="Drive / PDF link"
                className="flex-1 min-w-0 td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600"
              />

              <button
                onClick={async () => {
                  const ok = await addSubjectMaterial("Previous Papers", pyqUrl, pyqTitle || "PYQ");
                  if (ok) {
                    setPyqUrl("");
                    setPyqTitle("");
                  }
                }}
                className="td-btn-primary px-4 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="td-surface rounded-3xl p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AiIcon className="w-4 h-4" /> Add Study-With-AI Q&amp;A
            </h3>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Question"
              className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600 mb-2"
            />

            <textarea
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="Answer (markdown supported)..."
              rows={5}
              className="w-full td-surface-2 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 resize-y"
            />

            <MarkdownImageInserter onInsert={(markdown) => setA((current) => appendMarkdownBlock(current, markdown))} />

            {topics.length > 0 && (
              <select
                value={qaTopic}
                onChange={(e) => setQaTopic(e.target.value)}
                className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none mt-2"
              >
                <option value="">Topic: General</option>
                {topics.map((t) => <option key={t.id} value={t.id}>Topic: {t.title}</option>)}
              </select>
            )}

            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} /> Free preview
              </label>

              <div className="flex gap-2">
                <button onClick={() => setPreview(a)} className="td-btn-ghost px-3 py-2 text-sm flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>

                <button onClick={addQa} className="td-btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? <div className="h-20 rounded-2xl td-surface animate-pulse" /> :
              qa.length === 0 ? <p className="text-zinc-600 text-sm text-center py-6">No Q&amp;A for this unit yet.</p> :
              [...topics.map((t) => ({ gid: t.id as string | null, title: t.title })), { gid: null, title: "General" }].map((group) => {
                const items = qa.filter((x) => ((x as any).topic_id ?? null) === group.gid);
                if (items.length === 0) return null;

                return (
                  <div key={group.gid ?? "general"} className="space-y-2">
                    {topics.length > 0 && (
                      <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 px-1">
                        {group.title} - {items.length}
                      </p>
                    )}

                    {items.map((item) => (
                      <div key={item.id} className="td-surface rounded-2xl p-4 space-y-2">
                        <input
                          value={item.question}
                          onChange={(e) => setQa((p) => p.map((x) => x.id === item.id ? { ...x, question: e.target.value } : x))}
                          className="w-full bg-transparent text-white font-medium text-sm outline-none"
                        />

                        <textarea
                          value={item.answer_md}
                          onChange={(e) => setQa((p) => p.map((x) => x.id === item.id ? { ...x, answer_md: e.target.value } : x))}
                          rows={3}
                          className="w-full td-surface-2 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none resize-y"
                        />

                        <MarkdownImageInserter
                          compact
                          onInsert={(markdown) => {
                            setQa((p) => p.map((x) => (
                              x.id === item.id
                                ? { ...x, answer_md: appendMarkdownBlock(x.answer_md, markdown) }
                                : x
                            )));
                          }}
                        />

                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setQa((p) => p.map((x) => x.id === item.id ? { ...x, is_free: !x.is_free } : x))}
                              className="text-xs flex items-center gap-1 text-zinc-400"
                            >
                              {item.is_free ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                              {item.is_free ? "Free" : "Paid"}
                            </button>

                            {topics.length > 0 && (
                              <select
                                value={(item as any).topic_id ?? ""}
                                onChange={(e) => setQa((p) => p.map((x) => x.id === item.id ? { ...x, topic_id: e.target.value || null } as any : x))}
                                className="td-surface-2 rounded-lg px-2 h-7 text-[11px] text-zinc-300 outline-none"
                              >
                                <option value="">General</option>
                                {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                              </select>
                            )}
                          </div>

                          <div className="flex gap-1.5">
                            <button onClick={() => saveQa(item)} className="td-btn-ghost px-3 py-1.5 text-xs flex items-center gap-1">
                              <Save className="w-3 h-3" /> Save
                            </button>

                            <button onClick={() => deleteQa(item.id)} className="w-8 h-8 rounded-full hover:bg-red-500/20 flex items-center justify-center">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="td-surface rounded-3xl p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <FileUp className="w-4 h-4 td-accent-text" /> Add material
            </h3>

            <input
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
              placeholder="Title"
              className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600 mb-2"
            />

            <input
              value={mUrl}
              onChange={(e) => setMUrl(e.target.value)}
              placeholder="URL (PDF / YouTube / link)"
              className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600 mb-2"
            />

            <div className="flex gap-2 flex-wrap">
              <select value={mType} onChange={(e) => setMType(e.target.value as any)} className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none">
                <option value="pdf">PDF</option>
                <option value="youtube">YouTube</option>
                <option value="link">Link</option>
              </select>

              <select value={mCat} onChange={(e) => setMCat(e.target.value)} className="flex-1 min-w-0 td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none">
                {RES_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <button onClick={addMaterial} className="td-btn-primary px-4 text-sm flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {mCat === `Unit ${unit}` && topics.length > 0 && (
              <select
                value={mTopic}
                onChange={(e) => setMTopic(e.target.value)}
                className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none mt-2"
              >
                <option value="">Topic: General</option>
                {topics.map((t) => <option key={t.id} value={t.id}>Topic: {t.title}</option>)}
              </select>
            )}

            <p className="text-zinc-600 text-xs mt-2 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Upload files to Supabase Storage / Drive and paste the link here.
            </p>

            {materials.length > 0 && (
              <div className="mt-4 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-600 mb-1.5">In this subject ({materials.length})</p>

                {materials.map((m) => {
                  const TypeIcon = m.type === "youtube" ? Youtube : m.type === "pdf" ? FileText : Link2;

                  return (
                    <div key={m.id} className="td-surface-2 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                      <TypeIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />

                      <div className="min-w-0 flex-1">
                        <p className="text-zinc-200 text-[13px] font-medium truncate">{m.title}</p>
                        <p className="text-zinc-600 text-[11px] truncate">{m.category}</p>
                      </div>

                      <a href={m.url} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center shrink-0" title="Open">
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>

                      <button onClick={() => deleteMaterial(m.id)} className="w-7 h-7 rounded-full hover:bg-red-500/20 flex items-center justify-center shrink-0" title="Remove">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="td-surface rounded-3xl p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Clapperboard className="w-4 h-4 td-accent-text" /> Editorial video
            </h3>

            <input
              value={edTitle}
              onChange={(e) => setEdTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600 mb-2"
            />

            <div className="flex gap-2">
              <input
                value={edUrl}
                onChange={(e) => setEdUrl(e.target.value)}
                placeholder="YouTube URL"
                className="flex-1 td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600"
              />

              <button onClick={addEditorial} className="td-btn-primary px-4 text-sm flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {topics.length > 0 && (
              <select
                value={edTopic}
                onChange={(e) => setEdTopic(e.target.value)}
                className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none mt-2"
              >
                <option value="">Topic: General</option>
                {topics.map((t) => <option key={t.id} value={t.id}>Topic: {t.title}</option>)}
              </select>
            )}

            <p className="text-zinc-600 text-xs mt-2">Plays embedded on the subject's Editorial tab - grouped under the topic you pick.</p>

            {editorials.length > 0 && (
              <div className="space-y-2 mt-3">
                {editorials.map((e) => (
                  <div key={e.id} className="td-surface-2 rounded-xl p-3 flex items-center gap-3">
                    <Clapperboard className="w-4 h-4 text-zinc-400 shrink-0" />

                    <div className="min-w-0 flex-1">
                      <p className="text-zinc-200 text-sm font-medium truncate">{e.title || "Editorial"}</p>
                      <p className="text-zinc-600 text-xs truncate">{e.youtube_url}</p>
                    </div>

                    {topics.length > 0 && (
                      <select
                        value={(e as any).topic_id ?? ""}
                        onChange={async (ev) => {
                          const v = ev.target.value || null;
                          const { error } = await tbl("subject_editorial").update({ topic_id: v }).eq("id", e.id);

                          if (error) {
                            toast.error(error.message);
                          } else {
                            toast.success("Topic updated");
                            loadEditorials();
                          }
                        }}
                        className="td-surface-2 rounded-lg px-2 h-7 text-[11px] text-zinc-300 outline-none shrink-0 max-w-[110px]"
                      >
                        <option value="">General</option>
                        {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    )}

                    <button onClick={() => deleteEditorial(e.id)} className="w-8 h-8 rounded-full hover:bg-red-500/20 flex items-center justify-center shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {preview !== null && (
            <div className="td-surface rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Answer preview</h3>
                <button onClick={() => setPreview(null)} className="text-zinc-500 hover:text-white text-sm">Close</button>
              </div>

              <MarkdownRenderer content={preview || "_Nothing to preview_"} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}