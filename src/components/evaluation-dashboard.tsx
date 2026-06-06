"use client";

import { ArrowDown, ArrowRight, ArrowUp, Download, Filter, Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { EvaluationResult } from "@/lib/schemas";

export function EvaluationDashboard() {
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvaluations() {
      try {
        const response = await fetch("/api/evaluations");
        const payload = (await response.json()) as {
          ok: boolean;
          results?: EvaluationResult[];
          error?: string;
        };

        if (!payload.ok || !payload.results) {
          throw new Error(payload.error ?? "Unable to load evaluations.");
        }

        setResults(payload.results);
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : "Unable to load evaluations.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadEvaluations();
  }, []);

  const summary = useMemo(() => {
    if (results.length === 0) {
      return {
        toolSuccessRate: 0,
        guardrailPassRate: 0,
        responseQuality: 0,
        averageLatencyMs: 0,
        estimatedCostUsd: 0,
      };
    }

    return {
      toolSuccessRate: average(results.map((result) => result.metrics.toolSuccessRate)),
      guardrailPassRate: average(results.map((result) => result.metrics.guardrailPassRate)),
      responseQuality: average(results.map((result) => result.metrics.responseQuality)),
      averageLatencyMs: average(results.map((result) => result.metrics.averageLatencyMs)),
      estimatedCostUsd:
        results.reduce((total, result) => total + result.metrics.estimatedCostUsd, 0) /
        results.length,
    };
  }, [results]);

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Evaluations</h1>
          <div className="page-subtitle">
            Agent performance metrics across deterministic portfolio scenarios
          </div>
        </div>
        <div className="header-actions">
          <Button size="sm" variant="secondary" type="button">
            <Download size={12} />
            Export CSV
          </Button>
          <Button size="sm" type="button">
            <Plus size={12} />
            Run Eval Suite
          </Button>
        </div>
      </div>

      {error ? <div className="notice notice-danger">{error}</div> : null}

      <div className="metrics">
        <MetricCard
          barColor="var(--success)"
          delta="+2.4%"
          deltaKind="up"
          label="Tool Success Rate"
          value={`${Math.round(summary.toolSuccessRate * 100)}%`}
          width={summary.toolSuccessRate}
        />
        <MetricCard
          barColor="var(--success)"
          delta="+1.1%"
          deltaKind="up"
          label="Guardrail Pass Rate"
          value={`${Math.round(summary.guardrailPassRate * 100)}%`}
          width={summary.guardrailPassRate}
        />
        <MetricCard
          barColor="var(--accent)"
          delta="+0.3"
          deltaKind="up"
          label="Response Quality"
          value={`${(summary.responseQuality * 5).toFixed(1)}/5`}
          width={summary.responseQuality}
        />
        <MetricCard
          barColor="var(--warn)"
          delta="-0.4s"
          deltaKind="down"
          label="Avg Latency"
          value={`${(summary.averageLatencyMs / 1000).toFixed(2)}s`}
          width={Math.min(summary.averageLatencyMs / 1000 / 5, 1)}
        />
        <MetricCard
          barColor="var(--info)"
          delta="flat"
          deltaKind="neutral"
          label="Est. Cost / Run"
          value={`$${summary.estimatedCostUsd.toFixed(3)}`}
          width={Math.min(summary.estimatedCostUsd / 0.05, 1)}
        />
      </div>

      <section className="section">
        <div className="section-heading-row">
          <div className="flex items-center gap-3">
            <h2 className="section-heading">Evaluation Scenarios</h2>
            <span className="section-count">{results.length} scenarios</span>
          </div>
          <Button size="sm" variant="secondary" type="button">
            <Filter size={12} />
            Filter
          </Button>
        </div>

        {isLoading ? (
          <div className="loading-block">
            <Loader2 className="spin" size={24} />
          </div>
        ) : (
          <div className="scenarios">
            {results.map((result) => (
              <ScenarioCard key={result.id} result={result} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  delta,
  deltaKind,
  width,
  barColor,
}: {
  label: string;
  value: string;
  delta: string;
  deltaKind: "up" | "down" | "neutral";
  width: number;
  barColor: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-delta ${deltaKind}`}>
        {deltaKind === "up" ? <ArrowUp size={10} /> : deltaKind === "down" ? <ArrowDown size={10} /> : <ArrowRight size={10} />}
        {delta}
      </div>
      <div className="metric-bar">
        <div
          className="metric-bar-fill"
          style={{ width: `${Math.round(width * 100)}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

function ScenarioCard({ result }: { result: EvaluationResult }) {
  const statusClass =
    result.status === "pass" ? "pass" : result.status === "warn" ? "partial" : "fail";

  return (
    <article className="scenario-card">
      <div className="scenario-head">
        <span className="scenario-name">{result.name}</span>
        <span className={`scenario-badge ${statusClass}`}>{result.status}</span>
      </div>
      <div className="scenario-body">
        <div className="scenario-desc">{result.inputSummary}</div>
        <div className="scenario-metrics">
          <ScenarioMetric
            label="Success Rate"
            value={`${Math.round(result.metrics.toolSuccessRate * 100)}%`}
          />
          <ScenarioMetric
            label="Avg Latency"
            value={`${(result.metrics.averageLatencyMs / 1000).toFixed(2)}s`}
          />
          <ScenarioMetric label="Checks" value={String(result.checks.length)} />
          <ScenarioMetric label="Cost" value={`$${result.metrics.estimatedCostUsd.toFixed(3)}`} />
        </div>
      </div>
      <div className="scenario-foot">
        <span className="scenario-time">
          Guardrails {Math.round(result.metrics.guardrailPassRate * 100)}%
        </span>
        <a className="scenario-link" href={`/evaluations#${result.id}`}>
          View traces →
        </a>
      </div>
    </article>
  );
}

function ScenarioMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="scenario-metric-label">{label}</div>
      <div className="scenario-metric-value">{value}</div>
    </div>
  );
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}
