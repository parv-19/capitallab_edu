import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import OpenAI from "openai";

import {
  LOCAL_LLM_BASE_URL,
  LOCAL_LLM_MODEL,
  DEBUG_RAG,
  GROQ_MODEL,
  LLM_MODEL,
  LLM_PROVIDER,
  OPENAI_LLM_MODEL,
  ANTHROPIC_LLM_MODEL,
  RAG_NOT_FOUND_MESSAGE,
  RAG_MIN_SCORE,
  RAG_RERANK_TOP_K,
  RAG_SIMILARITY_THRESHOLD,
  RAG_TOP_K,
  STRICT_RAG_SYSTEM_PROMPT,
} from "../config/rag";
import { DocumentChunk } from "../models/DocumentChunk.model";
import { DocumentPage } from "../models/DocumentPage.model";
import { RagChatLog } from "../models/RagChatLog.model";
import { RagUnansweredQuestion } from "../models/RagUnansweredQuestion.model";
import { createEmbedding } from "./ragEmbedding.service";

const MIN_CONTEXT_RESULTS = 8;
const MAX_CONTEXT_RESULTS = 12;
const MAX_HISTORY_MESSAGES = 10;
const NOISY_CHUNK_PATTERNS = [
  /\bthe candidate should be able to\b/i,
  /\blearning outcome statements?\b/i,
  /\banswer key\b/i,
  /\btopic quiz\b/i,
  /\bplease answer the following question\b/i,
  /\breply a, b, or c when ready\b/i,
  /\bquestions according to the provided context\b/i,
  /\bwhat are the main categories of\b/i,
];

interface RetrievedChunk {
  _id: string;
  documentId: string;
  content: string;
  score: number;
  chunkIndex?: number;
  subject?: string;
  chapterName?: string;
  pageNumber?: number;
  metadata: Record<string, any>;
}

interface SourceReference {
  documentId?: string;
  documentTitle: string;
  fileName: string;
  chapterName?: string;
  sectionTitle?: string;
  pageNumber?: number;
  chunkId?: string;
  chunkIndex?: number;
}

interface RagDebugInfo {
  retrievalQuestion: string;
  rewrittenQueries: string[];
  selectedChunkIds: string[];
  topScores: number[];
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface RagAnswerResult {
  answered: boolean;
  answer: string;
  sources: SourceReference[];
  confidenceScore: number;
  suggestedQuestions: string[];
  debug?: RagDebugInfo;
}

interface RetrievedChunkCandidate extends RetrievedChunk {
  lexicalScore?: number;
  supportScore?: number;
  exactPhraseMatch?: boolean;
}

interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RetrievalMetadataFilters {
  subject?: string;
  chapterName?: string;
}

function normalizeQuestion(question: string) {
  return question.trim().replace(/\s+/g, " ");
}

function matchesMetadataFilters(
  chunk: { subject?: string; chapterName?: string; metadata?: Record<string, any> },
  filters: RetrievalMetadataFilters,
) {
  if (filters.subject?.trim()) {
    const chunkSubject = String(chunk.subject ?? chunk.metadata?.subject ?? "").trim();
    if (chunkSubject !== filters.subject.trim()) return false;
  }
  if (filters.chapterName?.trim()) {
    const chunkChapter = String(chunk.chapterName ?? chunk.metadata?.chapterName ?? "").trim();
    if (chunkChapter !== filters.chapterName.trim()) return false;
  }
  return true;
}

function trimConversationHistory(conversationHistory: ConversationTurn[] = []): ConversationTurn[] {
  return conversationHistory
    .filter(
      (entry) =>
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string" &&
        entry.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((entry) => ({ role: entry.role, content: entry.content.trim() }));
}

function shouldUseHistoryForRetrieval(question: string): boolean {
  const normalized = question.trim().toLowerCase();
  if (/^(and|also|then|so|what about|how about|why|how|its|it|that|this|those|these)\b/.test(normalized)) return true;
  if (/^(explain this|explain that|explain more|simplify this|simple language|in simple language|give example|give an example)\b/.test(normalized)) return true;
  const keywords = extractQuestionKeywords(question);
  const looksSelfContained =
    /^(what is|what are|define|explain|describe|compare|differentiate|difference between|why does|why do|how does|how do)\b/.test(normalized) && keywords.length >= 1;
  if (looksSelfContained) return false;
  return normalized.split(/\s+/).length <= 4 && keywords.length <= 1;
}

function buildRetrievalQuestion(question: string, history: ConversationTurn[]): string {
  if (!shouldUseHistoryForRetrieval(question) || history.length === 0) return question;
  const recentUserTurns = history
    .filter((entry) => entry.role === "user")
    .slice(-2)
    .map((entry) => entry.content.trim())
    .filter(Boolean)
    .filter((entry) => normalizeText(entry) !== normalizeText(question));
  if (recentUserTurns.length === 0) return question;
  return `${recentUserTurns.slice(-1).join(" ")} ${question}`.trim();
}

// CFA / CMA abbreviation expansions — each entry tested against the normalised question
const CFA_CMA_REWRITES: Array<{ pattern: RegExp; rewrite: string }> = [
  // ── Time Value of Money ──────────────────────────────────────────────────
  { pattern: /\btvm\b|time value of money|time value money/, rewrite: "Explain Time Value of Money, present value, future value, discounting, compounding, and annuities for CFA Level 1." },
  { pattern: /\bpv\b|present value/, rewrite: "Explain present value, discounting cash flows, and the present value formula in CFA quantitative methods." },
  { pattern: /\bfv\b|future value/, rewrite: "Explain future value, compounding, and the future value formula in CFA quantitative methods." },
  { pattern: /\bear\b|effective annual rate/, rewrite: "Explain effective annual rate (EAR), its formula, and how it differs from APR and stated rate." },
  { pattern: /\bapr\b|annual percentage rate/, rewrite: "Explain annual percentage rate (APR) and how it converts to effective annual rate." },
  { pattern: /\bperpetuity\b/, rewrite: "Explain perpetuity, growing perpetuity, and their present value formulas for CFA." },
  { pattern: /\bannuity\b/, rewrite: "Explain ordinary annuity, annuity due, present value and future value of annuity formulas for CFA." },
  // ── Fixed Income ─────────────────────────────────────────────────────────
  { pattern: /\bytm\b|yield to maturity/, rewrite: "Explain yield to maturity, bond pricing, coupon rate, par value, and the YTM calculation for CFA fixed income." },
  { pattern: /\bspot rate\b|spot curve/, rewrite: "Explain spot rates, spot curve, bootstrapping, and their relationship to bond pricing in CFA fixed income." },
  { pattern: /\bforward rate\b|forward curve/, rewrite: "Explain forward rates, forward curve, and how they relate to spot rates in CFA fixed income." },
  { pattern: /\bduration\b(?! gap)/, rewrite: "Explain Macaulay duration, modified duration, effective duration, and their use in measuring interest rate sensitivity for CFA fixed income." },
  { pattern: /\bduration gap\b/, rewrite: "Explain duration gap, asset-liability management, and how banks use duration gap in risk management." },
  { pattern: /\bconvexity\b/, rewrite: "Explain convexity, its formula, and how it improves the duration approximation of bond price changes for CFA." },
  { pattern: /\bdv01\b|dollar value basis point|pvbp|price value of basis point/, rewrite: "Explain DV01 (dollar value of a basis point), PVBP, and how they measure bond price sensitivity." },
  { pattern: /\boas\b|option adjusted spread/, rewrite: "Explain option-adjusted spread (OAS), its calculation, and how it compares to Z-spread and I-spread for CFA fixed income." },
  { pattern: /\bz.?spread\b/, rewrite: "Explain Z-spread, how it is calculated relative to the benchmark spot curve, and how it compares to OAS." },
  { pattern: /\bi.?spread\b/, rewrite: "Explain I-spread (interpolated spread) and how it differs from Z-spread and OAS." },
  { pattern: /\bcredit spread\b/, rewrite: "Explain credit spread, how it reflects default risk, and its relationship to bond yields." },
  { pattern: /\byield curve\b/, rewrite: "Explain the yield curve, its shapes (normal, inverted, flat), theories (expectations, liquidity preference, market segmentation), and what each signals." },
  { pattern: /\bcoupon\b/, rewrite: "Explain coupon rate, coupon payment, bond pricing, and the relationship between coupon rate and YTM for CFA fixed income." },
  { pattern: /\bpremium bond\b|discount bond|par bond/, rewrite: "Explain premium bonds, discount bonds, and par bonds, and when a bond trades at each relative to its coupon and YTM." },
  { pattern: /\bcallable bond\b|putable bond/, rewrite: "Explain callable bonds, putable bonds, embedded options, and how they affect bond valuation and yield." },
  // ── Equity ───────────────────────────────────────────────────────────────
  { pattern: /\bcapm\b|capital asset pricing model/, rewrite: "Explain the Capital Asset Pricing Model (CAPM), its formula, assumptions, beta, market risk premium, and use in estimating required return." },
  { pattern: /\bsml\b|security market line/, rewrite: "Explain the Security Market Line (SML), its equation, slope (market risk premium), and how it identifies under/over-valued securities." },
  { pattern: /\bcml\b|capital market line/, rewrite: "Explain the Capital Market Line (CML), how it differs from the SML, and what it implies about efficient portfolios." },
  { pattern: /\bddm\b|dividend discount model|gordon growth/, rewrite: "Explain the Dividend Discount Model (DDM), the Gordon Growth Model formula, and how to estimate intrinsic value using dividends." },
  { pattern: /\bp\/e\b|price.to.earnings|pe ratio/, rewrite: "Explain the P/E ratio, trailing P/E, forward P/E, how to interpret it, and its use in equity valuation for CFA." },
  { pattern: /\bp\/b\b|price.to.book/, rewrite: "Explain the price-to-book (P/B) ratio, how it relates to ROE and required return, and when it is used in equity valuation." },
  { pattern: /\bp\/s\b|price.to.sales/, rewrite: "Explain the price-to-sales (P/S) ratio and when analysts use it over P/E in equity valuation." },
  { pattern: /\bev\b(?!a\b)|enterprise value/, rewrite: "Explain enterprise value (EV), how it is calculated (EV = Market Cap + Debt – Cash), and its use in EV/EBITDA valuation." },
  { pattern: /\bev\/ebitda\b/, rewrite: "Explain EV/EBITDA multiple, how it is used in relative valuation, and why analysts prefer it over P/E in certain situations." },
  { pattern: /\bfcff\b|free cash flow to firm/, rewrite: "Explain free cash flow to the firm (FCFF), how to calculate it from net income and CFO, and its use in DCF valuation." },
  { pattern: /\bfcfe\b|free cash flow to equity/, rewrite: "Explain free cash flow to equity (FCFE), how it differs from FCFF, and how to use it in equity valuation." },
  { pattern: /\bdcf\b|discounted cash flow/, rewrite: "Explain discounted cash flow (DCF) valuation, present value of future cash flows, and terminal value calculation." },
  { pattern: /\broe\b|return on equity/, rewrite: "Explain return on equity (ROE), its DuPont decomposition (ROE = Net Margin × Asset Turnover × Leverage), and what drives ROE changes." },
  { pattern: /\broa\b|return on assets/, rewrite: "Explain return on assets (ROA), its formula, and how it differs from ROE and ROCE for CFA financial analysis." },
  { pattern: /\beps\b|earnings per share/, rewrite: "Explain earnings per share (EPS), basic vs diluted EPS, and how dilutive securities affect the calculation." },
  { pattern: /\bsharpe ratio\b|sharpe/, rewrite: "Explain the Sharpe ratio, its formula (excess return / standard deviation), and how it measures risk-adjusted performance." },
  { pattern: /\btreynor ratio\b|treynor/, rewrite: "Explain the Treynor ratio, its formula (excess return / beta), and how it differs from the Sharpe ratio." },
  { pattern: /\bjensen.?s? alpha\b|jensen alpha/, rewrite: "Explain Jensen's alpha, its formula, and how it measures portfolio manager skill relative to CAPM." },
  { pattern: /\binformation ratio\b/, rewrite: "Explain the information ratio, its formula (active return / tracking error), and its use in evaluating active portfolio managers." },
  { pattern: /\bsortino ratio\b|sortino/, rewrite: "Explain the Sortino ratio, how it differs from Sharpe by penalising only downside volatility, and when to prefer it." },
  // ── Portfolio Management ─────────────────────────────────────────────────
  { pattern: /\beff[i]?cient frontier\b/, rewrite: "Explain the efficient frontier, minimum variance portfolio, and Markowitz mean-variance optimisation." },
  { pattern: /\bdiversification\b/, rewrite: "Explain diversification, systematic vs unsystematic risk, and how correlation affects portfolio risk reduction." },
  { pattern: /\bbeta\b/, rewrite: "Explain beta, how it is calculated (covariance / variance), what values above/below 1 mean, and its use in CAPM." },
  { pattern: /\bsystematic risk\b|market risk/, rewrite: "Explain systematic (market) risk, why it cannot be diversified away, and how beta measures it in CAPM." },
  { pattern: /\bunsystematic risk\b|idiosyncratic risk|specific risk/, rewrite: "Explain unsystematic (firm-specific) risk, how diversification eliminates it, and why only systematic risk is compensated." },
  { pattern: /\bvar\b|value at risk/, rewrite: "Explain Value at Risk (VaR), parametric, historical, and Monte Carlo methods, and its limitations for CFA risk management." },
  { pattern: /\bcvar\b|expected shortfall|conditional var/, rewrite: "Explain Conditional VaR (CVaR) / Expected Shortfall, how it improves on VaR, and when to use it." },
  { pattern: /\bips\b|investment policy statement/, rewrite: "Explain the Investment Policy Statement (IPS), its key components (objectives, constraints, risk tolerance), and its role in portfolio management." },
  // ── Corporate Finance ────────────────────────────────────────────────────
  { pattern: /\bwacc\b|weighted average cost of capital/, rewrite: "Explain WACC (Weighted Average Cost of Capital), its formula, and how each component (cost of debt, equity, preferred) is weighted for CFA corporate finance." },
  { pattern: /\bnpv\b|net present value/, rewrite: "Explain Net Present Value (NPV), its decision rule (NPV > 0 accept), formula, and how it compares to IRR for capital budgeting." },
  { pattern: /\birr\b|internal rate of return/, rewrite: "Explain Internal Rate of Return (IRR), how to interpret it, its decision rule, and conflict with NPV in mutually exclusive projects." },
  { pattern: /\bpayback period\b/, rewrite: "Explain payback period, discounted payback period, their limitations, and when each is used in capital budgeting." },
  { pattern: /\bprofitability index\b/, rewrite: "Explain the profitability index, its formula (PV of inflows / initial investment), and its use in capital rationing." },
  { pattern: /\bleverage\b/, rewrite: "Explain operating leverage, financial leverage, total leverage, DOL, DFL, and DTL formulas for CFA corporate finance." },
  { pattern: /\bdol\b|degree of operating leverage/, rewrite: "Explain degree of operating leverage (DOL), its formula, and how fixed costs affect operating risk." },
  { pattern: /\bdfl\b|degree of financial leverage/, rewrite: "Explain degree of financial leverage (DFL), its formula, and how debt amplifies EPS changes." },
  { pattern: /\bdtl\b|degree of total leverage/, rewrite: "Explain degree of total leverage (DTL = DOL × DFL) and what it measures for CFA." },
  { pattern: /\bdividend policy\b/, rewrite: "Explain dividend policy, dividend irrelevance theory (M&M), signalling effect, and types of dividends." },
  { pattern: /\bshare repurchase\b|buyback/, rewrite: "Explain share repurchases, their effect on EPS, book value, and how they compare to cash dividends." },
  // ── Financial Statement Analysis ─────────────────────────────────────────
  { pattern: /\bfsa\b|financial statement analysis/, rewrite: "Explain financial statement analysis for CFA: income statement, balance sheet, cash flow statement, and their interrelations." },
  { pattern: /\bdu ?pont\b|dupont/, rewrite: "Explain DuPont analysis, the three-factor and five-factor decompositions of ROE, and what each driver signals." },
  { pattern: /\bquick ratio\b/, rewrite: "Explain the quick ratio (acid-test ratio), its formula ((Cash + Receivables) / Current Liabilities), and how it differs from current ratio." },
  { pattern: /\bcurrent ratio\b/, rewrite: "Explain the current ratio, its formula, interpretation, and limitations as a liquidity measure." },
  { pattern: /\bdebt.to.equity\b|d\/e ratio/, rewrite: "Explain the debt-to-equity (D/E) ratio, how it measures financial leverage, and its implications for solvency." },
  { pattern: /\binventory turnover\b/, rewrite: "Explain inventory turnover ratio, days of inventory on hand (DOH), and how they signal operational efficiency." },
  { pattern: /\bdso\b|days sales outstanding|receivables turnover/, rewrite: "Explain days sales outstanding (DSO) and receivables turnover ratio, and what high/low values indicate for CFA FSA." },
  { pattern: /\bdpo\b|days payable outstanding/, rewrite: "Explain days payable outstanding (DPO) and accounts payable turnover, and what they reveal about a firm's payment practices." },
  { pattern: /\bdio\b|days inventory outstanding/, rewrite: "Explain days inventory outstanding (DIO) and its role in the cash conversion cycle for CFA FSA." },
  { pattern: /\bccc\b|cash conversion cycle/, rewrite: "Explain the cash conversion cycle (CCC = DIO + DSO − DPO), what it measures, and how to interpret high vs low values." },
  { pattern: /\bgross margin\b|gross profit margin/, rewrite: "Explain gross margin, gross profit, and what gross margin trend analysis reveals about pricing power and costs." },
  { pattern: /\bebit\b(?!da\b)/, rewrite: "Explain EBIT (Earnings Before Interest and Taxes), how to calculate it, and its use in profitability and coverage analysis." },
  { pattern: /\bebitda\b/, rewrite: "Explain EBITDA, how it is calculated, its use as a cash flow proxy, and its limitations for CFA FSA." },
  { pattern: /\bocf\b|operating cash flow|cash from operations/, rewrite: "Explain operating cash flow (OCF), how it relates to net income, and why it is a key indicator of earnings quality." },
  { pattern: /\bifrs\b/, rewrite: "Explain IFRS (International Financial Reporting Standards) and key differences from US GAAP relevant to CFA FSA." },
  { pattern: /\bgaap\b/, rewrite: "Explain US GAAP and key differences from IFRS relevant to CFA financial statement analysis." },
  { pattern: /\bifrs vs gaap\b|gaap vs ifrs/, rewrite: "Compare IFRS and US GAAP on inventory (LIFO), lease accounting, revenue recognition, and other key CFA FSA differences." },
  { pattern: /\blifo\b/, rewrite: "Explain LIFO inventory method, LIFO reserve, LIFO to FIFO conversion, and why LIFO is prohibited under IFRS." },
  { pattern: /\bfifo\b/, rewrite: "Explain FIFO inventory method, its effect on COGS, inventory balance, and taxable income under inflation/deflation." },
  // ── Quantitative Methods ─────────────────────────────────────────────────
  { pattern: /\bcovariance\b/, rewrite: "Explain covariance, its formula, interpretation (positive/negative/zero), and role in portfolio variance for CFA quants." },
  { pattern: /\bcorrelation\b/, rewrite: "Explain correlation coefficient, its range (−1 to +1), formula (Cov / (σ_i × σ_j)), and what each value implies for diversification." },
  { pattern: /\bvariance\b/, rewrite: "Explain variance, standard deviation, their formulas, population vs sample calculation, and use in risk measurement." },
  { pattern: /\bstandard deviation\b/, rewrite: "Explain standard deviation as a risk measure, its formula, and how it is used in the Sharpe ratio and normal distribution." },
  { pattern: /\bnormal distribution\b/, rewrite: "Explain the normal distribution, its properties (mean, median, mode equal; 68-95-99.7 rule), and use in CFA quantitative methods." },
  { pattern: /\bcentral limit theorem\b|clt/, rewrite: "Explain the Central Limit Theorem, why sample means are normally distributed, and its importance for hypothesis testing in CFA." },
  { pattern: /\bhypothesis testing\b/, rewrite: "Explain hypothesis testing, null vs alternative hypothesis, Type I and Type II errors, p-values, and test statistics for CFA quants." },
  { pattern: /\bconfidence interval\b/, rewrite: "Explain confidence intervals, how to construct them, and what a 95% confidence interval means for CFA statistics." },
  { pattern: /\bregression\b/, rewrite: "Explain simple and multiple linear regression, R-squared, F-statistic, t-statistic, and coefficient interpretation for CFA quants." },
  { pattern: /\br.squared\b|r2|coefficient of determination/, rewrite: "Explain R-squared (coefficient of determination), what percentage of variance it explains, and its limitations in regression analysis." },
  { pattern: /\bstandard error\b/, rewrite: "Explain standard error of estimate in regression, how it measures prediction error, and its relationship to confidence intervals." },
  { pattern: /\btime series\b/, rewrite: "Explain time series analysis, trend models, autoregressive (AR) models, mean reversion, and unit roots for CFA quants." },
  // ── Derivatives ──────────────────────────────────────────────────────────
  { pattern: /\bforward contract\b|forward price/, rewrite: "Explain forward contracts, forward price formula, cost of carry model, and arbitrage pricing for CFA derivatives." },
  { pattern: /\bfutures contract\b/, rewrite: "Explain futures contracts, mark-to-market, margins, basis, and how futures differ from forwards in CFA derivatives." },
  { pattern: /\bswap\b/, rewrite: "Explain interest rate swaps, currency swaps, equity swaps, their valuation, and use in hedging for CFA derivatives." },
  { pattern: /\bcall option\b|call options/, rewrite: "Explain call options, payoff at expiration, intrinsic value, time value, and moneyness (ITM/ATM/OTM)." },
  { pattern: /\bput option\b|put options/, rewrite: "Explain put options, payoff at expiration, intrinsic value, time value, and moneyness (ITM/ATM/OTM)." },
  { pattern: /\bput.call parity\b/, rewrite: "Explain put-call parity, its formula, and how it is used for arbitrage and synthetic position creation in CFA derivatives." },
  { pattern: /\bblack.?scholes\b/, rewrite: "Explain the Black-Scholes model, its inputs (S, K, r, T, σ), assumptions, and formula for pricing European options." },
  { pattern: /\bgreeks?\b|delta hedge|option greeks/, rewrite: "Explain the option Greeks: Delta, Gamma, Vega, Theta, Rho — their definitions, formulas, and use in hedging." },
  { pattern: /\bbinomial model\b|binomial tree/, rewrite: "Explain the binomial option pricing model, up/down factors, risk-neutral probability, and one/two-period tree valuation." },
  // ── Alternative Investments ──────────────────────────────────────────────
  { pattern: /\bprivate equity\b/, rewrite: "Explain private equity, LBO, venture capital, buyout funds, J-curve effect, and performance measurement for CFA alternatives." },
  { pattern: /\bhedge fund\b/, rewrite: "Explain hedge fund strategies (long/short, macro, event-driven, relative value), fee structures (2-and-20), and due diligence." },
  { pattern: /\breal estate\b/, rewrite: "Explain real estate investment, REITs, direct vs indirect investment, cap rate, and NOI for CFA alternatives." },
  { pattern: /\bcommodity\b/, rewrite: "Explain commodity investments, contango, backwardation, roll yield, and use in portfolio diversification." },
  { pattern: /\bjcurve\b|j.curve/, rewrite: "Explain the J-curve effect in private equity, why returns are negative early (fees, write-downs) and recover as investments mature." },
  { pattern: /\birr\s+private equity\b|moic\b|tvpi\b/, rewrite: "Explain private equity performance metrics: IRR, MOIC (Multiple on Invested Capital), and TVPI (Total Value to Paid-In) for CFA alternatives." },
  // ── Economics ────────────────────────────────────────────────────────────
  { pattern: /\bprice elasticity\b/, rewrite: "Explain price elasticity of demand, its formula, elastic vs inelastic demand, and implications for revenue." },
  { pattern: /\bgdp\b/, rewrite: "Explain GDP, its expenditure and income components, real vs nominal GDP, and GDP as an economic indicator." },
  { pattern: /\binflation\b/, rewrite: "Explain inflation, CPI, deflation, stagflation, hyperinflation, and how central banks respond using monetary policy." },
  { pattern: /\bmonetary policy\b/, rewrite: "Explain monetary policy, central bank tools (policy rate, open market operations, reserve requirements), and their effects on the economy." },
  { pattern: /\bfiscal policy\b/, rewrite: "Explain fiscal policy, government spending, taxation, deficit/surplus, automatic stabilisers, and crowding-out effect." },
  { pattern: /\binterest rate parity\b|covered interest parity|uncovered interest parity/, rewrite: "Explain interest rate parity (covered and uncovered), its formula, and its use in exchange rate forecasting for CFA economics." },
  { pattern: /\bpurchasing power parity\b|ppp/, rewrite: "Explain purchasing power parity (PPP), absolute vs relative PPP, and its long-run implications for exchange rates." },
  { pattern: /\bism curve\b|islm\b/, rewrite: "Explain the IS-LM model, the IS and LM curves, equilibrium, and how fiscal/monetary policy shift them." },
  // ── CMA USA Specific ─────────────────────────────────────────────────────
  { pattern: /\bcvp\b|cost.volume.profit/, rewrite: "Explain cost-volume-profit (CVP) analysis, contribution margin, break-even point formula, and operating leverage for CMA." },
  { pattern: /\bcontribution margin\b/, rewrite: "Explain contribution margin, contribution margin ratio, contribution margin per unit, and their use in CVP and break-even analysis." },
  { pattern: /\bbreak.?even\b/, rewrite: "Explain break-even analysis, break-even units formula (FC / CM per unit), break-even sales, and margin of safety for CMA." },
  { pattern: /\bmargin of safety\b/, rewrite: "Explain margin of safety, its formula (Actual Sales − Break-even Sales), and what it indicates about business risk." },
  { pattern: /\babc costing\b|activity.based costing/, rewrite: "Explain Activity-Based Costing (ABC), how cost pools and cost drivers are used, advantages over traditional costing, and ABM for CMA." },
  { pattern: /\babm\b|activity.based management/, rewrite: "Explain Activity-Based Management (ABM), value-added vs non-value-added activities, and how ABC supports process improvement." },
  { pattern: /\bbsc\b|balanced scorecard/, rewrite: "Explain the Balanced Scorecard, its four perspectives (financial, customer, internal process, learning & growth), and KPIs for CMA." },
  { pattern: /\beva\b|economic value added/, rewrite: "Explain Economic Value Added (EVA = NOPAT − WACC × Invested Capital), how it measures shareholder value creation, and differences from accounting profit." },
  { pattern: /\bmva\b|market value added/, rewrite: "Explain Market Value Added (MVA = Market Value − Invested Capital), its relationship to EVA, and use in performance evaluation." },
  { pattern: /\broi\b|return on investment/, rewrite: "Explain Return on Investment (ROI), residual income (RI), and how they are used in divisional performance evaluation for CMA." },
  { pattern: /\bresidual income\b|ri\b/, rewrite: "Explain residual income (RI = Operating Income − Imputed Capital Charge), how it improves on ROI, and its use in performance evaluation." },
  { pattern: /\btransfer pricing\b/, rewrite: "Explain transfer pricing, market price, cost-based, and negotiated transfer pricing methods, and their implications for divisional performance." },
  { pattern: /\bstandard costing\b/, rewrite: "Explain standard costing, standard costs vs actual costs, and the purpose of variance analysis for CMA management accounting." },
  { pattern: /\bvariance analysis\b/, rewrite: "Explain variance analysis, material price variance (MPV), material quantity/usage variance (MUV), labour rate variance (LRV), labour efficiency variance (LEV), and overhead variances for CMA." },
  { pattern: /\bmpv\b|material price variance/, rewrite: "Explain material price variance (MPV = (Actual Price − Standard Price) × Actual Quantity), its causes, and who is responsible." },
  { pattern: /\bmuv\b|material usage variance|material quantity variance/, rewrite: "Explain material usage (quantity) variance (MUV = (Actual Qty − Standard Qty) × Standard Price), its causes, and responsibility." },
  { pattern: /\blrv\b|labour rate variance|labor rate variance/, rewrite: "Explain labour rate variance (LRV = (Actual Rate − Standard Rate) × Actual Hours), its causes, and corrective actions." },
  { pattern: /\blev\b|labour efficiency variance|labor efficiency variance/, rewrite: "Explain labour efficiency variance (LEV = (Actual Hours − Standard Hours) × Standard Rate), its causes, and responsibility." },
  { pattern: /\bjit\b|just.in.time/, rewrite: "Explain Just-In-Time (JIT) inventory management, pull systems, its benefits (reduced waste, lower inventory), and challenges for CMA." },
  { pattern: /\btqm\b|total quality management/, rewrite: "Explain Total Quality Management (TQM), cost of quality (prevention, appraisal, internal failure, external failure), and continuous improvement." },
  { pattern: /\bsix sigma\b/, rewrite: "Explain Six Sigma methodology, DMAIC process, and how it is used to reduce process defects for CMA." },
  { pattern: /\bworking capital\b/, rewrite: "Explain working capital management, current assets, current liabilities, the operating cycle, and short-term financing for CMA." },
  { pattern: /\bcash management\b/, rewrite: "Explain cash management, float, lockbox systems, concentration banking, and short-term investment of surplus cash for CMA." },
  { pattern: /\bcapital structure\b/, rewrite: "Explain capital structure, debt vs equity trade-offs, M&M propositions with and without taxes, and optimal capital structure for CMA/CFA." },
  { pattern: /\bleasing\b|lease vs buy/, rewrite: "Explain lease vs buy decision analysis, operating vs finance leases, and how to evaluate each using NPV for CMA." },
  { pattern: /\bmaster budget\b/, rewrite: "Explain the master budget, its components (sales, production, cash, pro-forma financial statements), and the budgeting process for CMA." },
  { pattern: /\bflexible budget\b/, rewrite: "Explain flexible budgets, how they differ from static budgets, flexible budget variance, and sales volume variance for CMA." },
  { pattern: /\bzero.based budgeting\b|zbb/, rewrite: "Explain zero-based budgeting (ZBB), how it differs from incremental budgeting, its advantages, and when to use it." },
  { pattern: /\binternal controls\b/, rewrite: "Explain internal controls, COSO framework (control environment, risk assessment, control activities, information/communication, monitoring) for CMA Part 1." },
  { pattern: /\bsarbanes.oxley\b|sox/, rewrite: "Explain Sarbanes-Oxley Act (SOX), Section 302 (officer certification), Section 404 (internal control over financial reporting), and its impact on corporate governance." },
  // ── Ethics / GIPS ────────────────────────────────────────────────────────
  { pattern: /\bgips\b|global investment performance standards/, rewrite: "Explain GIPS (Global Investment Performance Standards), their purpose, composite construction, and key requirements for CFA ethics." },
  { pattern: /\bcode of ethics\b|standards of practice/, rewrite: "Explain the CFA Institute Code of Ethics and Standards of Professional Conduct, key standards (I–VII), and their exam implications." },
  { pattern: /\bethics.*profession\b|\bprofession.*ethics\b|\brole.*ethics\b|\bethics.*role\b|\bprofessional ethics\b|\bprofessional conduct\b|\bcode of conduct\b/, rewrite: "Explain the role of a code of ethics in a profession: ethical obligations of professionals, purpose of ethical standards, professional conduct, public trust, and why ethical behaviour is fundamental to professional practice." },
  { pattern: /\bmosaic theory\b/, rewrite: "Explain mosaic theory, how combining non-material non-public information with public information is permissible under CFA Standard II(A)." },
  { pattern: /\bmaterial non.public\b|mnpi/, rewrite: "Explain material non-public information (MNPI) under CFA Standard II(A), insider trading restrictions, and the firewall concept." },
  // ── Corporate Governance / Board ─────────────────────────────────────────
  { pattern: /\brisk governance\b|\bboard.*governance\b|\bgovernance.*board\b|\bboard.*risk\b|\broles?.*board\b|\bboard.*roles?\b|\bboard.*oversight\b|\bboard of directors\b/, rewrite: "Explain the key roles of the board of directors in risk governance: setting risk appetite, oversight of risk management, audit committee and risk committee responsibilities, fiduciary duties of directors, and corporate governance frameworks." },
  { pattern: /\bcorporate governance\b/, rewrite: "Explain corporate governance: board structure and responsibilities, agency problem, shareholder vs stakeholder models, separation of ownership and control, audit committee, and governance best practices." },
  // ── General fallback for very short questions ────────────────────────────
];

function rewriteShortStudentQuestion(question: string): string {
  const normalized = question.trim().toLowerCase();
  const compact = normalized.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();

  for (const entry of CFA_CMA_REWRITES) {
    if (entry.pattern.test(compact)) return entry.rewrite;
  }

  const wordCount = compact.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 4) return `Explain the CFA/CMA concept "${question.trim()}" with definition, intuition, formula (if applicable), and exam-relevant details from the uploaded material.`;
  return question.trim();
}

function buildRewrittenQueries(question: string): string[] {
  const rewritten = rewriteShortStudentQuestion(question);
  const keywordQuery = extractQuestionKeywords(rewritten).join(" ");
  const variants = [question.trim(), rewritten, keywordQuery].map((e) => e.trim()).filter(Boolean);
  return variants.filter((e, i) => variants.indexOf(e) === i);
}

function inferQuestionIntent(question: string): string {
  const normalized = question.toLowerCase();
  if (/\b(compare|difference|different|vs|versus|distinguish|contrast)\b/.test(normalized)) return "comparison";
  if (/\b(calculate|compute|solve|find the value|what is the value|how much|work out)\b/.test(normalized)) return "calculation";
  if (/\b(formula|equation|expression for|derive)\b/.test(normalized)) return "formula";
  if (/\b(list|enumerate|what are the|name the|types of|components of|elements of|steps in)\b/.test(normalized)) return "list";
  if (/\b(why|how does|how do|explain why|reason for|cause of)\b/.test(normalized)) return "reasoning";
  if (/\b(quiz|practice|mcq|test me|give me a question)\b/.test(normalized)) return "practice";
  if (/\b(apply|interpret|use|analyse|analyze|implication|impact of|effect of)\b/.test(normalized)) return "application";
  if (/\b(define|what is|what are|explain|meaning of|describe)\b/.test(normalized)) return "definition";
  return "general";
}

function isSimpleDefinitionStyleQuestion(question: string): boolean {
  return /\b(what is|what are|define|explain|meaning of|describe)\b/.test(question.toLowerCase());
}

function buildAnsweringGuidance(question: string) {
  const intent = inferQuestionIntent(question);
  const guidanceMap: Record<string, string> = {
    comparison: "QUESTION-SPECIFIC GUIDANCE:\nIntent: comparison. Build a side-by-side markdown table for the key attributes, then summarise the single most important distinction. Use only supported context.",
    calculation: "QUESTION-SPECIFIC GUIDANCE:\nIntent: calculation. Show every step of the arithmetic. Write all formulas in LaTeX block notation. Define every variable. Do not skip any intermediate step.",
    formula: "QUESTION-SPECIFIC GUIDANCE:\nIntent: formula lookup. Present the formula in LaTeX block notation first. Define every variable. Then explain when and how to use it, and show a brief numerical example if the material provides one.",
    list: "QUESTION-SPECIFIC GUIDANCE:\nIntent: enumeration. Present the items as a numbered list. Keep each item to one concise sentence. Do not invent items not found in the context.",
    reasoning: "QUESTION-SPECIFIC GUIDANCE:\nIntent: reasoning/explanation. Use a numbered step-by-step explanation. Be explicit about cause and effect. Do not infer beyond what the context explicitly supports.",
    practice: "QUESTION-SPECIFIC GUIDANCE:\nIntent: practice question. Create one 3-option multiple-choice question drawn entirely from the context. After the student responds, reveal the answer and explanation.",
    application: "QUESTION-SPECIFIC GUIDANCE:\nIntent: application/interpretation. Explain how the concept applies in the specific scenario. Show the chain of reasoning using only context evidence.",
    definition: "QUESTION-SPECIFIC GUIDANCE:\nIntent: definition. Lead with the most precise definition from the material. Simplify in plain language next. Add a one-sentence exam tip at the end.",
    general: "QUESTION-SPECIFIC GUIDANCE:\nIntent: general. Synthesise the strongest overlapping points from all retrieved sources into one coherent answer. Do not repeat the same point twice.",
  };
  return `${guidanceMap[intent]}\nIf multiple documents cover the same concept, combine them into one answer — do not repeat content. Cite source names and page numbers.`;
}

function formatChunkForPrompt(chunk: RetrievedChunk): string {
  const content = String(chunk.content ?? "").trim();
  const formulaLines = Array.isArray(chunk.metadata.formulaLines)
    ? chunk.metadata.formulaLines.filter((line: unknown) => typeof line === "string" && line.trim().length > 0)
    : [];
  const notes: string[] = [];
  if (chunk.metadata.hasFormula) notes.push("Contains formula content");
  if (chunk.metadata.hasTable) notes.push("Contains table or structured numeric content");
  if (formulaLines.length === 0) return content;
  return [notes.length > 0 ? `Notes: ${notes.join(" | ")}` : null, content, "Formula lines:", ...formulaLines.map((line) => `- ${line}`)].filter(Boolean).join("\n");
}

function buildRetrievedContext(chunks: RetrievedChunk[]) {
  return chunks.map((chunk, index) => {
    const source = chunk.metadata.documentTitle ?? chunk.metadata.fileName ?? "Uploaded Document";
    const pageNumber = chunk.pageNumber ?? chunk.metadata.pageNumber ?? 1;
    const topic = chunk.metadata.topic ? ` | Topic: ${chunk.metadata.topic}` : "";
    const semanticType = chunk.metadata.semanticType ? ` | Type: ${chunk.metadata.semanticType}` : "";
    return `[Source ${index + 1}] ${source} | Page ${pageNumber}${topic}${semanticType}\n${formatChunkForPrompt(chunk)}`;
  }).join("\n\n");
}

function formatConversationHistory(history: ConversationTurn[]): string {
  if (history.length === 0) return "No prior conversation.";
  return history.map((entry) => `${entry.role === "user" ? "Student" : "Assistant"}: ${entry.content}`).join("\n");
}

function buildSystemPrompt(question: string) {
  return STRICT_RAG_SYSTEM_PROMPT.replace("{answering_guidance}", buildAnsweringGuidance(question));
}

function buildUserPrompt(question: string, chunks: RetrievedChunk[], history: ConversationTurn[]) {
  return [
    "Use only the retrieved context below.",
    "Use the conversation history only to understand the student's intent and follow-up references. Do not use it as evidence.",
    "",
    "RECENT CONVERSATION HISTORY",
    formatConversationHistory(history),
    "",
    "========== RETRIEVED CONTEXT START ==========",
    buildRetrievedContext(chunks),
    "========== RETRIEVED CONTEXT END ==========",
    "",
    `Student Question: ${question}`,
  ].join("\n");
}

function extractQuestionKeywords(question: string) {
  return question.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).map((w) => w.trim()).filter((w) => w.length > 2).filter(
    (w) => !["what","which","when","where","why","how","from","with","that","this","into","about","your","their","there","have","does","show","explain","define","using","question","answer","simple","language","according","material","uploaded","documents","difference","between","process","management","framework","describe","candidate","able","should","main","features","please","could","would","tell","give","understand"].includes(w),
  );
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function exactTopicPhrase(question: string) {
  return normalizeText(
    question
      .replace(/^(what is|what are|define|explain|describe)\s+/i, "")
      .replace(/^(how does|how do|why does|why do|difference between|what is the difference between)\s+/i, "")
      .replace(/\b(in simple language|simply|simple language|according to the material|in the material)\b/gi, ""),
  );
}

function buildChunkHaystack(chunk: RetrievedChunk) {
  return normalizeText(
    [chunk.content, chunk.subject ?? "", chunk.chapterName ?? "", chunk.metadata.documentTitle ?? "", chunk.metadata.topic ?? "", chunk.metadata.semanticType ?? "", Array.isArray(chunk.metadata.headingTrail) ? chunk.metadata.headingTrail.join(" ") : ""].join(" "),
  );
}

function isNoisyChunkForQuestion(question: string, chunk: RetrievedChunk): boolean {
  const content = String(chunk.content ?? "");
  const isPracticeIntent = inferQuestionIntent(question) === "practice";
  const questionMarkCount = (content.match(/\?/g) ?? []).length;
  if (NOISY_CHUNK_PATTERNS.some((pattern) => pattern.test(content))) return !isPracticeIntent;
  if (!isPracticeIntent && questionMarkCount >= 2) return true;
  if (!isPracticeIntent && /\b(reply a, b, or c|multiple choice|choose the best answer)\b/i.test(content)) return true;
  if (/\brisk governance\b/i.test(question.toLowerCase()) && /\balternative investment/i.test(content) && !/\bgovernance\b/i.test(content)) return true;
  return false;
}

// Questions that signal formula/calculation intent — used for semantic scoring boosts
const FORMULA_QUESTION_PATTERN = /\b(formula|equation|calculate|compute|ratio|covariance|correlation|variance|standard deviation|beta|duration|convexity|npv|irr|wacc|capm|ytm|roe|roa|eps|dol|dfl|dtl|ccc|dso|dpo|sharpe|treynor|sortino|var|cvar|eva|roi|mpv|muv|lrv|lev|contribution margin|break.?even|cvp|pvbp|dv01)\b/i;
const DEFINITION_QUESTION_PATTERN = /\b(define|what is|what are|describe|meaning of)\b/i;
const EXAMPLE_QUESTION_PATTERN = /\b(calculate|compute|solve|example|worked example|show|demonstrate|illustrate|step.by.step)\b/i;
const COMPARISON_QUESTION_PATTERN = /\b(compare|difference|contrast|vs|versus|distinguish)\b/i;
const LIST_QUESTION_PATTERN = /\b(list|enumerate|types of|components|elements|steps)\b/i;

function scoreChunkSupport(question: string, chunk: RetrievedChunk) {
  const keywords = extractQuestionKeywords(question);
  const haystack = buildChunkHaystack(chunk);
  const phrase = exactTopicPhrase(question);
  const semanticType = typeof chunk.metadata.semanticType === "string" ? chunk.metadata.semanticType : "";

  const keywordMatches = keywords.filter((kw) => haystack.includes(kw)).length;
  const exactPhraseMatch = phrase.length >= 4 && haystack.includes(phrase);

  const definitionBoost = DEFINITION_QUESTION_PATTERN.test(question) && semanticType === "definition" ? 3 : 0;
  const formulaBoost = FORMULA_QUESTION_PATTERN.test(question) && semanticType === "formula_or_measure" ? 3 : 0;
  const workedExampleBoost = EXAMPLE_QUESTION_PATTERN.test(question) && /\b(worked_example|example)\b/i.test(semanticType) ? 3 : 0;
  const tableBoost = COMPARISON_QUESTION_PATTERN.test(question) && chunk.metadata.hasTable ? 2 : 0;
  const summaryBoost = LIST_QUESTION_PATTERN.test(question) && semanticType === "summary" ? 1 : 0;
  const hasFormulaLineBoost = FORMULA_QUESTION_PATTERN.test(question) && Array.isArray(chunk.metadata.formulaLines) && chunk.metadata.formulaLines.length > 0 ? 2 : 0;
  const curriculumBoost = String(chunk.metadata.documentCategory ?? "") === "curriculum" && keywordMatches >= 2 ? 1 : 0;

  return {
    keywordMatches,
    exactPhraseMatch,
    total: keywordMatches + (exactPhraseMatch ? 3 : 0) + definitionBoost + formulaBoost + workedExampleBoost + tableBoost + summaryBoost + hasFormulaLineBoost + curriculumBoost,
  };
}

function hasKeywordSupport(question: string, chunks: RetrievedChunk[]) {
  const keywords = extractQuestionKeywords(question);
  if (keywords.length === 0) return true;
  const haystack = chunks.map((c) => buildChunkHaystack(c)).join(" ");
  const matched = keywords.filter((kw) => haystack.includes(kw));
  return matched.length >= (keywords.length === 1 ? 1 : Math.max(2, Math.ceil(keywords.length / 2)));
}

function answerMentionsQuestionTopic(question: string, answer: string): boolean {
  const keywords = extractQuestionKeywords(question);
  const normalizedAnswer = normalizeText(answer);
  const phrase = exactTopicPhrase(question);
  if (phrase.length >= 4 && normalizedAnswer.includes(phrase)) return true;
  const matched = keywords.filter((kw) => normalizedAnswer.includes(kw));
  const minimumMatches = keywords.length <= 1 ? 1 : keywords.length === 2 ? 2 : Math.max(2, Math.ceil(keywords.length / 2));
  return matched.length >= minimumMatches;
}

function containsDifferentQuestionLeak(question: string, answer: string): boolean {
  const normalizedQuestion = normalizeText(question);
  const lines = answer.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.some((line) => {
    if (!/[?]$/.test(line)) return false;
    if (!/^(what|how|why|which|when|where|who)\b/i.test(line)) return false;
    return normalizeText(line) !== normalizedQuestion;
  });
}

function isAnswerGroundedForQuestion(question: string, answer: string, chunks: RetrievedChunk[]): boolean {
  if (!answer || answer === RAG_NOT_FOUND_MESSAGE) return false;
  if (/retrieved context start|retrieved context end|please answer the following question|you are ready to assist the student/i.test(answer)) return false;
  if (containsDifferentQuestionLeak(question, answer)) return false;
  if (!answerMentionsQuestionTopic(question, answer)) return false;
  const combinedChunkHaystack = normalizeText(chunks.map((c) => c.content).join(" "));
  const normalizedAnswer = normalizeText(answer);
  const answerKeywords = extractQuestionKeywords(question);
  const unsupportedKeywords = answerKeywords.filter((kw) => normalizedAnswer.includes(kw) && !combinedChunkHaystack.includes(kw));
  return unsupportedKeywords.length === 0;
}

function passesRelevanceGate(question: string, chunks: RetrievedChunk[]): boolean {
  if (chunks.length === 0) return false;
  const keywords = extractQuestionKeywords(question);
  const phrase = exactTopicPhrase(question);
  const supportEntries = chunks.map((chunk) => ({ chunk, support: scoreChunkSupport(question, chunk) }));
  const bestSupport = supportEntries[0]?.support;
  const exactPhraseSupported = phrase.length >= 4 && supportEntries.some((e) => e.support.exactPhraseMatch);
  const strongChunkCount = supportEntries.filter((e) => e.support.keywordMatches >= 2 || e.support.total >= 4).length;
  if (keywords.length <= 1) return (bestSupport?.keywordMatches ?? 0) >= 1 || exactPhraseSupported;
  if (keywords.length === 2) return exactPhraseSupported || strongChunkCount >= 1;
  return exactPhraseSupported || strongChunkCount >= 1;
}

function getScoreThresholdForQuestion(question: string, chunks: RetrievedChunk[]): number {
  const baseThreshold = Math.max(RAG_MIN_SCORE, RAG_SIMILARITY_THRESHOLD);
  const topChunk = chunks[0];
  if (!topChunk) return baseThreshold;
  const topSupport = scoreChunkSupport(question, topChunk);
  const simpleDefinitionQuestion = isSimpleDefinitionStyleQuestion(question);
  const simplifiedLanguageFollowUp = /\b(simple|simply|simple language)\b/i.test(question);
  const keywordSupported = hasKeywordSupport(question, chunks);
  if (simpleDefinitionQuestion && keywordSupported && (topSupport.exactPhraseMatch || topSupport.keywordMatches >= 1)) return Math.min(baseThreshold, 0.62);
  if (simplifiedLanguageFollowUp && keywordSupported && (topSupport.exactPhraseMatch || topSupport.keywordMatches >= 2)) return Math.min(baseThreshold, 0.6);
  return baseThreshold;
}

function hasOpenAIKey() { return Boolean(process.env.OPENAI_API_KEY?.trim()); }
function hasLocalLlmEndpoint() { return Boolean(LOCAL_LLM_BASE_URL?.trim()); }
function hasAnthropicKey() { return Boolean(process.env.ANTHROPIC_API_KEY?.trim()); }
function hasGroqKey() { return Boolean(process.env.GROQ_API_KEY?.trim()); }

async function runLlmMessages(params: { messages: LlmMessage[]; maxTokens?: number; temperature?: number }): Promise<string> {
  const preferredProvider = LLM_PROVIDER;
  const providerOrder = preferredProvider === "local" ? ["local","openai","groq","anthropic"] : preferredProvider === "openai" ? ["openai","local","groq","anthropic"] : preferredProvider === "groq" ? ["groq","local","openai","anthropic"] : ["anthropic","local","groq","openai"];

  for (const provider of providerOrder) {
    try {
      if (provider === "local" && hasLocalLlmEndpoint()) {
        const localClient = new OpenAI({ apiKey: process.env.LOCAL_LLM_API_KEY?.trim() || "local", baseURL: LOCAL_LLM_BASE_URL });
        const response = await localClient.chat.completions.create({ model: LOCAL_LLM_MODEL, temperature: params.temperature ?? 0.2, max_tokens: params.maxTokens ?? 700, messages: params.messages });
        return response.choices[0]?.message?.content?.trim() || RAG_NOT_FOUND_MESSAGE;
      }
      if (provider === "openai" && hasOpenAIKey()) {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.responses.create({ model: OPENAI_LLM_MODEL, input: params.messages as any, max_output_tokens: params.maxTokens ?? 700, temperature: params.temperature ?? 0.2 });
        return response.output_text?.trim() || RAG_NOT_FOUND_MESSAGE;
      }
      if (provider === "groq" && hasGroqKey()) {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const response = await groq.chat.completions.create({ model: GROQ_MODEL, temperature: params.temperature ?? 0.2, max_completion_tokens: params.maxTokens ?? 700, messages: params.messages as any });
        return response.choices[0]?.message?.content?.trim() || RAG_NOT_FOUND_MESSAGE;
      }
      if (provider === "anthropic" && hasAnthropicKey()) {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const systemMessages = params.messages.filter((m) => m.role === "system");
        const nonSystem: Array<{ role: "user" | "assistant"; content: string }> = params.messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
        const response = await anthropic.messages.create({ model: ANTHROPIC_LLM_MODEL, max_tokens: params.maxTokens ?? 700, system: systemMessages.map((m) => m.content).join("\n\n"), messages: nonSystem.length > 0 ? nonSystem : [{ role: "user", content: "" }] });
        return response.content[0]?.type === "text" ? response.content[0].text.trim() : RAG_NOT_FOUND_MESSAGE;
      }
    } catch (error) {
      console.error(`RAG ${provider} provider failed:`, error);
    }
  }
  return RAG_NOT_FOUND_MESSAGE;
}

function sanitizeLlmAnswer(answer: string): string {
  const cleaned = answer
    .replace(/={10,}\s*RETRIEVED CONTEXT START\s*={10,}[\s\S]*?={10,}\s*RETRIEVED CONTEXT END\s*={10,}/gi, "")
    .replace(/\[Source\s+\d+\][\s\S]*?(?=(?:\n1\.\s+DIRECT ANSWER|\nQUESTION\b|$))/gi, "")
    .replace(/Please answer the following question:[\s\S]*$/gi, "")
    .replace(/You are ready to assist the student[\s\S]*$/gi, "")
    .replace(/^QUESTION\s*$/gim, "")
    .replace(/^\s*Student Question:\s*/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!cleaned) return RAG_NOT_FOUND_MESSAGE;
  if (cleaned.includes(RAG_NOT_FOUND_MESSAGE)) return RAG_NOT_FOUND_MESSAGE;
  return cleaned;
}

function dedupeRetrievedChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Set<string>();
  return chunks.filter((c) => {
    const normalized = normalizeText(c.content);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

// ─── Core retrieval using pgvector ────────────────────────────────────────────

/**
 * BM25 page-indexed retrieval — searches full pages (no chunking) via
 * PostgreSQL ts_rank_cd. Returns RetrievedChunk-compatible objects so the
 * same prompting / LLM path works for both strategies.
 */
async function retrieveByPageIndex(params: {
  question: string;
  rewrittenQueries: string[];
  courseIds: string[];
  subject?: string;
  chapterName?: string;
}): Promise<RetrievedChunk[]> {
  // Build BM25 query: combine original question keywords + expanded rewrite keywords
  const expandedRewrite = params.rewrittenQueries.find((q) => q !== params.question) ?? "";
  const origKeywords = extractQuestionKeywords(params.question);
  const rewriteKeywords = extractQuestionKeywords(expandedRewrite);
  const allKeywords = [...new Set([...origKeywords, ...rewriteKeywords])];
  const queryTerms = allKeywords.join(" ");
  if (!queryTerms.trim()) return [];

  const topPages = await DocumentPage.bm25Search({
    queryTerms,
    courseIds: params.courseIds,
    limit: 5,
    subject: params.subject,
    chapterName: params.chapterName,
  });
  if (topPages.length === 0) return [];

  // Also fetch immediately adjacent pages for context continuity
  const adjacentPairs = topPages.slice(0, 3).flatMap((p) => [
    { documentId: p.documentId, pageNumber: p.pageNumber - 1 },
    { documentId: p.documentId, pageNumber: p.pageNumber + 1 },
  ]).filter((pair) => pair.pageNumber > 0);

  const adjacentPages = await DocumentPage.findAdjacent(adjacentPairs);

  // Merge: top pages keep their BM25 score; adjacent pages get score 0
  const seen = new Map<string, typeof topPages[0]>();
  for (const p of topPages) seen.set(`${p.documentId}:${p.pageNumber}`, p);
  for (const p of adjacentPages) {
    const key = `${p.documentId}:${p.pageNumber}`;
    if (!seen.has(key)) seen.set(key, { ...p, bm25Score: 0 });
  }

  return [...seen.values()]
    .sort((a, b) => (b.bm25Score ?? 0) - (a.bm25Score ?? 0))
    .slice(0, MAX_CONTEXT_RESULTS)
    .map((p) => ({
      _id: p.id,
      documentId: p.documentId,
      content: p.content,
      score: p.bm25Score ?? 0,
      pageNumber: p.pageNumber,
      subject: p.subject ?? undefined,
      chapterName: p.chapterName ?? undefined,
      metadata: {
        ...p.metadata,
        pageNumber: p.pageNumber,
        semanticType: "page",
      },
    }));
}

async function retrieveRelevantChunks(params: {
  question: string;
  rewrittenQueries: string[];
  courseIds: string[];
  subject?: string;
  chapterName?: string;
}) {
  const queryEmbeddings = await Promise.all(
    params.rewrittenQueries.map((query) => createEmbedding(query)),
  );

  const vectorLimit = Math.max(RAG_TOP_K * 3, 12);
  const metadataFilters: RetrievalMetadataFilters = {};
  if (params.subject?.trim()) metadataFilters.subject = params.subject.trim();
  if (params.chapterName?.trim()) metadataFilters.chapterName = params.chapterName.trim();

  if (DEBUG_RAG) {
    console.log(
      `[RAG][chat] Retrieving question="${params.question.slice(0, 120)}" courseIds=${params.courseIds.join(",")} embeddingDim=${queryEmbeddings[0]?.length ?? 0}`,
    );
  }

  // pgvector similarity search for each rewritten query
  const vectorResults = (
    await Promise.all(
      queryEmbeddings.map((queryEmbedding) =>
        DocumentChunk.vectorSearch({
          queryEmbedding,
          courseIds: params.courseIds,
          limit: vectorLimit,
          subject: params.subject,
          chapterName: params.chapterName,
        }),
      ),
    )
  ).flat();

  // Lexical keyword search
  const keywords = extractQuestionKeywords(params.rewrittenQueries.join(" "));
  const lexicalRows =
    keywords.length > 0
      ? await DocumentChunk.keywordSearch({
          keywords,
          courseIds: params.courseIds,
          limit: Math.max(RAG_TOP_K * 5, 20),
          subject: params.subject,
          chapterName: params.chapterName,
        })
      : [];

  const merged = new Map<string, RetrievedChunkCandidate>();

  vectorResults
    .filter((result: any) =>
      matchesMetadataFilters({ subject: result.subject, chapterName: result.chapterName, metadata: result.metadata ?? {} }, metadataFilters),
    )
    .forEach((result: any) => {
      const chunk: RetrievedChunkCandidate = {
        _id: String(result.id ?? result._id),
        documentId: String(result.documentId),
        content: String(result.content ?? ""),
        score: Number((result as any).score ?? 0),
        chunkIndex: Number(result.chunkIndex ?? result.metadata?.chunkIndex ?? 0),
        subject: result.subject,
        chapterName: result.chapterName,
        pageNumber: result.pageNumber,
        metadata: { ...(result.metadata ?? {}), sectionTitle: result.sectionTitle ?? result.metadata?.sectionTitle },
      };
      merged.set(chunk._id, chunk);
    });

  lexicalRows.forEach((row: any) => {
    const chunkId = String(row.id ?? row._id);
    const rowChunk: RetrievedChunkCandidate = {
      _id: chunkId,
      documentId: String(row.documentId),
      content: String(row.content ?? ""),
      score: 0,
      chunkIndex: Number(row.chunkIndex ?? row.metadata?.chunkIndex ?? 0),
      subject: row.subject,
      chapterName: row.chapterName,
      pageNumber: row.pageNumber,
      metadata: { ...(row.metadata ?? {}), sectionTitle: row.sectionTitle ?? row.metadata?.sectionTitle },
    };
    const support = scoreChunkSupport(params.question, rowChunk);
    const lexicalScore = Math.min(0.99, 0.62 + support.total * 0.08);
    const existing = merged.get(chunkId);
    if (existing) { existing.lexicalScore = Math.max(existing.lexicalScore ?? 0, lexicalScore); return; }
    rowChunk.lexicalScore = lexicalScore;
    merged.set(chunkId, rowChunk);
  });

  const rescored = [...merged.values()]
    .filter((chunk) => !isNoisyChunkForQuestion(params.question, chunk))
    .map((chunk) => {
      const support = scoreChunkSupport(params.question, chunk);
      const vectorScore = Number(chunk.score ?? 0);
      const lexicalScore = Number(chunk.lexicalScore ?? 0);
      const combinedScore = Math.max(vectorScore, lexicalScore) + support.total * 0.03;
      return { ...chunk, score: Number(combinedScore.toFixed(4)), supportScore: support.total, exactPhraseMatch: support.exactPhraseMatch };
    })
    .filter((c) => (c.supportScore ?? 0) > 0)
    .sort((a, b) => {
      if ((a.exactPhraseMatch ? 1 : 0) !== (b.exactPhraseMatch ? 1 : 0)) return (b.exactPhraseMatch ? 1 : 0) - (a.exactPhraseMatch ? 1 : 0);
      return b.score - a.score;
    });

  const seedChunks = rescored.slice(0, Math.max(RAG_TOP_K, MIN_CONTEXT_RESULTS));

  // Fetch adjacent chunks for context continuity
  const adjacentPairs = seedChunks.slice(0, 4).flatMap((chunk) => {
    const chunkIndex = Number(chunk.chunkIndex ?? chunk.metadata.chunkIndex ?? 0);
    if (!Number.isFinite(chunkIndex) || chunkIndex < 0) return [];
    return [
      { documentId: chunk.documentId, chunkIndex: chunkIndex - 1 },
      { documentId: chunk.documentId, chunkIndex: chunkIndex + 1 },
    ].filter((c) => c.chunkIndex >= 0);
  }).filter((pair, index, all) =>
    all.findIndex((c) => c.documentId === pair.documentId && c.chunkIndex === pair.chunkIndex) === index,
  );

  if (adjacentPairs.length > 0) {
    const adjacentRows = await DocumentChunk.findAdjacentChunks(adjacentPairs);
    adjacentRows.forEach((row: any) => {
      const chunkId = String(row.id ?? row._id);
      if (merged.has(chunkId)) return;
      const candidate: RetrievedChunkCandidate = {
        _id: chunkId,
        documentId: String(row.documentId),
        content: String(row.content ?? ""),
        score: 0,
        chunkIndex: Number(row.chunkIndex ?? row.metadata?.chunkIndex ?? 0),
        subject: row.subject,
        chapterName: row.chapterName,
        pageNumber: row.pageNumber,
        metadata: { ...(row.metadata ?? {}), sectionTitle: row.sectionTitle ?? row.metadata?.sectionTitle },
      };
      if (isNoisyChunkForQuestion(params.question, candidate)) return;
      const support = scoreChunkSupport(params.question, candidate);
      const neighborContextBoost = typeof candidate.metadata.semanticType === "string" && /\b(example|formula_or_measure|process|definition)\b/i.test(candidate.metadata.semanticType) ? 0.08 : 0.03;
      merged.set(chunkId, { ...candidate, lexicalScore: 0.5 + support.total * 0.04 + neighborContextBoost, supportScore: support.total, exactPhraseMatch: support.exactPhraseMatch });
    });
  }

  return [...merged.values()]
    .map((chunk) => {
      const support = scoreChunkSupport(params.question, chunk);
      const vectorScore = Number(chunk.score ?? 0);
      const lexicalScore = Number(chunk.lexicalScore ?? 0);
      const semanticTypeBoost = typeof chunk.metadata.semanticType === "string" && /\b(example|formula_or_measure|process|definition)\b/i.test(chunk.metadata.semanticType) ? 0.02 : 0;
      const combinedScore = Math.max(vectorScore, lexicalScore) + support.total * 0.03 + semanticTypeBoost;
      return { ...chunk, score: Number(combinedScore.toFixed(4)), supportScore: support.total, exactPhraseMatch: support.exactPhraseMatch };
    })
    .filter((c) => (c.supportScore ?? 0) > 0)
    .sort((a, b) => {
      if ((a.exactPhraseMatch ? 1 : 0) !== (b.exactPhraseMatch ? 1 : 0)) return (b.exactPhraseMatch ? 1 : 0) - (a.exactPhraseMatch ? 1 : 0);
      return b.score - a.score;
    })
    .slice(0, Math.min(MAX_CONTEXT_RESULTS, Math.max(RAG_RERANK_TOP_K, 1)));
}

function buildSources(chunks: RetrievedChunk[]): SourceReference[] {
  const seen = new Set<string>();
  return chunks.map((chunk) => ({
    documentId: chunk.metadata.documentId ?? chunk.documentId,
    documentTitle: chunk.metadata.documentTitle ?? chunk.metadata.fileName ?? "Uploaded Document",
    fileName: chunk.metadata.fileName ?? "uploaded-file",
    chapterName: chunk.chapterName ?? chunk.metadata.chapterName,
    sectionTitle: chunk.metadata.sectionTitle,
    pageNumber: chunk.pageNumber ?? chunk.metadata.pageNumber ?? chunk.metadata.page,
    chunkId: chunk._id,
    chunkIndex: chunk.chunkIndex ?? chunk.metadata.chunkIndex,
  })).filter((source) => {
    const key = `${source.documentId}:${source.pageNumber}:${source.chapterName ?? ""}:${source.chunkIndex ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackSuggestedQuestions(question: string, answered: boolean): string[] {
  if (!answered || !question.trim()) return [];
  return ["Can you explain this in simple language?", "Can you give me a practice question from the uploaded material on this topic?"];
}

function parseSuggestedQuestions(raw: string, question: string, answered: boolean): string[] {
  if (!raw || raw === RAG_NOT_FOUND_MESSAGE) return fallbackSuggestedQuestions(question, answered);
  try {
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return fallbackSuggestedQuestions(question, answered);
    return parsed.filter((e): e is string => typeof e === "string" && e.trim().length > 0).map((e) => e.trim()).filter((e, i, a) => a.indexOf(e) === i).slice(0, 2);
  } catch {
    return fallbackSuggestedQuestions(question, answered);
  }
}

async function generateSuggestedQuestions(params: { question: string; answer: string; chunks: RetrievedChunk[]; history: ConversationTurn[]; answered: boolean }): Promise<string[]> {
  if (!params.answered || params.chunks.length === 0) return [];
  const contextSummary = params.chunks.slice(0, 3).map((chunk, index) => {
    const topic = chunk.metadata.topic ? `Topic: ${chunk.metadata.topic}` : "";
    const page = chunk.pageNumber ?? chunk.metadata.pageNumber ?? chunk.metadata.page ?? "";
    return `[Source ${index + 1}] ${topic} ${page ? `Page: ${page}` : ""}\n${chunk.content.slice(0, 500)}`;
  }).join("\n\n");
  const suggestionPrompt = ["Generate exactly 2 short follow-up questions that a student would naturally ask next.", "Rules:", "- Use only the uploaded material summarized below.", "- Do not introduce outside knowledge.", "- Keep each question under 16 words.", "- Return only a JSON array of 2 strings.", "", `Current question: ${params.question}`, `Current answer: ${params.answer}`, "", "Grounded source summary:", contextSummary].join("\n");
  const raw = await runLlmMessages({ messages: [{ role: "system", content: "You create grounded follow-up study questions for a document-only tutoring assistant. Never use unsupported knowledge. Return only JSON." }, { role: "user", content: suggestionPrompt }], maxTokens: 150, temperature: 0.1 });
  return parseSuggestedQuestions(raw, params.question, params.answered);
}

async function logChat(params: { userId?: string; question: string; answer: string; answered: boolean; subject?: string; courseId?: string; chapterName?: string; sources: SourceReference[]; confidenceScore: number; unansweredReason?: string }) {
  if (!params.userId) return;
  await RagChatLog.create({ userId: params.userId, question: params.question, answer: params.answer, answered: params.answered, subject: params.subject, courseId: params.courseId, chapterName: params.chapterName, sourcesUsed: params.sources, confidenceScore: params.confidenceScore });
  if (!params.answered) {
    await RagUnansweredQuestion.create({ userId: params.userId, question: params.question, reason: params.unansweredReason ?? "not_found", subject: params.subject, courseId: params.courseId, chapterName: params.chapterName });
  }
}

export async function answerSyllabusQuestion(params: { userId?: string; question: string; courseIds: string[]; subject?: string; chapterName?: string; conversationHistory?: ConversationTurn[] }): Promise<RagAnswerResult> {
  const question = normalizeQuestion(params.question);
  const conversationHistory = trimConversationHistory(params.conversationHistory ?? []);

  if (!question || params.courseIds.length === 0) {
    return { answered: false, answer: RAG_NOT_FOUND_MESSAGE, sources: [], confidenceScore: 0, suggestedQuestions: [] };
  }

  const retrievalQuestion = buildRetrievalQuestion(question, conversationHistory);
  const rewrittenQueries = buildRewrittenQueries(retrievalQuestion);
  if (DEBUG_RAG) console.log(`[RAG][rewrite] original="${question}" retrieval="${retrievalQuestion}" rewritten=${JSON.stringify(rewrittenQueries)}`);

  // ── Strategy 1: BM25 page-indexed retrieval (vectorless, full pages) ──────
  const pageResults = await retrieveByPageIndex({
    question: retrievalQuestion,
    rewrittenQueries,
    courseIds: params.courseIds,
    subject: params.subject,
    chapterName: params.chapterName,
  });

  if (pageResults.length > 0) {
    if (DEBUG_RAG) console.log(`[RAG][page] BM25 matched ${pageResults.length} page(s); top bm25=${pageResults.slice(0, 3).map((p) => `${p.score.toFixed(4)}@p${p.pageNumber}`).join(", ")}`);

    const pageConfidence = Number((pageResults[0]?.score ?? 0).toFixed(4));
    const pageSources = buildSources(pageResults);

    // Pages carry full content — let the LLM reason without keyword/score gates
    const rawAnswer = await runLlmMessages({
      messages: [
        { role: "system", content: buildSystemPrompt(question) },
        { role: "user", content: buildUserPrompt(question, pageResults, conversationHistory) },
      ],
      maxTokens: 1400,
      temperature: 0.2,
    });

    const normalizedPageAnswer = !rawAnswer || rawAnswer.includes("I don't know") ? RAG_NOT_FOUND_MESSAGE : sanitizeLlmAnswer(rawAnswer);
    const pageAnswered = normalizedPageAnswer !== RAG_NOT_FOUND_MESSAGE && isAnswerGroundedForQuestion(question, normalizedPageAnswer, pageResults);
    const safePageAnswer = pageAnswered ? normalizedPageAnswer : RAG_NOT_FOUND_MESSAGE;

    if (pageAnswered) {
      const suggestedQuestions = await generateSuggestedQuestions({ question, answer: safePageAnswer, chunks: pageResults, history: conversationHistory, answered: true });
      await logChat({ userId: params.userId, question, answer: safePageAnswer, answered: true, subject: params.subject, courseId: params.courseIds[0], chapterName: params.chapterName, sources: pageSources, confidenceScore: pageConfidence });
      return { answered: true, answer: safePageAnswer, sources: pageSources, confidenceScore: pageConfidence, suggestedQuestions };
    }
    // Page retrieval found pages but LLM couldn't ground an answer — fall through
    // to chunk-based retrieval so we give the best possible response.
    if (DEBUG_RAG) console.log(`[RAG][page] LLM not grounded from pages — falling through to chunk retrieval`);
  }

  // ── Strategy 2: Vector + keyword chunk-based retrieval ───────────────────
  const retrievedChunks = dedupeRetrievedChunks(
    await retrieveRelevantChunks({ question: retrievalQuestion, rewrittenQueries, courseIds: params.courseIds, subject: params.subject, chapterName: params.chapterName }),
  );

  if (DEBUG_RAG) console.log(`[RAG][chat] Retrieved ${retrievedChunks.length} chunk(s); top scores=${retrievedChunks.slice(0, 3).map((c) => `${c.score.toFixed(4)}@p${c.pageNumber ?? c.metadata.pageNumber ?? "?"}`).join(", ")}`);

  const confidenceScore = Number((retrievedChunks[0]?.score ?? 0).toFixed(4));
  const sources = buildSources(retrievedChunks);
  const debugInfo: RagDebugInfo | undefined = DEBUG_RAG ? { retrievalQuestion, rewrittenQueries, selectedChunkIds: retrievedChunks.map((c) => c._id), topScores: retrievedChunks.map((c) => Number(c.score.toFixed(4))) } : undefined;

  if (retrievedChunks.length === 0) {
    await logChat({ userId: params.userId, question, answer: RAG_NOT_FOUND_MESSAGE, answered: false, subject: params.subject, courseId: params.courseIds[0], chapterName: params.chapterName, sources, confidenceScore, unansweredReason: "no_chunks_found" });
    return { answered: false, answer: RAG_NOT_FOUND_MESSAGE, sources: [], confidenceScore, suggestedQuestions: [], debug: debugInfo };
  }

  const scoreThreshold = getScoreThresholdForQuestion(question, retrievedChunks);
  const keywordSupported = hasKeywordSupport(question, retrievedChunks);
  const relevancePassed = passesRelevanceGate(question, retrievedChunks);

  if (confidenceScore < scoreThreshold || !keywordSupported || !relevancePassed) {
    await logChat({ userId: params.userId, question, answer: RAG_NOT_FOUND_MESSAGE, answered: false, subject: params.subject, courseId: params.courseIds[0], chapterName: params.chapterName, sources, confidenceScore, unansweredReason: confidenceScore < scoreThreshold ? "low_similarity" : !keywordSupported ? "insufficient_keyword_support" : "relevance_gate_failed" });
    return { answered: false, answer: RAG_NOT_FOUND_MESSAGE, sources: [], confidenceScore, suggestedQuestions: [], debug: debugInfo };
  }

  const answer = await runLlmMessages({ messages: [{ role: "system", content: buildSystemPrompt(question) }, { role: "user", content: buildUserPrompt(question, retrievedChunks, conversationHistory) }], maxTokens: 1200, temperature: 0.2 });
  const normalizedAnswer = !answer || answer.includes("I don't know") ? RAG_NOT_FOUND_MESSAGE : sanitizeLlmAnswer(answer);
  const answered = normalizedAnswer !== RAG_NOT_FOUND_MESSAGE && isAnswerGroundedForQuestion(question, normalizedAnswer, retrievedChunks);
  const safeAnswer = answered ? normalizedAnswer : RAG_NOT_FOUND_MESSAGE;
  const suggestedQuestions = await generateSuggestedQuestions({ question, answer: safeAnswer, chunks: retrievedChunks, history: conversationHistory, answered });

  await logChat({ userId: params.userId, question, answer: safeAnswer, answered, subject: params.subject, courseId: params.courseIds[0], chapterName: params.chapterName, sources: answered ? sources : [], confidenceScore, unansweredReason: answered ? undefined : "llm_not_grounded" });

  return { answered, answer: safeAnswer, sources: answered ? sources : [], confidenceScore, suggestedQuestions, debug: debugInfo };
}
