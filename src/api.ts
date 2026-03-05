const BASE = import.meta.env.VITE_API_URL || "";

export interface Experiment {
  name: string;
  description: string;
  started_at: string;
  initial_nba: number;
  initial_lottery: number;
  initial_superodds: number;
}

export interface NBABet {
  id: number;
  game_date: string;
  team_a: string;
  team_b: string;
  bet_type: string;
  bet_pick: string;
  confidence: number;
  odds: number;
  bet_amount: number;
  result: string;
  profit_loss: number;
  actual_score: string | null;
  prop_type: string | null;
  player_name: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface BankrollPoint {
  date: string;
  balance: number;
  pnl: number;
  cumulative_pnl: number;
}

export interface NBAData {
  current_bankroll: number;
  total_pnl: number;
  total_wagered: number;
  roi_pct: number;
  total_bets: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  win_rate: number;
  streak: string;
  bets: NBABet[];
  bankroll_history: BankrollPoint[];
}

export interface LotteryPrediction {
  id: number;
  lottery_key: string;
  predicted_numbers: number[];
  confidence: string;
  target_concurso: number | null;
  cost_usd: number;
  actual_numbers: number[] | null;
  matches: number | null;
  total_numbers: number;
  hit_rate: number | null;
  espelho_matches: number | null;
  used_espelho: boolean;
  prize_brl: number | null;
  prize_usd: number | null;
  prize_tier: string | null;
  late_prediction: boolean;
  draw_date: string;
  created_at: string;
  resolved_at: string | null;
}

export interface LotteryData {
  current_bankroll: number;
  total_cost_usd: number;
  total_prize_usd: number;
  total_pnl: number;
  total_wins: number;
  total_predictions: number;
  total_resolved: number;
  avg_matches: number;
  best_match: {
    lottery_key: string;
    matches: number;
    predicted: number[];
    actual: number[];
  } | null;
  predictions: LotteryPrediction[];
}

export interface AuditChain {
  valid: boolean;
  entries: number;
  last_hash?: string;
  broken_at?: number;
}

export interface AuditEntryData {
  id: number;
  chain: string;
  sequence: number;
  event_type: string;
  entry_hash: string;
  prev_hash: string;
  data_hash: string;
  git_sha: string | null;
  created_at: string;
}

export interface AuditData {
  nba_chain: AuditChain;
  lottery_chain: AuditChain;
  superodds_chain: AuditChain;
  total_entries: number;
  github_repo: string | null;
  recent_entries: AuditEntryData[];
}

export interface SuperOddsLeg {
  team_a: string;
  team_b: string;
  domain: string;
  league: string | null;
  bet_pick: string;
  odds: number;
  bookmaker: string | null;
  result: string;
}

export interface SuperOddsParlay {
  id: number;
  parlay_id: string;
  tier: string;
  game_date: string;
  legs: SuperOddsLeg[];
  combined_odds: number;
  bet_amount: number;
  confidence: number;
  result: string;
  profit_loss: number;
  created_at: string;
  resolved_at: string | null;
}

export interface SuperOddsData {
  current_bankroll: number;
  total_pnl: number;
  total_wagered: number;
  roi_pct: number;
  total_parlays: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  win_rate: number;
  parlays: SuperOddsParlay[];
  bankroll_history: BankrollPoint[];
}

export interface LedgerData {
  experiment: Experiment;
  nba: NBAData;
  lottery: LotteryData;
  superodds: SuperOddsData;
  audit: AuditData;
}

export interface WorkerResult {
  lottery_key: string;
  concurso: number;
  worker_name: string;
  suggested_count: number;
  hit_count: number;
  hit_rate: number;
  baseline_rate: number;
  rating: string;
  hits: string[];
  reasoning: string[];
  analyzed_at: string;
}

export interface JogoResult {
  lottery_key: string;
  concurso: number;
  jogo_number: number;
  jogo_style: string;
  predicted_numbers: string[];
  actual_numbers: string[];
  hit_count: number;
  total_numbers: number;
  hit_rate: number;
  worker_contributions: Record<string, { count: number; hit_count: number; hit_rate: number }>;
}

export interface WorkerSummary {
  worker_name: string;
  total_suggested: number;
  total_hits: number;
  avg_hit_rate: number;
  concursos: number;
  latest_rating: string;
}

export interface WorkerAuditData {
  worker_details: WorkerResult[];
  jogo_details: JogoResult[];
  worker_summary: WorkerSummary[];
  total_records: number;
}

export async function fetchLedger(): Promise<LedgerData> {
  const res = await fetch(`${BASE}/api/public/ledger`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchWorkerAudit(): Promise<WorkerAuditData> {
  const res = await fetch(`${BASE}/api/public/audit/workers`);
  if (!res.ok) throw new Error(`Worker audit error: ${res.status}`);
  return res.json();
}

export async function verifyChain(chain: string): Promise<AuditChain> {
  const res = await fetch(`${BASE}/api/public/audit/verify?chain=${chain}`);
  if (!res.ok) throw new Error(`Verify error: ${res.status}`);
  return res.json();
}
