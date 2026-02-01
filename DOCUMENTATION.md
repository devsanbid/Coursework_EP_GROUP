# NPL Cricket Analytics Dashboard
## Technical Documentation

**Project:** Nepal Premier League (NPL) Analytics Dashboard  
**Framework:** Next.js with React and TypeScript  
**Visualization Library:** Recharts  
**Data Processing:** PapaParse (CSV Parsing)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Data Architecture](#2-data-architecture)
3. [Analytical KPI Design](#3-analytical-kpi-design)
4. [Comparative Metrics](#4-comparative-metrics)
5. [Toss Impact Analysis](#5-toss-impact-analysis)
6. [Baseline Modeling](#6-baseline-modeling)
7. [Descriptive Analytics Module](#7-descriptive-analytics-module)
8. [Predictive Analytics Module](#8-predictive-analytics-module)
9. [Diagnostic Analytics Module](#9-diagnostic-analytics-module)
10. [Chart Components](#10-chart-components)

---

## 1. Project Overview

The NPL Cricket Analytics Dashboard is a comprehensive data analytics platform designed to analyze Nepal Premier League cricket data across multiple seasons. The system implements three core analytics paradigms:

| Analytics Type | Purpose | Key Question |
|----------------|---------|--------------|
| **Descriptive** | Historical summary | "What happened?" |
| **Diagnostic** | Root cause analysis | "Why did it happen?" |
| **Predictive** | Future forecasting | "What will happen?" |

### Technology Stack

- **Next.js** - React Framework for server-side rendering
- **React** - User interface library
- **TypeScript** - Type-safe JavaScript
- **Recharts** - Data visualization library
- **Framer Motion** - Animation library
- **PapaParse** - CSV file processing
- **jsPDF** - PDF report generation
- **Tailwind CSS** - Utility-first CSS framework

---

## 2. Data Architecture

### 2.1 Primary Data Source

**Master Dataset:** `npl_master.csv`

Contains ball-by-ball player performance data with the following attributes:

| Field | Type | Description |
|-------|------|-------------|
| player_name | String | Player identifier |
| team | String | Team name |
| player_role | String | Batsman, Bowler, All-rounder |
| runs_scored | Integer | Runs scored in match |
| balls_faced | Integer | Balls faced |
| fours | Integer | Boundaries (4 runs) |
| sixes | Integer | Maximums (6 runs) |
| strike_rate | Float | Batting strike rate |
| wickets_taken | Integer | Wickets captured |
| overs_bowled | Float | Overs bowled |
| economy_rate | Float | Runs per over |
| catches | Integer | Catches taken |
| match_result | String | Win/Loss/Tie |
| toss_winner | String | Team winning toss |
| season | Integer | Season number |

### 2.2 Supporting Data Files

| File | Purpose |
|------|---------|
| team_performance_summary.csv | Aggregated team win/loss records |
| toss_impact.csv | Toss outcome correlation analysis |
| match_level_results.csv | Individual match outcomes |

---

## 3. Analytical KPI Design

### 3.1 Team Performance KPIs

**Win Rate**

$$\text{Win Rate} = \frac{\text{Total Wins}}{\text{Total Matches Played}} \times 100$$

**Team Batting Average**

$$\text{Batting Average} = \frac{\text{Total Runs Scored}}{\text{Total Dismissals}}$$

**Team Strike Rate**

$$\text{Strike Rate} = \frac{\text{Total Runs Scored}}{\text{Total Balls Faced}} \times 100$$

**Team Economy Rate**

$$\text{Economy Rate} = \frac{\text{Total Runs Conceded}}{\text{Total Overs Bowled}}$$

---

### 3.2 Player Performance KPIs

**Total Player Points**

$$\text{Total Points} = P_{batting} + P_{bowling} + P_{fielding}$$

Where:

**Batting Points:**
$$P_{batting} = R + (F \times 1) + (S \times 2)$$

- R = Runs scored
- F = Number of fours
- S = Number of sixes

**Bowling Points:**
$$P_{bowling} = (W \times 25) + B_{economy}$$

- W = Wickets taken
- B_economy = 10 if economy rate < 6, otherwise 0

**Fielding Points:**
$$P_{fielding} = (C + RO + ST) \times 10$$

- C = Catches
- RO = Run outs
- ST = Stumpings

**Player Impact Score:**
$$\text{Impact Score} = \frac{R}{10} + (W \times 15)$$

---

### 3.3 Player Form Classification

| Form Level | Criteria |
|------------|----------|
| **Hot** | Average runs > 30 OR wickets per match > 1.5 |
| **Good** | Average runs > 20 OR wickets per match > 1.0 |
| **Average** | Default classification |
| **Poor** | Average runs < 10 AND wickets per match < 0.5 |

---

## 4. Comparative Metrics

### 4.1 Team Comparison Dimensions

| Metric | Formula | Favorable Direction |
|--------|---------|---------------------|
| Average Score | X̄_score = ΣR_i / n | Higher is better |
| Strike Rate | SR = (R / B) × 100 | Higher is better |
| Economy Rate | Econ = RC / O | Lower is better |
| Average Wickets | X̄_wickets = ΣW_i / n | Higher is better |

Where:
- R_i = Runs in match i
- n = Number of matches
- B = Balls faced
- RC = Runs conceded
- O = Overs bowled
- W_i = Wickets in match i

---

### 4.2 Player Radar Chart Normalization

All metrics normalized to 0-100 scale for comparative visualization:

**Normalized Runs:**
$$N_{runs} = \min\left(\frac{R_{total}}{600} \times 100, 100\right)$$

**Normalized Wickets:**
$$N_{wickets} = \min\left(\frac{W_{total}}{30} \times 100, 100\right)$$

**Normalized Fours:**
$$N_{fours} = \min\left(\frac{F_{total}}{60} \times 100, 100\right)$$

**Normalized Sixes:**
$$N_{sixes} = \min\left(\frac{S_{total}}{30} \times 100, 100\right)$$

**Normalized Strike Rate:**
$$N_{SR} = \min\left(\frac{SR}{200} \times 100, 100\right)$$

---

### 4.3 Pareto Analysis (80/20 Rule)

**Cumulative Contribution Percentage:**

$$C_i = \frac{\sum_{j=1}^{i} R_j}{\sum_{k=1}^{n} R_k} \times 100$$

Where:
- C_i = Cumulative percentage at player i
- R_j = Runs by player j (sorted descending)
- n = Total number of players

**80% Threshold Identification:**
$$\text{Key Contributors} = \min\{i : C_i \geq 80\}$$

---

## 5. Toss Impact Analysis

### 5.1 Toss Win Rate Calculation

$$\text{Toss Win Rate} = \frac{\text{Matches where team won toss}}{\text{Total matches played}} \times 100$$

### 5.2 Toss Conversion Rate

$$\text{Toss Conversion} = \frac{\text{Matches won after winning toss}}{\text{Matches where toss was won}} \times 100$$

### 5.3 Toss Advantage Factor

$$\text{Toss Advantage} = \frac{\text{Win Rate}_{toss\_won} - 50}{10}$$

This factor quantifies how much winning the toss influences match outcomes beyond random chance (50%).

---

## 6. Baseline Modeling

### 6.1 Win Probability Prediction Model

**Base Model:**

$$P_{win}(T_1) = \frac{WR_1}{WR_1 + WR_2} \times 100$$

Where:
- P_win(T_1) = Win probability for Team 1
- WR_1 = Historical win rate of Team 1
- WR_2 = Historical win rate of Team 2

---

### 6.2 Prediction Factor Adjustments

The final probability incorporates multiple weighted factors:

$$P_{final}(T_1) = P_{base} + \sum_{i=1}^{n} \Delta_i$$

**Factor 1: Historical Performance Impact**

$$\Delta_{history} = \text{clamp}\left(\frac{WR_1 - WR_2}{2}, -15, 15\right)$$

**Factor 2: Batting Strength Impact**

$$\Delta_{batting} = \text{clamp}\left(\frac{\bar{X}_{score,1} - \bar{X}_{score,2}}{10}, -10, 10\right)$$

**Factor 3: Bowling Economy Impact**

$$\Delta_{bowling} = \text{clamp}\left((Econ_2 - Econ_1) \times 2, -8, 8\right)$$

**Factor 4: Strike Rate Impact**

$$\Delta_{SR} = \text{clamp}\left(\frac{SR_1 - SR_2}{5}, -7, 7\right)$$

**Factor 5: Toss Advantage**

| Condition | Δ_toss |
|-----------|--------|
| Team 1 wins toss | +5% |
| Team 2 wins toss | -5% |
| No toss data | 0% |

**Factor 6: Home Advantage**

| Condition | Δ_venue |
|-----------|---------|
| Team 1 at home | +5% |
| Team 2 at home | -5% |
| Neutral venue | 0% |

**Factor 7: Head-to-Head Record**

$$\Delta_{H2H} = \text{clamp}\left((H2H_1 - H2H_2) \times 2, -10, 10\right)$$

Where H2H_1 and H2H_2 are head-to-head wins for each team.

**Factor 8: Recent Form**

$$\Delta_{form} = (W_{recent,1} - W_{recent,2}) \times 2$$

Where W_recent = wins in last 5 matches.

---

### 6.3 Probability Normalization

**Clamping:**
$$P_{clamped} = \text{clamp}(P_{adjusted}, 10, 90)$$

**Final Normalization:**
$$P_{normalized}(T_1) = \frac{P_{clamped,1}}{P_{clamped,1} + P_{clamped,2}} \times 100$$

---

### 6.4 Confidence Level Classification

| Win Probability | Confidence Level |
|-----------------|------------------|
| > 70% | High |
| 55% - 70% | Medium |
| < 55% | Low |

---

### 6.5 Score Prediction Model

**Predicted Score Range:**

$$Score_{min} = \bar{X}_{score} \times 0.85$$
$$Score_{max} = \bar{X}_{score} \times 1.15$$

This provides a ±15% variance around the historical average score.

---

### 6.6 Player Performance Prediction

**Predicted Runs:**
$$\hat{R} = \bar{X}_{runs} \times (0.9 + \epsilon)$$

**Predicted Wickets:**
$$\hat{W} = \bar{X}_{wickets} \times (0.8 + \epsilon)$$

Where ε is a random variance factor:
- For runs: ε ∈ [0, 0.3]
- For wickets: ε ∈ [0, 0.4]

---

## 7. Descriptive Analytics Module

### 7.1 Purpose
Provides historical data summary answering "What happened?"

### 7.2 Summary Statistics

| Metric | Calculation Method |
|--------|-------------------|
| Total Matches | Count of unique match identifiers |
| Total Players | Count of unique player names |
| Total Runs | Sum of all runs_scored values |
| Total Wickets | Sum of all wickets_taken values |
| Total Boundaries | Sum of fours + sixes |

### 7.3 Best Team Identification

$$\text{Best Team} = \arg\max_{t \in Teams}(WR_t)$$

### 7.4 Visualizations Generated

1. **Team Win/Loss Bar Chart** - Grouped comparison of wins, losses, ties
2. **Team Win Rate Chart** - Performance percentage comparison
3. **Top Run Scorers** - Horizontal bar ranking by total runs
4. **Top Wicket Takers** - Horizontal bar ranking by total wickets
5. **Pareto Chart** - Contribution distribution with cumulative line
6. **Player Radar Chart** - Multi-dimensional performance comparison

---

## 8. Predictive Analytics Module

### 8.1 Purpose
Forecasts match outcomes answering "What will happen?"

### 8.2 Input Parameters

| Parameter | Options | Effect |
|-----------|---------|--------|
| Team 1 | All NPL teams | Primary team for prediction |
| Team 2 | All NPL teams | Opposition team |
| Toss Winner | Team 1 / Team 2 / None | ±5% probability shift |
| Venue | Home T1 / Home T2 / Neutral | ±5% probability shift |

### 8.3 Output Metrics

- Win probability percentage
- Confidence level (High/Medium/Low)
- Predicted score range
- Key players with impact scores
- Head-to-head historical record
- Factor-by-factor breakdown

### 8.4 Visualizations Generated

1. **Win Probability Donut Chart** - Visual probability display
2. **Team Comparison Table** - Side-by-side metrics
3. **Key Players Cards** - Top performers per team
4. **Factor Impact Bars** - Color-coded influence indicators

---

## 9. Diagnostic Analytics Module

### 9.1 Purpose
Identifies root causes answering "Why did it happen?"

### 9.2 Team Winning Reasons Analysis

The system evaluates multiple performance thresholds to identify success factors:

| Factor | Threshold | Score Formula |
|--------|-----------|---------------|
| Strong Batting Average | X̄_bat > 20 | min(100, X̄_bat × 4) |
| High Strike Rate | SR > 120 | min(100, SR × 0.7) |
| Economical Bowling | Econ < 8 | min(100, (10 - Econ) × 15) |
| Wicket-Taking Ability | W_total > 50 | min(100, W_total × 1.5) |
| Power Hitting | S_total > 30 | min(100, S_total × 2) |
| Toss Utilization | W_after_toss > 0.4 × W_total | Fixed score: 70 |

### 9.3 Player Performance Classification

**Strength Indicators:**
- Total runs > 200 → "Consistent Run Scorer"
- Strike rate > 130 → "Aggressive Batting Style"
- Total sixes > 10 → "Power Hitter"
- Total wickets > 10 → "Wicket-Taking Bowler"
- Economy < 7 → "Economical Bowler"
- Catches > 5 → "Safe Fielder"

**Weakness Indicators:**
- Strike rate < 100 (with runs > 100) → "Conservative Approach"
- Economy > 9 (with overs > 10) → "Expensive Bowling"

### 9.4 Player Overall Rating

$$\text{Rating} = R_{bat} + R_{SR} + R_{bowl} + R_{econ} + R_{field}$$

Where:

| Component | Formula | Max Points |
|-----------|---------|------------|
| R_bat | min(35, (R_total / 500) × 35) | 35 |
| R_SR | min(20, (SR / 150) × 20) | 20 |
| R_bowl | min(25, (W_total / 20) × 25) | 25 |
| R_econ | min(10, ((10 - Econ) / 10) × 10) | 10 |
| R_field | min(10, C_total) | 10 |

**Maximum possible rating: 100 points**

---

## 10. Chart Components

### 10.1 Chart Types

| Chart Name | Type | Purpose |
|------------|------|---------|
| WinLossBarChart | Grouped Bar | Team win/loss comparison |
| TeamBarChart | Single Bar | Win rate visualization |
| HorizontalBarChart | Horizontal Bar | Player rankings |
| PlayerRadarChart | Radar/Spider | Multi-metric comparison |
| ParetoChart | Composed (Bar + Line) | Contribution analysis |
| TrendLineChart | Area | Performance over time |
| WinRatePieChart | Donut | Proportional display |

### 10.2 Color Palette

**Standard Colors:**
- Wins: Green (#22C55E)
- Losses: Red (#EF4444)
- Ties: Amber (#F59E0B)
- Primary: Indigo (#8338EC)
- Secondary: Blue (#3A86FF)

**Team Colors:**
| Team | Color Code |
|------|------------|
| Biratnagar Kings | #E63946 |
| Janakpur Bolts | #F4A261 |
| Kathmandu Gurkhas | #2A9D8F |
| Chitwan Rhinos | #264653 |
| Karnali Yaks | #8338EC |
| Lumbini Lions | #FB5607 |
| Pokhara Avengers | #3A86FF |
| Sudur Paschim Royals | #FF006E |

---

## Summary

The NPL Cricket Analytics Dashboard provides comprehensive cricket analysis through:

1. **Analytical KPI Design** - Well-defined mathematical formulas for performance measurement
2. **Comparative Metrics** - Normalized multi-dimensional comparison framework
3. **Toss Impact Analysis** - Statistical correlation between toss and match outcomes
4. **Baseline Modeling** - Weighted factor-based prediction with multiple adjustments

The prediction model achieves reasonable accuracy by combining 8 distinct factors with appropriate weight limits, ensuring no single factor dominates the final probability calculation.

---

*Document Version: 1.0*  
*Last Updated: February 2026*  
*Project: NPL Cricket Analytics Dashboard*
