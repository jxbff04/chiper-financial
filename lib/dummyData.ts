// lib/dummyData.ts
// Dummy data for UI development — replace with live API calls later

import { ResearchReport } from './types';

export const DUMMY_REPORT: ResearchReport = {
  status: 'complete',

  metrics: {
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    price: 118.42,
    priceChange: -3.18,
    priceChangePct: -2.61,
    volume: 312_450_000,
    avgVolume: 289_100_000,
    marketCap: 2_890_000_000_000,
    peRatio: 36.8,
    pegRatio: 1.42,
    debtToEquity: 0.41,
    freeCashFlow: 60_300,       // $60.3B
    revenueGrowthYoY: 122.4,
    grossMargin: 74.6,
    eps: 2.94,
    fiftyTwoWeekHigh: 149.77,
    fiftyTwoWeekLow: 75.61,
    timestamp: new Date().toISOString(),
  },

  quantFlags: [
    {
      metric: 'P/E Ratio',
      value: '36.8x',
      status: 'WARN',
      threshold: '< 25x',
      note: 'Premium valuation requires sustained hypergrowth to justify.',
    },
    {
      metric: 'PEG Ratio',
      value: '1.42',
      status: 'PASS',
      threshold: '< 2.0',
      note: 'Growth-adjusted valuation remains within acceptable bounds.',
    },
    {
      metric: 'Debt / Equity',
      value: '0.41',
      status: 'PASS',
      threshold: '< 1.0',
      note: 'Balance sheet leverage is conservative.',
    },
    {
      metric: 'Free Cash Flow',
      value: '$60.3B',
      status: 'PASS',
      threshold: '> $0',
      note: 'Strongly positive FCF provides a capital return buffer.',
    },
    {
      metric: 'Revenue Growth YoY',
      value: '+122.4%',
      status: 'PASS',
      threshold: '> 10%',
      note: 'Exceptional growth rate — monitor for deceleration.',
    },
    {
      metric: 'Gross Margin',
      value: '74.6%',
      status: 'PASS',
      threshold: '> 40%',
      note: 'Industry-leading margin indicates strong pricing power.',
    },
    {
      metric: 'Price vs 52W High',
      value: '-20.9%',
      status: 'WARN',
      threshold: '< -15%',
      note: 'Significant drawdown from peak — trend reversal not confirmed.',
    },
  ],

  news: [
    {
      headline: 'NVIDIA faces new US export restrictions on H20 chips to China',
      source: 'Reuters',
      publishedAt: '2025-04-15T09:31:00Z',
      sentiment: 'NEGATIVE',
      url: '#',
    },
    {
      headline: 'Blackwell GPU demand outstrips supply through H2 2025, says CEO Jensen Huang',
      source: 'Bloomberg',
      publishedAt: '2025-04-14T14:22:00Z',
      sentiment: 'POSITIVE',
      url: '#',
    },
    {
      headline: 'Microsoft and Google expand data center capex, citing AI infrastructure demand',
      source: 'WSJ',
      publishedAt: '2025-04-14T11:05:00Z',
      sentiment: 'POSITIVE',
      url: '#',
    },
    {
      headline: 'AMD Instinct MI350 gains traction with two hyperscaler pilot programs',
      source: 'The Information',
      publishedAt: '2025-04-13T16:45:00Z',
      sentiment: 'NEGATIVE',
      url: '#',
    },
    {
      headline: 'NVIDIA Q1 earnings call scheduled for May 28 — analysts expect revenue beat',
      source: "Barron's",
      publishedAt: '2025-04-13T09:00:00Z',
      sentiment: 'NEUTRAL',
      url: '#',
    },
    {
      headline: 'Sovereign AI spending wave accelerates across Middle East and Southeast Asia',
      source: 'FT',
      publishedAt: '2025-04-12T13:30:00Z',
      sentiment: 'POSITIVE',
      url: '#',
    },
    {
      headline: 'Antitrust regulators in EU open preliminary inquiry into CUDA ecosystem lock-in',
      source: 'Politico',
      publishedAt: '2025-04-12T08:15:00Z',
      sentiment: 'NEGATIVE',
      url: '#',
    },
    {
      headline: 'NVIDIA announces $500M share buyback program extension',
      source: 'CNBC',
      publishedAt: '2025-04-11T15:55:00Z',
      sentiment: 'POSITIVE',
      url: '#',
    },
    {
      headline: 'Supply chain checks indicate CoWoS packaging remains a production bottleneck',
      source: 'DigiTimes',
      publishedAt: '2025-04-11T07:40:00Z',
      sentiment: 'NEGATIVE',
      url: '#',
    },
    {
      headline: 'Jensen Huang to keynote Computex 2025, product announcement expected',
      source: "Tom's Hardware",
      publishedAt: '2025-04-10T18:20:00Z',
      sentiment: 'NEUTRAL',
      url: '#',
    },
  ],

  tearSheet: {
    executiveSummary: [
      'NVDA trades at $118.42 (-2.61%) on volume 8% above its 30-day average, sitting 20.9% below its 52-week high of $149.77 with no confirmed technical reversal.',
      'Revenue grew 122.4% YoY with a 74.6% gross margin and $60.3B in free cash flow; however, new US export controls on H20 chips introduce a material, unquantified revenue risk to the China segment.',
    ],
    bullCase: [
      'PEG ratio of 1.42 indicates the premium P/E of 36.8x is partially justified by the growth rate — if growth sustains above 80% YoY, the stock is not statistically overvalued.',
      'Hyperscaler capex expansion (Microsoft, Google) directly feeds Blackwell GPU demand, which management states exceeds supply through H2 2025 — a structural backlog provides near-term revenue visibility.',
      'Debt/Equity of 0.41 and $60.3B FCF give management substantial flexibility for buybacks, R&D, and withstanding a demand shock.',
    ],
    bearCase: [
      'CRITICAL: Export restrictions on H20 chips to China represent a binary regulatory risk. China was historically ~20-25% of Data Center revenue — any escalation could cause a sharp downward earnings revision.',
      'The stock is 20.9% off its 52-week high with no reversal signal confirmed. Buying into a declining trend without a catalyst is statistically unfavorable.',
      'AMD\'s hyperscaler pilot programs represent early-stage but real competitive erosion of CUDA moat — if two major cloud providers validate MI350 alternatives, pricing power deteriorates.',
      'EU antitrust inquiry into CUDA lock-in could force architectural changes or impose fines, adding regulatory overhead and long-term ecosystem risk.',
      'P/E of 36.8x leaves zero margin for error on earnings — any miss or guidance reduction will result in a disproportionate price decline.',
    ],
    verdict: 'HOLD',
    verdictRationale: 'Fundamentals are objectively strong, but the confluence of unresolved export control risk, a declining price trend, and a valuation that prices in perfection makes new capital deployment speculative. Existing positions are defensible; initiating new positions requires a confirmed trend reversal or a material price discount to current levels.',
    confidenceScore: 87,
    generatedAt: new Date().toISOString(),
  },
};