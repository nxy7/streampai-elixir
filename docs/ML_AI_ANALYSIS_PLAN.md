# ML/AI Analysis Feature Plan for Streampai

## Executive Summary

This document outlines a comprehensive plan for introducing machine learning and AI-powered analysis features to Streampai. The goal is to help streamers discover patterns in their data, understand their audience better, and receive actionable recommendations for growth.

---

## 1. Feature Categories

### 1.1 Stream Performance Analysis
- **Peak Time Detection**: Identify when a streamer has the most viewers historically
- **Optimal Duration Recommendations**: Analyze viewer retention vs. stream length
- **Content Category Performance**: Which games/categories perform best
- **Platform Performance Comparison**: Which platforms bring better engagement

### 1.2 Viewer Intelligence
- **Viewer Behavior Summaries** (AI-generated): Concise summaries of notable viewer activity
- **Loyalty Classification**: Regular, occasional, one-time viewer identification
- **VIP Auto-Detection**: Identify highly engaged community members
- **Churn Prediction**: Detect viewers at risk of leaving

### 1.3 Chat & Community Analytics
- **Sentiment Analysis**: Overall stream chat sentiment trends
- **Engagement Patterns**: When chat is most active during streams
- **Community Health Score**: Toxicity, positivity, and moderation load metrics
- **Topic Extraction**: What subjects generate the most discussion

### 1.4 Growth Recommendations
- **Stream Consistency Analysis**: Optimal streaming schedule recommendations
- **Cross-Platform Strategy**: Where to focus multi-streaming efforts
- **Content Suggestions**: Tags, categories based on successful patterns
- **Audience Growth Forecasting**: Projected follower/subscriber growth

---

## 2. Technical Architecture

### 2.1 ML Processing Approach Options

#### Option A: Elixir-Native ML (Recommended for Phase 1)
```
┌─────────────────────┐     ┌─────────────────────┐
│   Oban Job Queue    │────►│   Elixir ML Layer   │
│  (ProcessFinished   │     │    (Nx/Axon for     │
│   LivestreamJob)    │     │  numeric analysis)  │
└─────────────────────┘     └─────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │     PostgreSQL      │
                            │  (Results Storage)  │
                            └─────────────────────┘
```

**Pros**:
- No external service dependencies
- Low latency for simple analytics
- Integrated with existing Oban job system
- Nx/Axon ecosystem is maturing rapidly

**Best For**: Statistical analysis, time-series patterns, rule-based classifications

**Libraries**:
- `Nx` - Numerical computing (tensors, matrix operations)
- `Axon` - Neural networks (if needed)
- `Scholar` - Traditional ML algorithms (clustering, classification)
- `Explorer` - DataFrames for data manipulation

#### Option B: External Python ML Service (Recommended for Phase 2+)
```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Oban Job Queue    │────►│   HTTP/gRPC Call    │────►│   Python Service    │
│  (AnalysisJob)      │     │                     │     │  (FastAPI + scikit) │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
                                                                   │
         ┌─────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────┐
│   Callback to Ash   │
│  (Store Results)    │
└─────────────────────┘
```

**Pros**:
- Rich ML ecosystem (scikit-learn, transformers, spaCy)
- Pre-trained models for sentiment, NER, etc.
- GPU support for heavy workloads
- More mature tooling for complex ML

**Best For**: NLP (sentiment, summaries), complex predictions, deep learning

#### Option C: LLM API Integration (For Viewer Summaries)
```
┌─────────────────────┐     ┌─────────────────────┐
│   Oban Job Queue    │────►│  LLM API (OpenAI/   │
│  (ViewerSummaryJob) │     │  Anthropic/Local)   │
└─────────────────────┘     └─────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │  StreamViewer.      │
                            │  ai_summary Field   │
                            └─────────────────────┘
```

**Pros**:
- Excellent for natural language generation (viewer summaries)
- Can be used sparingly for high-value insights
- No training required

**Cons**:
- Per-token costs
- Privacy considerations for chat data

**Best For**: Viewer profile summaries, recommendation explanations, periodic insights

### 2.2 Recommended Hybrid Architecture (Final)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STREAMPAI BACKEND                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────┐    │
│  │  Stream     │───►│              OBAN JOB QUEUE                     │    │
│  │  Ends       │    │  ┌─────────────┐  ┌─────────────────────────┐  │    │
│  └─────────────┘    │  │Process      │  │ AnalyzeStream           │  │    │
│                     │  │Finished     │──│ ViewerSummary           │  │    │
│  ┌─────────────┐    │  │Livestream   │  │ ChatSentiment           │  │    │
│  │  Scheduled  │───►│  │Job          │  │ GrowthRecommendations   │  │    │
│  │  (hourly/   │    │  └─────────────┘  └─────────────────────────┘  │    │
│  │   daily)    │    │                              │                  │    │
│  └─────────────┘    └──────────────────────────────│──────────────────┘    │
│                                                    │                        │
│                          ┌─────────────────────────┼─────────────────┐      │
│                          │                         │                 │      │
│                          ▼                         ▼                 ▼      │
│                 ┌─────────────────┐    ┌─────────────────┐   ┌──────────┐  │
│                 │ Elixir ML Layer │    │ External ML Svc │   │ LLM API  │  │
│                 │ (Nx/Scholar)    │    │ (Python/FastAPI)│   │ (OpenAI) │  │
│                 │                 │    │                 │   │          │  │
│                 │ - Statistics    │    │ - Sentiment     │   │ - Viewer │  │
│                 │ - Time patterns │    │ - Clustering    │   │   Summary│  │
│                 │ - Classification│    │ - Predictions   │   │ - Insight│  │
│                 └────────┬────────┘    └────────┬────────┘   └────┬─────┘  │
│                          │                      │                 │        │
│                          └──────────────────────┼─────────────────┘        │
│                                                 │                          │
│                                                 ▼                          │
│                              ┌─────────────────────────────────┐           │
│                              │          POSTGRESQL             │           │
│                              │  ┌───────────────────────────┐  │           │
│                              │  │ ML Results Tables         │  │           │
│                              │  │ - StreamAnalysis          │  │           │
│                              │  │ - ViewerInsights          │  │           │
│                              │  │ - ChatSentiment           │  │           │
│                              │  │ - Recommendations         │  │           │
│                              │  └───────────────────────────┘  │           │
│                              └─────────────────────────────────┘           │
│                                                 │                          │
│                                                 │ Electric SQL             │
│                                                 ▼                          │
│                              ┌─────────────────────────────────┐           │
│                              │      FRONTEND (SolidJS)         │           │
│                              │  - Analytics Dashboard          │           │
│                              │  - Insights Panel               │           │
│                              │  - Viewer Profiles              │           │
│                              │  - Recommendations View         │           │
│                              └─────────────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model Extensions

### 3.1 New Ash Resources

```elixir
# lib/streampai/analytics/stream_analysis.ex
defmodule Streampai.Analytics.StreamAnalysis do
  use Ash.Resource,
    domain: Streampai.Analytics,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "stream_analyses"
    repo Streampai.Repo
  end

  attributes do
    uuid_primary_key :id

    # Core metrics
    attribute :engagement_score, :float        # 0-100 overall engagement rating
    attribute :retention_rate, :float          # % viewers who stayed > 10 min
    attribute :chat_sentiment_score, :float    # -1.0 to 1.0 (negative to positive)
    attribute :peak_engagement_times, {:array, :map}  # [{minute: 45, score: 0.9}]

    # Pattern analysis
    attribute :viewer_growth_rate, :float      # % change from previous stream
    attribute :category_fit_score, :float      # How well content matched category
    attribute :optimal_duration_estimate, :integer  # Recommended length in minutes

    # Recommendations (JSON array)
    attribute :recommendations, {:array, :map}
    # Example: [
    #   {type: "timing", message: "Your peak engagement was at minute 45...", priority: "high"},
    #   {type: "content", message: "Consider shorter streams...", priority: "medium"}
    # ]

    create_timestamp :created_at
    update_timestamp :updated_at
  end

  relationships do
    belongs_to :livestream, Streampai.Stream.Livestream do
      allow_nil? false
      primary_key? true
    end
  end
end
```

```elixir
# lib/streampai/analytics/viewer_insight.ex
defmodule Streampai.Analytics.ViewerInsight do
  use Ash.Resource,
    domain: Streampai.Analytics,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "viewer_insights"
    repo Streampai.Repo
  end

  attributes do
    uuid_primary_key :id

    # Classification
    attribute :loyalty_tier, :atom do
      constraints one_of: [:vip, :regular, :occasional, :new, :churning, :churned]
    end

    attribute :engagement_score, :float         # 0-100 engagement rating
    attribute :churn_risk, :float               # 0-1 probability of churning
    attribute :sentiment_trend, :atom do        # Overall sentiment toward streamer
      constraints one_of: [:very_positive, :positive, :neutral, :negative, :very_negative]
    end

    # Behavior patterns
    attribute :avg_watch_duration_minutes, :integer
    attribute :chat_frequency, :atom do         # How often they chat
      constraints one_of: [:very_active, :active, :occasional, :lurker]
    end
    attribute :preferred_stream_times, {:array, :map}  # [{day: "saturday", hour: 20}]
    attribute :topics_of_interest, {:array, :string}   # Extracted from chat

    # Engagement history
    attribute :total_donations, :decimal
    attribute :subscription_months, :integer
    attribute :raid_participation, :integer

    create_timestamp :created_at
    update_timestamp :updated_at
  end

  relationships do
    belongs_to :stream_viewer, Streampai.Stream.StreamViewer do
      allow_nil? false
    end
  end
end
```

```elixir
# lib/streampai/analytics/growth_recommendation.ex
defmodule Streampai.Analytics.GrowthRecommendation do
  use Ash.Resource,
    domain: Streampai.Analytics,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "growth_recommendations"
    repo Streampai.Repo
  end

  attributes do
    uuid_primary_key :id

    attribute :category, :atom do
      constraints one_of: [:schedule, :content, :engagement, :platform, :community]
    end

    attribute :priority, :atom do
      constraints one_of: [:critical, :high, :medium, :low]
    end

    attribute :title, :string
    attribute :description, :string
    attribute :action_items, {:array, :string}
    attribute :supporting_data, :map            # Evidence/metrics backing the recommendation

    attribute :status, :atom do
      constraints one_of: [:active, :dismissed, :completed]
      default :active
    end

    attribute :expires_at, :utc_datetime        # Some recommendations are time-sensitive

    create_timestamp :created_at
    update_timestamp :updated_at
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
    end
  end
end
```

### 3.2 Extend Existing Resources

```elixir
# Add to StreamViewer (already has ai_summary field)
# Consider adding:
attribute :loyalty_tier, :atom do
  constraints one_of: [:vip, :regular, :occasional, :new, :churning, :churned]
  allow_nil? true
end

attribute :engagement_score, :float do
  allow_nil? true
end

attribute :last_analyzed_at, :utc_datetime do
  allow_nil? true
end
```

```elixir
# Add to ChatMessage for sentiment tracking
attribute :sentiment, :atom do
  constraints one_of: [:positive, :negative, :neutral]
  allow_nil? true
end

attribute :sentiment_score, :float do  # -1.0 to 1.0 for more granularity
  allow_nil? true
end
```

---

## 4. Implementation Phases

### Phase 1: Foundation (2-3 weeks effort)

**Goal**: Basic statistical analysis without external services

#### 4.1.1 Statistical Stream Analysis
```elixir
# lib/streampai/analytics/analyzers/stream_stats_analyzer.ex
defmodule Streampai.Analytics.Analyzers.StreamStatsAnalyzer do
  @moduledoc """
  Analyzes stream performance using basic statistics.
  No external ML services required.
  """

  def analyze(livestream_id) do
    livestream = load_livestream_with_data(livestream_id)

    %{
      engagement_score: calculate_engagement_score(livestream),
      retention_rate: calculate_retention_rate(livestream),
      peak_times: find_peak_engagement_times(livestream),
      viewer_growth: calculate_growth_vs_previous(livestream),
      recommendations: generate_basic_recommendations(livestream)
    }
  end

  defp calculate_engagement_score(livestream) do
    # Weighted combination of:
    # - Chat messages per viewer
    # - Average watch time vs stream length
    # - Event participation (follows, subs, donations)
    # - Viewer retention curve
  end

  defp calculate_retention_rate(livestream) do
    # Compare viewers at start vs end
    # Analyze LivestreamMetric time series
  end

  defp find_peak_engagement_times(livestream) do
    # Find when chat activity peaked
    # Correlate with viewer count peaks
    # Identify content moments (game changes, events)
  end
end
```

#### 4.1.2 Viewer Classification System
```elixir
# lib/streampai/analytics/analyzers/viewer_classifier.ex
defmodule Streampai.Analytics.Analyzers.ViewerClassifier do
  @moduledoc """
  Classifies viewers into loyalty tiers based on activity patterns.
  """

  @tier_thresholds %{
    vip: %{streams_attended: 20, messages: 100, events: 5},
    regular: %{streams_attended: 10, messages: 30, events: 2},
    occasional: %{streams_attended: 3, messages: 5, events: 0},
    new: %{streams_attended: 1, messages: 0, events: 0}
  }

  def classify(stream_viewer) do
    stats = gather_viewer_stats(stream_viewer)

    cond do
      meets_vip_criteria?(stats) -> :vip
      meets_regular_criteria?(stats) -> :regular
      meets_occasional_criteria?(stats) -> :occasional
      is_churning?(stats) -> :churning
      true -> :new
    end
  end

  defp is_churning?(stats) do
    # No activity in last 30 days but was previously active
    days_since_last_seen = Date.diff(Date.utc_today(), stats.last_seen_at)
    stats.total_streams > 3 && days_since_last_seen > 30
  end
end
```

#### 4.1.3 Basic Oban Jobs
```elixir
# lib/streampai/analytics/jobs/analyze_stream_job.ex
defmodule Streampai.Analytics.Jobs.AnalyzeStreamJob do
  use Oban.Worker, queue: :analytics, max_attempts: 3

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"livestream_id" => livestream_id}}) do
    # Run after stream ends
    analysis = Streampai.Analytics.Analyzers.StreamStatsAnalyzer.analyze(livestream_id)

    Streampai.Analytics.StreamAnalysis
    |> Ash.Changeset.for_create(:create, Map.put(analysis, :livestream_id, livestream_id))
    |> Ash.create!()

    :ok
  end
end
```

#### 4.1.4 Frontend: Analytics Dashboard Enhancement
- Add "Insights" card to analytics page
- Display engagement score, recommendations
- Show viewer tier breakdown
- Time-based performance chart

**Deliverables**:
- [ ] StreamAnalysis Ash resource
- [ ] ViewerInsight Ash resource
- [ ] StreamStatsAnalyzer module
- [ ] ViewerClassifier module
- [ ] AnalyzeStreamJob Oban worker
- [ ] ClassifyViewersJob Oban worker (scheduled nightly)
- [ ] Analytics dashboard "Insights" section
- [ ] Viewer tier badges in viewer list

---

### Phase 2: Natural Language Intelligence (2-3 weeks effort)

**Goal**: Add NLP capabilities for chat analysis and viewer summaries

#### 4.2.1 Chat Sentiment Analysis

**Option A: Elixir-native with pre-trained model**
```elixir
# Using Bumblebee for transformer models in Elixir
defmodule Streampai.Analytics.Analyzers.SentimentAnalyzer do
  def analyze_message(text) do
    # Load pre-trained sentiment model (one-time on startup)
    {:ok, model} = Bumblebee.load_model({:hf, "cardiffnlp/twitter-roberta-base-sentiment"})
    {:ok, tokenizer} = Bumblebee.load_tokenizer({:hf, "cardiffnlp/twitter-roberta-base-sentiment"})

    serving = Bumblebee.Text.text_classification(model, tokenizer)

    %{predictions: [%{label: label, score: score} | _]} = Nx.Serving.run(serving, text)

    %{
      sentiment: normalize_label(label),
      confidence: score
    }
  end
end
```

**Option B: External Python service (recommended for accuracy)**
```python
# ml_service/sentiment.py
from transformers import pipeline
from fastapi import FastAPI

app = FastAPI()
sentiment_pipeline = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment")

@app.post("/sentiment/batch")
async def analyze_batch(messages: list[str]):
    results = sentiment_pipeline(messages)
    return [{"sentiment": r["label"], "score": r["score"]} for r in results]
```

#### 4.2.2 Viewer Summary Generation (LLM)
```elixir
# lib/streampai/analytics/analyzers/viewer_summary_generator.ex
defmodule Streampai.Analytics.Analyzers.ViewerSummaryGenerator do
  @moduledoc """
  Generates natural language summaries for notable viewers using LLM.
  """

  def generate_summary(stream_viewer) do
    stats = gather_comprehensive_stats(stream_viewer)

    prompt = build_summary_prompt(stats)

    {:ok, response} = call_llm_api(prompt)

    # Store in StreamViewer.ai_summary
    stream_viewer
    |> Ash.Changeset.for_update(:update, %{ai_summary: response.summary})
    |> Ash.update!()
  end

  defp build_summary_prompt(stats) do
    """
    Generate a concise 2-3 sentence summary for a stream viewer with these characteristics:

    - First seen: #{stats.first_seen_at}
    - Last seen: #{stats.last_seen_at}
    - Total streams attended: #{stats.streams_attended}
    - Total chat messages: #{stats.message_count}
    - Engagement events: #{stats.events_summary}
    - Average sentiment: #{stats.avg_sentiment}
    - Is moderator: #{stats.is_moderator}
    - Is subscriber/patron: #{stats.is_patreon}

    Focus on their engagement level, notable behavior patterns, and value to the community.
    Be concise and factual.
    """
  end
end
```

#### 4.2.3 Batch Processing Job
```elixir
# lib/streampai/analytics/jobs/process_chat_sentiment_job.ex
defmodule Streampai.Analytics.Jobs.ProcessChatSentimentJob do
  use Oban.Worker, queue: :analytics, max_attempts: 3

  @batch_size 100

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"livestream_id" => livestream_id}}) do
    # Process chat messages in batches
    Streampai.Stream.ChatMessage
    |> Ash.Query.filter(livestream_id == ^livestream_id and is_nil(sentiment))
    |> Ash.Query.limit(@batch_size)
    |> Ash.read!()
    |> Enum.map(&analyze_and_update/1)

    :ok
  end
end
```

**Deliverables**:
- [ ] SentimentAnalyzer module (Elixir or Python service)
- [ ] ChatMessage sentiment field migration
- [ ] ProcessChatSentimentJob Oban worker
- [ ] ViewerSummaryGenerator module (LLM integration)
- [ ] GenerateViewerSummariesJob Oban worker (for notable viewers)
- [ ] Chat sentiment visualization on stream details page
- [ ] AI summary display on viewer profile cards

---

### Phase 3: Predictive Analytics (3-4 weeks effort)

**Goal**: Add forecasting and anomaly detection

#### 4.3.1 Viewer Churn Prediction
```elixir
defmodule Streampai.Analytics.Analyzers.ChurnPredictor do
  @moduledoc """
  Predicts which viewers are at risk of churning based on activity patterns.
  Uses a simple logistic regression model trained on historical data.
  """

  def predict_churn_risk(stream_viewer) do
    features = extract_features(stream_viewer)

    # Features:
    # - Days since last seen
    # - Activity trend (increasing/decreasing)
    # - Engagement depth (messages per stream)
    # - Social connections (moderator status, mentions others)
    # - Event participation trend

    model = load_trained_model()

    Scholar.Linear.LogisticRegression.predict_probability(model, features)
  end

  defp extract_features(viewer) do
    Nx.tensor([
      days_since_last_seen(viewer),
      activity_trend_slope(viewer),
      avg_messages_per_stream(viewer),
      has_social_connections?(viewer) |> bool_to_float(),
      event_participation_rate(viewer)
    ])
  end
end
```

#### 4.3.2 Stream Performance Forecasting
```elixir
defmodule Streampai.Analytics.Analyzers.PerformanceForecaster do
  @moduledoc """
  Forecasts expected viewer counts and engagement for upcoming streams.
  """

  def forecast_next_stream(user_id, params \\ %{}) do
    historical_data = load_historical_streams(user_id)

    %{
      expected_peak_viewers: forecast_peak_viewers(historical_data, params),
      expected_avg_viewers: forecast_avg_viewers(historical_data, params),
      optimal_start_time: recommend_start_time(historical_data),
      optimal_duration: recommend_duration(historical_data),
      confidence_interval: calculate_confidence(historical_data)
    }
  end

  defp forecast_peak_viewers(data, params) do
    # Time series forecasting using:
    # - Day of week patterns
    # - Time of day patterns
    # - Category/game effects
    # - Growth trend
    # - Seasonality (if enough data)
  end
end
```

#### 4.3.3 Anomaly Detection
```elixir
defmodule Streampai.Analytics.Analyzers.AnomalyDetector do
  @moduledoc """
  Detects unusual patterns in stream metrics.
  """

  def detect_anomalies(livestream) do
    metrics = load_time_series_metrics(livestream)

    anomalies = []

    # Viewer spike detection
    if viewer_spike?(metrics) do
      anomalies = [{:viewer_spike, detect_spike_details(metrics)} | anomalies]
    end

    # Chat surge detection
    if chat_surge?(metrics) do
      anomalies = [{:chat_surge, detect_surge_details(metrics)} | anomalies]
    end

    # Unusual drop-off
    if unusual_dropoff?(metrics) do
      anomalies = [{:viewer_dropoff, detect_dropoff_details(metrics)} | anomalies]
    end

    anomalies
  end
end
```

**Deliverables**:
- [ ] ChurnPredictor module with trained model
- [ ] PerformanceForecaster module
- [ ] AnomalyDetector module
- [ ] Churn risk indicators in viewer list
- [ ] "At Risk" viewer segment view
- [ ] Stream forecast widget on dashboard
- [ ] Real-time anomaly alerts during streams

---

### Phase 4: Growth Recommendations Engine (2-3 weeks effort)

**Goal**: Actionable, personalized growth recommendations

#### 4.4.1 Recommendation Engine
```elixir
defmodule Streampai.Analytics.RecommendationEngine do
  @moduledoc """
  Generates personalized growth recommendations based on all analytics data.
  """

  def generate_recommendations(user_id) do
    user_data = load_comprehensive_user_data(user_id)

    recommendations = []

    # Schedule optimization
    recommendations = recommendations ++ schedule_recommendations(user_data)

    # Content optimization
    recommendations = recommendations ++ content_recommendations(user_data)

    # Engagement optimization
    recommendations = recommendations ++ engagement_recommendations(user_data)

    # Platform optimization
    recommendations = recommendations ++ platform_recommendations(user_data)

    # Community building
    recommendations = recommendations ++ community_recommendations(user_data)

    # Prioritize and deduplicate
    recommendations
    |> prioritize()
    |> Enum.take(10)
    |> persist_recommendations(user_id)
  end

  defp schedule_recommendations(data) do
    # Analyze:
    # - Best performing days/times
    # - Consistency patterns
    # - Optimal stream duration
    # - Break patterns

    [
      %{
        category: :schedule,
        priority: :high,
        title: "Stream more on Saturdays",
        description: "Your Saturday streams have 40% higher engagement than weekday streams.",
        action_items: [
          "Consider moving one weekday stream to Saturday",
          "Saturday 8 PM appears to be your optimal time"
        ],
        supporting_data: %{
          saturday_avg_viewers: 150,
          weekday_avg_viewers: 107,
          improvement_potential: "40%"
        }
      }
    ]
  end
end
```

#### 4.4.2 Recommendation Categories

1. **Schedule Recommendations**
   - Optimal streaming days/times
   - Stream frequency suggestions
   - Duration optimization
   - Break scheduling

2. **Content Recommendations**
   - Best performing categories
   - Tag suggestions from chat analysis
   - Title/description optimization
   - New category exploration

3. **Engagement Recommendations**
   - Chat interaction patterns
   - Viewer retention strategies
   - Community event suggestions
   - Raid/host opportunities

4. **Platform Recommendations**
   - Multi-platform performance comparison
   - Platform-specific strategies
   - Cross-promotion opportunities

5. **Community Recommendations**
   - VIP recognition suggestions
   - Moderator recommendations
   - Viewer retention strategies
   - Community event ideas

**Deliverables**:
- [ ] GrowthRecommendation Ash resource
- [ ] RecommendationEngine module
- [ ] GenerateRecommendationsJob Oban worker (weekly)
- [ ] Recommendations dashboard page
- [ ] Recommendation cards with actionable items
- [ ] Recommendation tracking (dismissed/completed)

---

## 5. LLM Integration Strategy

### 5.1 When to Use LLMs

| Use Case | LLM Suitable? | Alternative |
|----------|--------------|-------------|
| Viewer summaries | ✅ Yes | Template-based summaries |
| Recommendation explanations | ✅ Yes | Pre-written templates |
| Chat topic extraction | ✅ Yes | Keyword extraction |
| Sentiment analysis | ⚠️ Overkill | Pre-trained classifier |
| Anomaly detection | ❌ No | Statistical methods |
| Time series forecasting | ❌ No | ML models (Prophet, ARIMA) |
| Viewer classification | ❌ No | Rule-based + simple ML |

### 5.2 LLM Cost Management

```elixir
defmodule Streampai.Analytics.LLMRateLimiter do
  @daily_budget_dollars 10
  @cost_per_1k_tokens 0.002  # GPT-3.5 pricing

  def should_generate_summary?(viewer) do
    # Only generate for notable viewers
    cond do
      viewer.loyalty_tier in [:vip, :regular] -> true
      viewer.total_donations > 0 -> true
      viewer.is_moderator -> true
      recently_active?(viewer) && high_engagement?(viewer) -> true
      true -> false
    end
  end

  def within_budget? do
    today_cost = get_today_llm_cost()
    today_cost < @daily_budget_dollars
  end
end
```

### 5.3 Privacy Considerations

```elixir
defmodule Streampai.Analytics.DataSanitizer do
  @moduledoc """
  Sanitizes data before sending to external LLM services.
  """

  def sanitize_for_llm(data) do
    data
    |> remove_pii()
    |> anonymize_usernames()
    |> redact_sensitive_content()
    |> truncate_to_context_limit()
  end

  defp remove_pii(data) do
    # Remove emails, IPs, etc.
  end

  defp anonymize_usernames(data) do
    # Replace usernames with "Viewer A", "Viewer B"
    # Unless generating viewer-specific summaries
  end
end
```

---

## 6. Infrastructure Requirements

### 6.1 Database Considerations

```sql
-- Partitioning for large tables (if needed)
CREATE TABLE chat_messages (
    ...
) PARTITION BY RANGE (inserted_at);

-- Indexes for ML queries
CREATE INDEX idx_chat_messages_sentiment ON chat_messages(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX idx_viewer_insights_loyalty ON viewer_insights(loyalty_tier);
CREATE INDEX idx_stream_analyses_score ON stream_analyses(engagement_score);
```

### 6.2 Background Job Configuration

```elixir
# config/config.exs
config :streampai, Oban,
  queues: [
    default: 10,
    analytics: 5,           # ML analysis jobs
    llm: 2,                 # LLM API calls (rate limited)
    sentiment: 3            # Batch sentiment processing
  ],
  plugins: [
    {Oban.Plugins.Cron,
      crontab: [
        {"0 4 * * *", Streampai.Analytics.Jobs.ClassifyViewersJob},           # Daily 4 AM
        {"0 5 * * 0", Streampai.Analytics.Jobs.GenerateRecommendationsJob},   # Weekly Sunday 5 AM
        {"*/30 * * * *", Streampai.Analytics.Jobs.ProcessPendingSentimentJob} # Every 30 min
      ]}
  ]
```

### 6.3 External Service Configuration

```elixir
# config/runtime.exs
config :streampai, :ml_services,
  sentiment_api: System.get_env("SENTIMENT_API_URL"),
  llm_provider: System.get_env("LLM_PROVIDER", "openai"),
  llm_api_key: System.get_env("LLM_API_KEY"),
  llm_model: System.get_env("LLM_MODEL", "gpt-3.5-turbo"),
  llm_daily_budget: System.get_env("LLM_DAILY_BUDGET", "10") |> String.to_float()
```

---

## 7. Frontend Integration

### 7.1 New Pages/Components

```
frontend/src/
├── routes/dashboard/
│   ├── insights/                    # New insights section
│   │   ├── index.tsx               # Main insights dashboard
│   │   ├── recommendations.tsx     # Growth recommendations
│   │   └── viewer-analysis.tsx     # Detailed viewer analytics
│   └── analytics.tsx               # Enhanced with ML insights
├── components/
│   ├── insights/
│   │   ├── EngagementScoreCard.tsx
│   │   ├── RecommendationCard.tsx
│   │   ├── ViewerTierBadge.tsx
│   │   ├── SentimentChart.tsx
│   │   ├── ChurnRiskIndicator.tsx
│   │   └── ForecastWidget.tsx
```

### 7.2 Electric SQL Shapes

```elixir
# New shapes for ML data
def shapes do
  [
    # Existing...

    # ML Analytics
    {"/shapes/stream_analyses/:user_id", StreamAnalysis},
    {"/shapes/viewer_insights/:user_id", ViewerInsight},
    {"/shapes/recommendations/:user_id", GrowthRecommendation}
  ]
end
```

---

## 8. Testing Strategy

### 8.1 ML Testing Approach

```elixir
# test/streampai/analytics/analyzers/stream_stats_analyzer_test.exs
defmodule Streampai.Analytics.Analyzers.StreamStatsAnalyzerTest do
  use Streampai.DataCase

  describe "analyze/1" do
    test "calculates engagement score within expected range" do
      livestream = create_test_livestream_with_data()

      result = StreamStatsAnalyzer.analyze(livestream.id)

      assert result.engagement_score >= 0
      assert result.engagement_score <= 100
    end

    test "identifies peak times correctly" do
      livestream = create_livestream_with_known_peak()

      result = StreamStatsAnalyzer.analyze(livestream.id)

      assert length(result.peak_times) > 0
      assert hd(result.peak_times).minute == 45  # Known peak
    end
  end
end
```

### 8.2 Snapshot Testing for Recommendations

```elixir
# Using Mneme for recommendation output validation
test "generates expected recommendation format" do
  user = create_user_with_stream_history()

  recommendations = RecommendationEngine.generate_recommendations(user.id)

  auto_assert [
    %{
      category: :schedule,
      priority: _,
      title: _,
      description: _,
      action_items: [_ | _]
    } | _
  ] <- recommendations
end
```

---

## 9. Rollout Plan

### 9.1 Feature Flags

```elixir
defmodule Streampai.Features do
  def ml_analytics_enabled?(user) do
    # Gradual rollout
    FunWithFlags.enabled?(:ml_analytics, for: user)
  end

  def llm_summaries_enabled?(user) do
    FunWithFlags.enabled?(:llm_summaries, for: user)
  end
end
```

### 9.2 Rollout Phases

1. **Alpha** (Internal): All features enabled for team accounts
2. **Beta** (Selected users): 10% of active users
3. **GA** (General): All users, feature flags removed

---

## 10. Cost Projections

### 10.1 LLM Costs (Viewer Summaries)

| Scenario | Viewers/Month | Summaries | Cost/Month |
|----------|--------------|-----------|------------|
| Small streamer | 100 | 20 (VIPs) | ~$0.50 |
| Medium streamer | 1,000 | 100 | ~$2.50 |
| Large streamer | 10,000 | 500 | ~$12.50 |

### 10.2 Infrastructure Costs

| Component | Monthly Cost |
|-----------|-------------|
| Additional DB storage (ML tables) | ~$5-20 |
| Increased Oban job processing | Included (existing infra) |
| External ML service (if used) | $0-100 depending on scale |

---

## 11. Success Metrics

### 11.1 Technical Metrics
- ML job success rate > 99%
- Average analysis latency < 30 seconds per stream
- Sentiment classification accuracy > 85%
- Churn prediction precision > 70%

### 11.2 User Metrics
- Recommendation engagement rate (clicked/dismissed)
- Feature adoption rate
- User satisfaction scores
- Retention impact (do users with insights stay longer?)

---

## 12. Future Considerations

### 12.1 Advanced Features (Phase 5+)
- Real-time sentiment during streams
- Automated moderation suggestions
- Cross-streamer benchmarking (anonymized)
- Collaboration/raid recommendations
- Content idea generation from trends

### 12.2 Potential Integrations
- Discord bot for viewer insights
- Twitch extension for live analytics
- OBS integration for overlay stats
- Export to spreadsheets/reports

---

## Appendix A: Existing Data Fields for ML

### StreamViewer (Already Available)
- `ai_summary` - **Ready for LLM-generated content**
- `first_seen_at`, `last_seen_at` - Activity window
- `is_moderator`, `is_patreon` - Engagement tier
- `platform` - Multi-platform tracking

### LivestreamMetric (Time Series)
- Per-platform viewer counts every ~30 seconds
- Perfect for trend analysis and forecasting

### ChatMessage (NLP Ready)
- Full message text
- Sender metadata
- Chronological ordering

### StreamEvent (Engagement Data)
- Donations, follows, raids, subscriptions
- Rich JSONB data for detailed analysis

---

## Appendix B: Library Dependencies

### Phase 1 (Elixir-native)
```elixir
# mix.exs
{:nx, "~> 0.7"},
{:scholar, "~> 0.3"},
{:explorer, "~> 0.8"}
```

### Phase 2 (NLP)
```elixir
# For Elixir-native transformers
{:bumblebee, "~> 0.5"},
{:exla, "~> 0.7"}  # Or {:torchx, "~> 0.7"}
```

### Alternative: Python Service
```python
# requirements.txt
fastapi==0.109.0
transformers==4.37.0
torch==2.1.0
scikit-learn==1.4.0
uvicorn==0.27.0
```
