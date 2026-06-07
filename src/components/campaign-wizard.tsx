"use client";

import { useState, useMemo, useRef } from "react";
import { Check, ChevronLeft, ChevronRight, Play, Upload, X, Link, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { campaignTemplates } from "@/lib/templates";
import { CampaignBriefSchema, type CampaignBriefDraft, type CampaignProject, type WizardStep, type ContextFile } from "@/lib/schemas";

const wizardSteps: { id: WizardStep; label: string; title: string; description: string }[] = [
  { id: "context_sources", label: "Context", title: "Context & Sources", description: "Provide URLs, documents, and notes for the AI agent to use as research context." },
  { id: "brand_goal", label: "Brand & Goal", title: "Brand & Campaign Goal", description: "Define your brand, product, and what this campaign should achieve." },
  { id: "audience", label: "Audience", title: "Target Audience", description: "Who is this campaign for? Define segments and market." },
  { id: "channels_creative", label: "Channels & Creative", title: "Channels & Creative Direction", description: "Choose platforms, voice, and creator criteria." },
  { id: "budget_metrics", label: "Budget & Metrics", title: "Budget & Success Metrics", description: "Set budget range and define what success looks like." },
  { id: "guardrails_approvals", label: "Guardrails", title: "Guardrails & Approvals", description: "Set boundaries, forbidden claims, and approval requirements." },
  { id: "review_run", label: "Review & Run", title: "Review & Launch", description: "Review your brief and run the agent." },
];

const channelOptions = [
  "TikTok",
  "Instagram",
  "YouTube Shorts",
  "Twitch",
  "LinkedIn",
  "Retail Media",
] as const;

function validateStep(step: WizardStep, brief: CampaignBriefDraft): string[] {
  const errors: string[] = [];
  switch (step) {
    case "context_sources":
      break;
    case "brand_goal":
      if (!brief.brandName.trim()) errors.push("brandName");
      if (!brief.productOrService.trim()) errors.push("productOrService");
      if (brief.campaignGoal.trim().length < 20) errors.push("campaignGoal");
      if (!brief.market.trim()) errors.push("market");
      break;
    case "audience":
      if (brief.targetAudience.trim().length < 10) errors.push("targetAudience");
      if (brief.audienceSegments.filter(Boolean).length === 0) errors.push("audienceSegments");
      break;
    case "channels_creative":
      if (brief.channels.length === 0) errors.push("channels");
      if (brief.brandVoice.trim().length < 2) errors.push("brandVoice");
      if (brief.creatorCriteria.trim().length < 10) errors.push("creatorCriteria");
      break;
    case "budget_metrics":
      if (!brief.budgetRange.trim()) errors.push("budgetRange");
      if (brief.successMetrics.filter(Boolean).length === 0) errors.push("successMetrics");
      if (brief.mandatoryMessages.filter(Boolean).length === 0) errors.push("mandatoryMessages");
      break;
    case "guardrails_approvals":
      if (brief.approvalRequirements.trim().length < 10) errors.push("approvalRequirements");
      break;
    case "review_run":
      break;
  }
  return errors;
}

function getStepErrors(step: WizardStep, brief: CampaignBriefDraft): string[] {
  return validateStep(step, brief);
}

function findFirstErrorStep(brief: CampaignBriefDraft): number {
  for (let i = 0; i < wizardSteps.length; i++) {
    const step = wizardSteps[i];
    if (step && step.id !== "context_sources" && step.id !== "review_run" && validateStep(step.id, brief).length > 0) {
      return i;
    }
  }
  return -1;
}

export function CampaignWizard({
  project,
  onSaveBrief,
  onUpdateContextSources,
  onUpdateContextFiles,
  onUpdateContextNotes,
  onComplete,
  onSkipToAgent,
}: {
  project: CampaignProject;
  onSaveBrief: (brief: CampaignBriefDraft) => void;
  onUpdateContextSources: (sources: string[]) => void;
  onUpdateContextFiles: (files: ContextFile[]) => void;
  onUpdateContextNotes: (notes: string) => void;
  onComplete: () => void;
  onSkipToAgent: () => void;
}) {
  const brief = project.brief;
  const [currentStepIndex, setCurrentStepIndex] = useState(
    wizardSteps.findIndex((s) => s.id === project.wizardStep) >= 0
      ? wizardSteps.findIndex((s) => s.id === project.wizardStep)
      : 0
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(project.templateId);
  const [touched, setTouched] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStep = wizardSteps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === wizardSteps.length - 1;
  const parsedBrief = CampaignBriefSchema.safeParse(brief);

  const currentStepErrors = useMemo(
    () => getStepErrors(currentStep.id, brief),
    [currentStep.id, brief]
  );

  function patchBrief(patch: Partial<CampaignBriefDraft>) {
    onSaveBrief({ ...brief, ...patch });
  }

  function handleNext() {
    if (isLast) {
      if (!parsedBrief.success) {
        setTouched(true);
        const errorStep = findFirstErrorStep(brief);
        if (errorStep >= 0) {
          setCurrentStepIndex(errorStep);
        }
        return;
      }
      onComplete();
      return;
    }

    const stepErrors = getStepErrors(currentStep.id, brief);
    if (stepErrors.length > 0) {
      setTouched(true);
      return;
    }

    setCurrentStepIndex((i) => Math.min(i + 1, wizardSteps.length - 1));
  }

  function handleBack() {
    setCurrentStepIndex((i) => Math.max(i - 1, 0));
  }

  function applyTemplate(templateId: string) {
    const template = campaignTemplates.find((t) => t.id === templateId);
    if (!template) return;
    setSelectedTemplate(templateId);
    onSaveBrief({ ...template.brief, brandName: brief.brandName });
  }

  function clearTemplate() {
    setSelectedTemplate(null);
  }

  function addSourceUrl() {
    if (!newSourceUrl.trim()) return;
    const url = newSourceUrl.trim().startsWith("http") ? newSourceUrl.trim() : `https://${newSourceUrl.trim()}`;
    onUpdateContextSources([...project.contextSources, url]);
    setNewSourceUrl("");
  }

  function removeSourceUrl(index: number) {
    onUpdateContextSources(project.contextSources.filter((_, i) => i !== index));
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        const contextFile: ContextFile = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result as string,
        };
        onUpdateContextFiles([...project.contextFiles, contextFile]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(id: string) {
    onUpdateContextFiles(project.contextFiles.filter((f) => f.id !== id));
  }

  function getStepState(index: number): string {
    const step = wizardSteps[index];
    if (!step) return "";
    const errors = getStepErrors(step.id, brief);
    const hasErrors = errors.length > 0;

    if (index === currentStepIndex) {
      if (touched && hasErrors) return "has-error";
      return "active";
    }
    if (index < currentStepIndex) {
      if (touched && hasErrors) return "has-error";
      return "completed";
    }
    if (touched && hasErrors) return "has-error";
    return "";
  }

  function isFieldError(fieldName: string): boolean {
    if (!touched) return false;
    return currentStepErrors.includes(fieldName);
  }

  return (
    <div className="wizard-container">
      <div className="wizard-progress">
        {wizardSteps.map((step, index) => {
          const state = getStepState(index);
          return (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <div className={`wizard-progress-step ${state}`}>
                <div className="wizard-progress-dot">
                  {state === "completed" ? (
                    <Check size={12} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index === currentStepIndex && (
                  <span className="hidden md:inline text-xs font-medium">{step.label}</span>
                )}
              </div>
              {index < wizardSteps.length - 1 && (
                <div className={`wizard-progress-line ${state === "completed" ? "completed" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="wizard-step-content" key={currentStep.id}>
        <h2 className="wizard-step-title">{currentStep.title}</h2>
        <p className="wizard-step-desc">{currentStep.description}</p>

        {currentStep.id === "context_sources" && (
          <div className="space-y-6">
            <div>
              <Field label="Research URLs">
                <div className="flex gap-2 mb-3">
                  <input
                    className="form-input"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSourceUrl(); } }}
                    placeholder="https://example.com/research"
                  />
                  <Button variant="secondary" type="button" onClick={addSourceUrl}>
                    <Link size={14} />
                    Add
                  </Button>
                </div>
                {project.contextSources.length > 0 && (
                  <div className="space-y-2">
                    {project.contextSources.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 border border-black/12 rounded-md text-sm">
                        <Link size={14} className="text-black/40 shrink-0" />
                        <span className="flex-1 truncate mono text-xs">{url}</span>
                        <button type="button" onClick={() => removeSourceUrl(i)} className="text-black/40 hover:text-black/70">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="form-hint mt-2">Add websites for the AI agent to research during campaign planning.</div>
              </Field>
            </div>

            <div>
              <Field label="Upload documents">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 w-full p-4 border-2 border-dashed border-black/12 rounded-lg hover:border-[var(--accent)] transition-colors text-sm text-black/50"
                >
                  <Upload size={18} />
                  <span>Drop files or click to upload (PDF, DOC, TXT, MD, CSV - max 5MB each)</span>
                </button>
                {project.contextFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {project.contextFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 p-2 border border-black/12 rounded-md text-sm">
                        <FileText size={14} className="text-black/40 shrink-0" />
                        <span className="flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-black/40">{(file.size / 1024).toFixed(0)}KB</span>
                        <button type="button" onClick={() => removeFile(file.id)} className="text-black/40 hover:text-black/70">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            </div>

            <div>
              <Field label="Context notes for AI">
                <textarea
                  className="form-textarea"
                  value={project.contextNotes}
                  onChange={(e) => onUpdateContextNotes(e.target.value)}
                  placeholder="Any additional context, instructions, or background information for the AI agent..."
                  rows={5}
                />
                <div className="form-hint mt-2">Free-form text that the AI agent will use as context when planning your campaign.</div>
              </Field>
            </div>
          </div>
        )}

        {currentStep.id === "brand_goal" && (
          <div className="space-y-4">
            {project.runs.length === 0 && !project.wizardCompleted && (
              <div className="mb-6">
                <div className="form-label mb-3">Start from a template (optional)</div>
                <div className="template-grid">
                  {campaignTemplates.map((template) => (
                    <button
                      className={`template-card ${selectedTemplate === template.id ? "selected" : ""}`}
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="template-card-name">{template.name}</div>
                      <div className="template-card-desc">{template.description}</div>
                    </button>
                  ))}
                  {selectedTemplate && (
                    <button
                      className="template-card"
                      type="button"
                      onClick={clearTemplate}
                    >
                      <div className="template-card-name">Blank campaign</div>
                      <div className="template-card-desc">Start from scratch without a template.</div>
                    </button>
                  )}
                </div>
              </div>
            )}

            <Field label="Brand name" hasError={isFieldError("brandName")}>
              <input
                className={`form-input ${isFieldError("brandName") ? "field-error" : ""}`}
                value={brief.brandName}
                onChange={(e) => patchBrief({ brandName: e.target.value })}
                placeholder="Your brand name"
              />
            </Field>

            <Field label="Product or service" hasError={isFieldError("productOrService")}>
              <input
                className={`form-input ${isFieldError("productOrService") ? "field-error" : ""}`}
                value={brief.productOrService}
                onChange={(e) => patchBrief({ productOrService: e.target.value })}
                placeholder="Product, offer, or service"
              />
            </Field>

            <Field label="Campaign goal" hasError={isFieldError("campaignGoal")}>
              <textarea
                className={`form-textarea ${isFieldError("campaignGoal") ? "field-error" : ""}`}
                value={brief.campaignGoal}
                onChange={(e) => patchBrief({ campaignGoal: e.target.value })}
                placeholder="What should this campaign accomplish? (min 20 characters)"
                rows={3}
              />
            </Field>

            <Field label="Market" hasError={isFieldError("market")}>
              <input
                className={`form-input ${isFieldError("market") ? "field-error" : ""}`}
                value={brief.market}
                onChange={(e) => patchBrief({ market: e.target.value })}
                placeholder="United States, Brazil, Global"
              />
            </Field>

            <Field label="Timeline (weeks)">
              <select
                className="form-select"
                value={brief.timelineWeeks}
                onChange={(e) => patchBrief({ timelineWeeks: Number(e.target.value) })}
              >
                {[2, 3, 4, 5, 6, 7, 8].map((w) => (
                  <option key={w} value={w}>{w} weeks</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {currentStep.id === "audience" && (
          <div className="space-y-4">
            <Field label="Target audience" hasError={isFieldError("targetAudience")}>
              <textarea
                className={`form-textarea ${isFieldError("targetAudience") ? "field-error" : ""}`}
                value={brief.targetAudience}
                onChange={(e) => patchBrief({ targetAudience: e.target.value })}
                placeholder="Who is this campaign for? (min 10 characters)"
                rows={3}
              />
            </Field>

            <Field label="Audience segments" hasError={isFieldError("audienceSegments")}>
              <textarea
                className={`form-textarea ${isFieldError("audienceSegments") ? "field-error" : ""}`}
                value={brief.audienceSegments.join("\n")}
                onChange={(e) => patchBrief({ audienceSegments: parseList(e.target.value) })}
                placeholder={"One segment per line\nExample: Gen Z students"}
                rows={4}
              />
            </Field>

            <Field label="Competitors">
              <textarea
                className="form-textarea"
                value={brief.competitors.join("\n")}
                onChange={(e) => patchBrief({ competitors: parseList(e.target.value) })}
                placeholder="One competitor per line"
                rows={3}
              />
            </Field>
          </div>
        )}

        {currentStep.id === "channels_creative" && (
          <div className="space-y-4">
            <Field label="Platforms" hasError={isFieldError("channels")}>
              <div className="form-tags">
                {channelOptions.map((channel) => (
                  <label className="form-tag" key={channel}>
                    <input
                      type="checkbox"
                      checked={brief.channels.includes(channel)}
                      onChange={(e) => {
                        patchBrief({
                          channels: e.target.checked
                            ? [...brief.channels, channel]
                            : brief.channels.filter((c) => c !== channel),
                        });
                      }}
                    />
                    <span>{channel}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Brand voice" hasError={isFieldError("brandVoice")}>
              <input
                className={`form-input ${isFieldError("brandVoice") ? "field-error" : ""}`}
                value={brief.brandVoice}
                onChange={(e) => patchBrief({ brandVoice: e.target.value })}
                placeholder="Confident, direct, playful"
              />
            </Field>

            <Field label="Creator criteria" hasError={isFieldError("creatorCriteria")}>
              <textarea
                className={`form-textarea ${isFieldError("creatorCriteria") ? "field-error" : ""}`}
                value={brief.creatorCriteria}
                onChange={(e) => patchBrief({ creatorCriteria: e.target.value })}
                placeholder="Creator niches, trust signals, follower range, risk constraints (min 10 characters)"
                rows={3}
              />
            </Field>

            <Field label="Knowledge notes">
              <textarea
                className="form-textarea"
                value={brief.knowledgeNotes}
                onChange={(e) => patchBrief({ knowledgeNotes: e.target.value })}
                placeholder="Optional brand context, past campaign notes, audience insights"
                rows={3}
              />
            </Field>
          </div>
        )}

        {currentStep.id === "budget_metrics" && (
          <div className="space-y-4">
            <Field label="Budget range" hasError={isFieldError("budgetRange")}>
              <input
                className={`form-input ${isFieldError("budgetRange") ? "field-error" : ""}`}
                value={brief.budgetRange}
                onChange={(e) => patchBrief({ budgetRange: e.target.value })}
                placeholder="$40k-$60k"
              />
            </Field>

            <Field label="Success metrics" hasError={isFieldError("successMetrics")}>
              <textarea
                className={`form-textarea ${isFieldError("successMetrics") ? "field-error" : ""}`}
                value={brief.successMetrics.join("\n")}
                onChange={(e) => patchBrief({ successMetrics: parseList(e.target.value) })}
                placeholder={"One metric per line\nExample: Qualified site visits"}
                rows={4}
              />
            </Field>

            <Field label="Mandatory messages" hasError={isFieldError("mandatoryMessages")}>
              <textarea
                className={`form-textarea ${isFieldError("mandatoryMessages") ? "field-error" : ""}`}
                value={brief.mandatoryMessages.join("\n")}
                onChange={(e) => patchBrief({ mandatoryMessages: parseList(e.target.value) })}
                placeholder={"One required message per line\nExample: Zero sugar, no crash"}
                rows={4}
              />
            </Field>
          </div>
        )}

        {currentStep.id === "guardrails_approvals" && (
          <div className="space-y-4">
            <Field label="Forbidden claims">
              <textarea
                className="form-textarea"
                value={brief.forbiddenClaims.join("\n")}
                onChange={(e) => patchBrief({ forbiddenClaims: parseList(e.target.value) })}
                placeholder="Claims the agent must avoid"
                rows={3}
              />
            </Field>

            <Field label="Approval requirements" hasError={isFieldError("approvalRequirements")}>
              <textarea
                className={`form-textarea ${isFieldError("approvalRequirements") ? "field-error" : ""}`}
                value={brief.approvalRequirements}
                onChange={(e) => patchBrief({ approvalRequirements: e.target.value })}
                placeholder="Legal, brand, creator, or claims approval rules (min 10 characters)"
                rows={3}
              />
            </Field>

            <Field label="Other constraints">
              <textarea
                className="form-textarea"
                value={brief.constraints}
                onChange={(e) => patchBrief({ constraints: e.target.value })}
                placeholder="Timing, legal, creative, or channel constraints"
                rows={3}
              />
            </Field>
          </div>
        )}

        {currentStep.id === "review_run" && (
          <div className="space-y-4">
            <div className="border border-black/12 rounded-lg p-4 space-y-3">
              <ReviewRow label="Context" value={`${project.contextSources.length} URLs, ${project.contextFiles.length} files`} />
              <ReviewRow label="Brand" value={brief.brandName} />
              <ReviewRow label="Product" value={brief.productOrService} />
              <ReviewRow label="Goal" value={brief.campaignGoal} />
              <ReviewRow label="Audience" value={brief.targetAudience} />
              <ReviewRow label="Segments" value={brief.audienceSegments.join(", ")} />
              <ReviewRow label="Market" value={brief.market} />
              <ReviewRow label="Channels" value={brief.channels.join(", ")} />
              <ReviewRow label="Budget" value={brief.budgetRange} />
              <ReviewRow label="Voice" value={brief.brandVoice} />
              <ReviewRow label="Metrics" value={brief.successMetrics.join(", ")} />
              <ReviewRow label="Messages" value={brief.mandatoryMessages.join(", ")} />
              <ReviewRow label="Forbidden" value={brief.forbiddenClaims.join(", ") || "None"} />
              <ReviewRow label="Approvals" value={brief.approvalRequirements} />
            </div>
          </div>
        )}
      </div>

      <div className="wizard-actions">
        <Button
          variant="secondary"
          type="button"
          onClick={handleBack}
          disabled={isFirst}
        >
          <ChevronLeft size={14} />
          Back
        </Button>

        <div className="flex gap-2">
          {project.wizardCompleted && (
            <Button variant="secondary" type="button" onClick={onSkipToAgent}>
              Skip to Agent
            </Button>
          )}
          <Button type="button" onClick={handleNext}>
            {isLast ? (
              <>
                <Play size={14} />
                Run Agent
              </>
            ) : (
              <>
                Continue
                <ChevronRight size={14} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, hasError }: { label: string; children: React.ReactNode; hasError?: boolean }) {
  return (
    <label className={`form-group ${hasError ? "has-error" : ""}`}>
      <span className="form-label">{label}</span>
      {children}
    </label>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-24 shrink-0 text-black/40 font-mono text-xs uppercase tracking-wider pt-0.5">{label}</span>
      <span className={value ? "text-black" : "text-black/30"}>{value || "Not set"}</span>
    </div>
  );
}

function parseList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}
