import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  fetchLedger,
  type LedgerData,
  type NBABet,
  type LotteryPrediction,
  type AuditData,
  type BankrollPoint,
  type SuperOddsData,
} from "./api";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const cls = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const RESULT_COLORS: Record<string, string> = {
  win: "text-emerald-400",
  loss: "text-rose-400",
  push: "text-yellow-400",
  pending: "text-gray-500",
};

const LOTTERY_LABELS: Record<string, string> = {
  "mega-sena": "Mega-Sena",
  quina: "Quina",
  lotofacil: "Lotofacil",
  lotomania: "Lotomania",
  "dupla-sena": "Dupla Sena",
  "dia-de-sorte": "Dia de Sorte",
  "super-sete": "Super Sete",
  timemania: "Timemania",
  powerball: "Powerball",
  "mega-millions": "Mega Millions",
  euromillions: "EuroMillions",
};

/** Parse "DD/MM/YYYY" → Date or null */
function parseBrDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1]);
}

/** Format ISO datetime string to DD/MM/YYYY */
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function Hero({ name, started }: { name: string; started: string }) {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{name}</h1>
          <p className="text-sm text-gray-500">
            Experimento publico de IA preditiva &middot; Inicio: {started}
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full border border-emerald-800 text-emerald-400 bg-emerald-950/40 w-fit">
          Hash Chain Auditavel
        </span>
      </div>
    </header>
  );
}

/* --- Bankroll Cards --- */

function StatCard({
  label,
  accent,
  bankroll,
  initial,
  pnl,
  extra,
}: {
  label: string;
  accent: string;
  bankroll: number;
  initial: number;
  pnl: number;
  extra: React.ReactNode;
}) {
  const roiVal = ((bankroll - initial) / initial) * 100;
  const up = pnl >= 0;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex-1 min-w-[260px]">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full ${accent}`} />
        <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-end gap-3 mb-1">
        <span className="text-3xl font-bold tabular-nums">{fmt(bankroll)}</span>
        <span className={cls("text-sm font-medium", up ? "text-emerald-400" : "text-rose-400")}>
          {up ? "+" : ""}
          {fmt(pnl)} ({pct(roiVal)})
        </span>
      </div>
      <div className="text-xs text-gray-600 mb-3">Capital inicial: {fmt(initial)}</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">{extra}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <>
      <span className="text-gray-500">{label}</span>
      <span className="text-white font-medium text-right tabular-nums">{value}</span>
    </>
  );
}

/* --- Chart --- */

function PnLChart({ data, initial }: { data: BankrollPoint[]; initial: number }) {
  if (data.length < 2) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-600 text-sm">
        Grafico disponivel apos 2+ dias de operacao
      </div>
    );
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 px-1">Evolucao do Bankroll NBA</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#999" }}
            formatter={(v: number) => [fmt(v), "Saldo"]}
          />
          <ReferenceLine y={initial} stroke="#444" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="balance" stroke="#10b981" fill="url(#grad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* --- Tab Bar --- */

type Tab = "nba" | "superodds" | "lottery" | "audit";

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "nba", label: "NBA" },
    { key: "superodds", label: "Super Odds" },
    { key: "lottery", label: "Loterias" },
    { key: "audit", label: "Auditoria" },
  ];
  return (
    <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cls(
            "flex-1 px-4 py-2 text-sm rounded-lg transition font-medium",
            tab === t.key ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* --- Pagination Controls --- */

const PAGE_SIZE = 100;

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
      <span className="text-xs text-gray-500">
        Pagina {page + 1} de {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className={cls(
            "px-3 py-1.5 text-xs rounded-lg transition font-medium",
            page === 0 ? "bg-gray-800/50 text-gray-700 cursor-not-allowed" : "bg-gray-800 text-gray-300 hover:bg-gray-700",
          )}
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className={cls(
            "px-3 py-1.5 text-xs rounded-lg transition font-medium",
            page >= totalPages - 1 ? "bg-gray-800/50 text-gray-700 cursor-not-allowed" : "bg-gray-800 text-gray-300 hover:bg-gray-700",
          )}
        >
          Proxima
        </button>
      </div>
    </div>
  );
}

/* --- NBA Table --- */

function NBATable({ bets }: { bets: NBABet[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(bets.length / PAGE_SIZE));
  const pageBets = bets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (bets.length === 0) {
    return <Empty text="Nenhuma aposta registrada ainda" />;
  }
  return (
    <div>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-900 z-[1]">
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
              <th className="text-left py-2 px-3">Data</th>
              <th className="text-left py-2 px-3">Jogo</th>
              <th className="text-left py-2 px-3">Tipo</th>
              <th className="text-left py-2 px-3">Pick</th>
              <th className="text-right py-2 px-3">Odds</th>
              <th className="text-right py-2 px-3">Valor</th>
              <th className="text-right py-2 px-3">Confianca</th>
              <th className="text-center py-2 px-3">Resultado</th>
              <th className="text-right py-2 px-3">P&L</th>
            </tr>
          </thead>
          <tbody>
            {pageBets.map((b) => (
              <tr key={b.id} className="border-b border-gray-900 hover:bg-gray-900/50 transition">
                <td className="py-2.5 px-3 text-gray-400 tabular-nums whitespace-nowrap">{b.game_date}</td>
                <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                  {b.team_a} @ {b.team_b}
                </td>
                <td className="py-2.5 px-3 text-gray-400">
                  {b.bet_type}
                  {b.prop_type ? ` (${b.prop_type})` : ""}
                </td>
                <td className="py-2.5 px-3 font-medium">
                  {b.player_name || b.bet_pick}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-gray-300">{b.odds.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{fmt(b.bet_amount)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-gray-400">{b.confidence.toFixed(0)}%</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={cls("font-semibold uppercase text-xs", RESULT_COLORS[b.result] || "text-gray-500")}>
                    {b.result}
                  </span>
                </td>
                <td
                  className={cls(
                    "py-2.5 px-3 text-right tabular-nums font-medium",
                    b.profit_loss > 0 ? "text-emerald-400" : b.profit_loss < 0 ? "text-rose-400" : "text-gray-500",
                  )}
                >
                  {b.result === "pending" ? "-" : `${b.profit_loss > 0 ? "+" : ""}${fmt(b.profit_loss)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

/* --- Lottery Table --- */

function LotteryTable({ predictions }: { predictions: LotteryPrediction[] }) {
  const [page, setPage] = useState(0);

  // Sort: by display date DESC (draw_date if resolved, else created_at), then by created_at DESC
  const sorted = [...predictions].sort((a, b) => {
    const dateA = parseBrDate(a.draw_date) ?? new Date(a.created_at);
    const dateB = parseBrDate(b.draw_date) ?? new Date(b.created_at);
    const diff = dateB.getTime() - dateA.getTime();
    if (diff !== 0) return diff;
    // Same date: sort by created_at DESC
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pagePredictions = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (sorted.length === 0) {
    return <Empty text="Nenhum palpite de loteria registrado ainda" />;
  }
  const lateCount = sorted.filter((p) => p.late_prediction).length;
  return (
    <div>
      {lateCount > 0 && (
        <div className="mx-3 mt-3 mb-1 p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-start gap-2">
          <span className="text-rose-400 text-base leading-none mt-0.5">&#9888;</span>
          <div>
            <strong>{lateCount} previsao(oes) invalidada(s)</strong> &mdash; geradas apos o sorteio ter ocorrido
            devido a falha no agendamento. Marcadas com linha vermelha por transparencia.
            Estas previsoes <strong>nao contam</strong> nas estatisticas de acerto.
          </div>
        </div>
      )}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-900 z-[1]">
          <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
            <th className="text-left py-2 px-3">Data</th>
            <th className="text-left py-2 px-3">Loteria</th>
            <th className="text-left py-2 px-3">Concurso</th>
            <th className="text-left py-2 px-3">Numeros Previstos</th>
            <th className="text-right py-2 px-3">Custo</th>
            <th className="text-left py-2 px-3">Resultado Real</th>
            <th className="text-center py-2 px-3">Acertos</th>
            <th className="text-right py-2 px-3">Premio</th>
            <th className="text-center py-2 px-3">Confianca</th>
          </tr>
        </thead>
        <tbody>
          {pagePredictions.map((p) => (
            <tr
              key={p.id}
              className={cls(
                "border-b border-gray-900 hover:bg-gray-900/50 transition",
                p.late_prediction ? "bg-rose-950/20 border-l-2 border-l-rose-500" : undefined,
                p.prize_tier && !p.late_prediction ? "bg-emerald-950/20" : undefined,
              )}
            >
              <td className="py-2.5 px-3 text-gray-400 tabular-nums whitespace-nowrap">
                <div className="flex flex-col">
                  <span className={p.late_prediction ? "line-through text-rose-400/60" : ""}>
                    {p.draw_date || fmtDate(p.created_at)}
                  </span>
                  {p.late_prediction && (
                    <span className="text-[9px] text-rose-400 font-semibold mt-0.5" title="Previsao gerada apos o sorteio ter ocorrido. Invalidada por transparencia.">
                      ATRASADA
                    </span>
                  )}
                </div>
              </td>
              <td className={cls("py-2.5 px-3 font-medium", p.late_prediction ? "line-through text-rose-400/60" : "")}>
                {LOTTERY_LABELS[p.lottery_key] || p.lottery_key}
              </td>
              <td className={cls("py-2.5 px-3 text-gray-400", p.late_prediction ? "line-through text-rose-400/60" : "")}>
                #{p.target_concurso || "-"}
              </td>
              <td className="py-2.5 px-3">
                {p.late_prediction ? (
                  <div className="relative">
                    <div className="opacity-30 line-through">
                      <NumberBalls numbers={p.predicted_numbers} highlights={p.actual_numbers} />
                    </div>
                  </div>
                ) : (
                  <NumberBalls numbers={p.predicted_numbers} highlights={p.actual_numbers} />
                )}
              </td>
              <td className={cls("py-2.5 px-3 text-right tabular-nums", p.late_prediction ? "line-through text-rose-400/60" : "text-gray-300")}>
                {fmt(p.cost_usd)}
              </td>
              <td className="py-2.5 px-3">
                {p.actual_numbers ? (
                  <NumberBalls numbers={p.actual_numbers} />
                ) : (
                  <span className="text-gray-600 text-xs">Aguardando sorteio</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-center">
                {p.late_prediction ? (
                  <span className="text-rose-500 text-[10px] font-semibold">INVALIDA</span>
                ) : p.matches !== null ? (
                  <div className="flex flex-col items-center">
                    <span
                      className={cls(
                        "font-bold tabular-nums",
                        p.prize_tier ? "text-emerald-400" : (p.hit_rate ?? 0) >= 40 ? "text-yellow-400" : "text-rose-400",
                      )}
                    >
                      {p.matches}/{p.total_numbers || p.predicted_numbers.length}
                    </span>
                    {p.hit_rate !== null && (
                      <span className={cls(
                        "text-[10px] tabular-nums",
                        p.prize_tier ? "text-emerald-500" : p.hit_rate >= 40 ? "text-yellow-500" : "text-rose-500",
                      )}>
                        {p.hit_rate}%
                      </span>
                    )}
                    {p.used_espelho && (
                      <span className="text-[9px] text-violet-400 font-medium">ESPELHO</span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-600">-</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right">
                {p.late_prediction ? (
                  <span className="text-rose-500/50 text-[10px]">-</span>
                ) : p.prize_tier ? (
                  <div className="flex flex-col items-end">
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {p.prize_usd ? fmt(p.prize_usd) : p.prize_brl ? `R$${p.prize_brl.toFixed(2)}` : "TBD"}
                    </span>
                    <span className="text-[9px] text-emerald-600 whitespace-nowrap">{p.prize_tier}</span>
                  </div>
                ) : p.resolved_at ? (
                  <span className="text-gray-700 text-xs">-</span>
                ) : (
                  <span className="text-gray-700 text-xs">-</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-center">
                {p.late_prediction ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-900/40 text-rose-400 font-medium">
                    invalida
                  </span>
                ) : (
                  <span
                    className={cls(
                      "text-xs px-2 py-0.5 rounded-full",
                      p.confidence === "alto"
                        ? "bg-emerald-900/40 text-emerald-400"
                        : p.confidence === "medio"
                          ? "bg-yellow-900/40 text-yellow-400"
                          : "bg-gray-800 text-gray-500",
                    )}
                  >
                    {p.confidence}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function NumberBalls({ numbers, highlights }: { numbers: number[]; highlights?: number[] | null }) {
  const hitSet = new Set(highlights || []);
  return (
    <div className="flex flex-wrap gap-1">
      {numbers.map((n, i) => (
        <span
          key={i}
          className={cls(
            "w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center",
            highlights && hitSet.has(n)
              ? "bg-emerald-600 text-white"
              : "bg-gray-800 text-gray-400",
          )}
        >
          {String(n).padStart(2, "0")}
        </span>
      ))}
    </div>
  );
}

/* --- Super Odds Table --- */

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: "bg-orange-900/30", text: "text-orange-300", border: "border-orange-700" },
  prata: { bg: "bg-gray-700/30", text: "text-gray-200", border: "border-gray-500" },
  ouro: { bg: "bg-yellow-900/30", text: "text-yellow-300", border: "border-yellow-600" },
};

const DOMAIN_LABELS: Record<string, string> = {
  nba: "NBA",
  football: "Futebol",
};

function SuperOddsTable({ data }: { data: SuperOddsData }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (data.parlays.length === 0) {
    return <Empty text="Nenhum parlay Super Odds registrado ainda" />;
  }

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-900 z-[1]">
          <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
            <th className="text-left py-2 px-3">Data</th>
            <th className="text-left py-2 px-3">Tier</th>
            <th className="text-center py-2 px-3">Legs</th>
            <th className="text-right py-2 px-3">Odds</th>
            <th className="text-right py-2 px-3">Valor</th>
            <th className="text-right py-2 px-3">Confianca</th>
            <th className="text-center py-2 px-3">Resultado</th>
            <th className="text-right py-2 px-3">P&L</th>
          </tr>
        </thead>
        <tbody>
          {data.parlays.map((p) => {
            const tier = TIER_COLORS[p.tier] || TIER_COLORS.bronze;
            const isOpen = expanded.has(p.parlay_id);
            return (
              <>
                <tr
                  key={p.parlay_id}
                  className="border-b border-gray-900 hover:bg-gray-900/50 transition cursor-pointer"
                  onClick={() => toggle(p.parlay_id)}
                >
                  <td className="py-2.5 px-3 text-gray-400 tabular-nums whitespace-nowrap">{p.game_date}</td>
                  <td className="py-2.5 px-3">
                    <span className={cls("text-xs px-2 py-0.5 rounded-full border font-semibold", tier.bg, tier.text, tier.border)}>
                      {p.tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums">{p.legs.length}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-amber-400">{p.combined_odds.toFixed(2)}x</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{fmt(p.bet_amount)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-400">{p.confidence.toFixed(0)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={cls("font-semibold uppercase text-xs", RESULT_COLORS[p.result] || "text-gray-500")}>
                      {p.result}
                    </span>
                  </td>
                  <td
                    className={cls(
                      "py-2.5 px-3 text-right tabular-nums font-medium",
                      p.profit_loss > 0 ? "text-emerald-400" : p.profit_loss < 0 ? "text-rose-400" : "text-gray-500",
                    )}
                  >
                    {p.result === "pending" ? "-" : `${p.profit_loss > 0 ? "+" : ""}${fmt(p.profit_loss)}`}
                  </td>
                </tr>
                {isOpen && p.legs.length > 0 && (
                  <tr key={`${p.parlay_id}-legs`} className="bg-gray-950/50">
                    <td colSpan={8} className="px-6 py-3">
                      <div className="space-y-1.5">
                        {p.legs.map((leg, i) => (
                          <div key={i} className="flex items-center gap-3 text-xs">
                            <span className={cls(
                              "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                              leg.domain === "nba" ? "bg-emerald-900/40 text-emerald-400" : "bg-blue-900/40 text-blue-400",
                            )}>
                              {DOMAIN_LABELS[leg.domain] || leg.domain}
                            </span>
                            <span className="text-gray-300 font-medium">{leg.team_a} vs {leg.team_b}</span>
                            <span className="text-gray-500">{leg.bet_pick}</span>
                            <span className="text-amber-400 tabular-nums">{leg.odds.toFixed(2)}</span>
                            {leg.bookmaker && (
                              <span className="text-gray-600 text-[10px]">{leg.bookmaker}</span>
                            )}
                            <span className={cls("font-semibold uppercase text-[10px] ml-auto", RESULT_COLORS[leg.result] || "text-gray-500")}>
                              {leg.result}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* --- Audit Section --- */

function AuditSection({ audit }: { audit: AuditData }) {
  return (
    <div className="space-y-4">
      {/* Chain status */}
      <div className="grid sm:grid-cols-3 gap-4">
        <ChainCard label="NBA Chain" chain={audit.nba_chain} />
        <ChainCard label="Super Odds Chain" chain={audit.superodds_chain} />
        <ChainCard label="Lottery Chain" chain={audit.lottery_chain} />
      </div>

      {/* Recent entries */}
      {audit.recent_entries.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Entradas Recentes</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-600 uppercase border-b border-gray-800">
                  <th className="text-left py-1.5 px-2">#</th>
                  <th className="text-left py-1.5 px-2">Chain</th>
                  <th className="text-left py-1.5 px-2">Tipo</th>
                  <th className="text-left py-1.5 px-2">Hash</th>
                  <th className="text-left py-1.5 px-2">Git</th>
                  <th className="text-left py-1.5 px-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {audit.recent_entries.map((e) => (
                  <tr key={e.id} className="border-b border-gray-900/50">
                    <td className="py-1.5 px-2 text-gray-400">{e.sequence}</td>
                    <td className="py-1.5 px-2 text-gray-300">{e.chain}</td>
                    <td className="py-1.5 px-2">
                      <span
                        className={cls(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          e.event_type === "prediction"
                            ? "bg-blue-900/40 text-blue-400"
                            : "bg-violet-900/40 text-violet-400",
                        )}
                      >
                        {e.event_type}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 font-mono text-gray-500">{e.entry_hash.slice(0, 16)}...</td>
                    <td className="py-1.5 px-2">
                      {e.git_sha ? (
                        <span className="text-emerald-500 font-mono">{e.git_sha.slice(0, 7)}</span>
                      ) : (
                        <span className="text-gray-700">-</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-gray-500 whitespace-nowrap">{e.created_at.slice(0, 19)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* How to verify */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 text-sm text-gray-500 space-y-3">
        <h4 className="font-semibold text-gray-300">Como verificar a integridade</h4>
        <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed">
          <li>
            Cada palpite e registrado <strong className="text-white">ANTES</strong> do evento com um hash SHA-256
          </li>
          <li>
            Cada hash encadeia ao anterior: <code className="text-gray-400">SHA256(prev_hash | payload)</code>
          </li>
          <li>Alterar qualquer entrada quebra todos os hashes subsequentes</li>
          <li>
            Commits no GitHub provam a data exata do registro (timestamp imutavel)
          </li>
          <li>
            Qualquer pessoa pode clonar o repositorio e re-calcular os hashes para verificacao independente
          </li>
        </ol>
        {audit.github_repo && (
          <a
            href={`https://github.com/${audit.github_repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 transition"
          >
            Ver repositorio no GitHub &rarr;
          </a>
        )}
      </div>
    </div>
  );
}

function ChainCard({ label, chain }: { label: string; chain: AuditData["nba_chain"] }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-300">{label}</span>
        {chain.valid ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 font-medium">
            Integro
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-900/40 text-rose-400 font-medium">
            Quebrado #{chain.broken_at}
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <div>Entradas: <span className="text-white">{chain.entries}</span></div>
        {chain.last_hash && (
          <div className="font-mono truncate">Ultimo hash: {chain.last_hash.slice(0, 24)}...</div>
        )}
      </div>
    </div>
  );
}

/* --- Shared --- */

function Empty({ text }: { text: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-600 text-sm">
      {text}
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-emerald-400 rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">Carregando ledger...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-rose-900 rounded-2xl p-8 max-w-md text-center space-y-3">
        <h2 className="text-lg font-bold text-rose-400">Erro ao carregar</h2>
        <p className="text-sm text-gray-400">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("nba");

  useEffect(() => {
    const load = () => {
      fetchLedger()
        .then((d) => {
          setData(d);
          setError("");
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    };
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return <Loading />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <ErrorState message="Dados indisponiveis" />;

  const { experiment, nba, lottery, superodds, audit } = data;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Hero name={experiment.name} started={experiment.started_at} />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Bankroll Cards */}
        <div className="flex flex-col sm:flex-row gap-4">
          <StatCard
            label="NBA Betting"
            accent="bg-emerald-400"
            bankroll={nba.current_bankroll}
            initial={experiment.initial_nba}
            pnl={nba.total_pnl}
            extra={
              <>
                <Stat label="Apostas" value={nba.total_bets} />
                <Stat label="Apostado" value={fmt(nba.total_wagered)} />
                <Stat label="Record" value={`${nba.wins}W ${nba.losses}L ${nba.pushes}P`} />
                <Stat label="Win Rate" value={`${nba.win_rate}%`} />
                <Stat label="Streak" value={nba.streak || "-"} />
                <Stat label="Pendentes" value={nba.pending} />
                <Stat label="ROI" value={pct(nba.roi_pct)} />
              </>
            }
          />
          <StatCard
            label="Super Odds"
            accent="bg-amber-400"
            bankroll={superodds.current_bankroll}
            initial={experiment.initial_superodds}
            pnl={superodds.total_pnl}
            extra={
              <>
                <Stat label="Parlays" value={superodds.total_parlays} />
                <Stat label="Apostado" value={fmt(superodds.total_wagered)} />
                <Stat label="Record" value={`${superodds.wins}W ${superodds.losses}L`} />
                <Stat label="Win Rate" value={`${superodds.win_rate}%`} />
                <Stat label="Pendentes" value={superodds.pending} />
                <Stat label="ROI" value={pct(superodds.roi_pct)} />
              </>
            }
          />
          <StatCard
            label="Loterias BR"
            accent="bg-violet-400"
            bankroll={lottery.current_bankroll}
            initial={experiment.initial_lottery}
            pnl={lottery.total_pnl}
            extra={
              <>
                <Stat label="Palpites" value={lottery.total_predictions} />
                <Stat label="Investido" value={fmt(lottery.total_cost_usd)} />
                <Stat label="Premios" value={fmt(lottery.total_prize_usd)} />
                <Stat label="Ganhos" value={`${lottery.total_wins} de ${lottery.total_resolved}`} />
                <Stat label="Media Acertos" value={lottery.avg_matches.toFixed(1)} />
                <Stat
                  label="Melhor"
                  value={
                    lottery.best_match
                      ? `${lottery.best_match.matches} em ${LOTTERY_LABELS[lottery.best_match.lottery_key] || lottery.best_match.lottery_key}`
                      : "-"
                  }
                />
              </>
            }
          />
        </div>

        {/* Chart */}
        <PnLChart data={nba.bankroll_history} initial={experiment.initial_nba} />

        {/* Tabs + Content */}
        <TabBar tab={tab} onChange={setTab} />
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {tab === "nba" && <NBATable bets={nba.bets} />}
          {tab === "superodds" && <SuperOddsTable data={superodds} />}
          {tab === "lottery" && <LotteryTable predictions={lottery.predictions} />}
          {tab === "audit" && <AuditSection audit={audit} />}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-700 pt-4 pb-8 space-y-1">
          <p>Analista Quântico &middot; Todos os dados são públicos e auditáveis</p>
          <p>
            Hash chain SHA-256 com {audit.total_entries} entradas verificadas
            {audit.github_repo && (
              <>
                {" "}&middot;{" "}
                <a
                  href={`https://github.com/${audit.github_repo}`}
                  className="text-gray-600 hover:text-gray-400 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </>
            )}
          </p>
        </footer>
      </main>
    </div>
  );
}
