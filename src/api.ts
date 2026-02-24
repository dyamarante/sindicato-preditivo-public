const BASE = import.meta.env.VITE_API_URL || "";

export interface Experiment {
  name: string;
  description: string;
  started_at: string;
  initial_nba: number;
  initial_lottery: number;
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
  actual_numbers: number[] | null;
  matches: number | null;
  draw_date: string;
  created_at: string;
  resolved_at: string | null;
}

export interface LotteryData {
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
  total_entries: number;
  github_repo: string | null;
  recent_entries: AuditEntryData[];
}

export interface LedgerData {
  experiment: Experiment;
  nba: NBAData;
  lottery: LotteryData;
  audit: AuditData;
}

export async function fetchLedger(): Promise<LedgerData> {
  const res = await fetch(`${BASE}/api/public/ledger`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function verifyChain(chain: string): Promise<AuditChain> {
  const res = await fetch(`${BASE}/api/public/audit/verify?chain=${chain}`);
  if (!res.ok) throw new Error(`Verify error: ${res.status}`);
  return res.json();
}
