# Clip Detection Pre-Training Plan

## Goal

Build a clip detection model that works from day 1 (no platform data needed), then improves as platform signals become available.

---

## Phase 1: Bootstrap with Video + Audio Only

No users, no chat, no platform data required. Every stream has video and audio.

### Signals

| Signal | How | Tool |
|---|---|---|
| Audio energy (RMS/dB) | Track volume over sliding windows, detect spikes | Nx (raw DSP) |
| Speech transcription | Transcribe streamer audio | Whisper via Bumblebee |
| Speech sentiment | Run transcription through sentiment model | Bumblebee (DistilBERT) |
| Scene description | Sample frames every N seconds, describe via LLM | Vision model API |
| Scene change rate | Detect visual cuts/transitions | Frame differencing with Nx |

### Training Data (No Labeling Needed)

Use publicly available VODs + their existing clips as labels:

1. Download VODs from Twitch/YouTube (public channels)
2. Get all clips created by viewers for those VODs (via API)
3. Split VOD into N-second windows (e.g., 30s)
4. Windows overlapping with popular clips (high view count) = **positive**
5. Windows with no clips = **negative**
6. Extract Phase 1 signals for each window
7. Train binary classifier: clip-worthy vs. not

### Initial Model

Simple Axon neural network:

```
input(5 features) -> dense(64, relu) -> dense(32, relu) -> dense(1, sigmoid)
```

Output: probability that this window is clip-worthy.

### Validation

- Hold out 20% of VODs (not windows — whole VODs) for test set
- Metric: precision@k (of top-k predicted moments, how many are real clips?)
- Baseline: random selection, audio-energy-only threshold

---

## Phase 2: Add Platform Signals (Weights Start at Zero)

Once streampai has live streams and users, start collecting these signals in **shadow mode** — log them alongside Phase 1 predictions without using them.

### New Signals

| Signal | Source | Notes |
|---|---|---|
| Chat message velocity | Platform chat | Messages per second in sliding window |
| Chat sentiment | Platform chat | Avg sentiment score per window |
| Donation/sub events | Platform events | Binary: did a donation happen? |
| Emote density | Platform chat | Ratio of emote-only messages |
| Viewer count delta | Platform metrics | Sudden viewer spikes |
| Manual clip creation | Platform events | Strongest signal — user explicitly clips |

### Integration Strategy

```
score = phase1_model(audio, video, transcription)     # Already trained
      + w4*chat_velocity
      + w5*chat_sentiment
      + w6*donation_events
      + w7*emote_density
      + w8*viewer_delta
      + w9*manual_clip_signal
```

All `w4..w9` start at `0.0`.

### Weight Discovery

1. **Collect** — Run shadow mode for 2-4 weeks, logging all Phase 2 features
2. **Correlate** — Offline analysis: which Phase 2 features correlate with Phase 1 clip detections and user engagement?
3. **Train** — Retrain model with Phase 2 features included, let gradient descent find optimal weights
4. **Validate** — A/B test: Phase 1-only vs Phase 1+2, measure clip engagement (views, shares, watch-through rate)
5. **Ramp** — Gradually increase blend:
   ```
   final = (1 - alpha) * phase1_score + alpha * phase1_plus_2_score
   alpha: 0.0 -> 0.1 -> 0.25 -> 0.5 -> 1.0
   ```

---

## Phase 3: Personalization

Once per-streamer data accumulates, fine-tune per channel:

- Different streamers have different "clip-worthy" patterns (FPS clutch vs. cooking fail vs. emotional moment)
- Use embeddings of clip context to cluster streamer types
- Transfer learning: base model + per-streamer fine-tuning layer

---

## Architecture Summary

```
Phase 1 (Day 1)          Phase 2 (Month 2+)         Phase 3 (Month 6+)
┌─────────────────┐      ┌──────────────────┐       ┌──────────────────┐
│ Audio energy     │      │ + Chat velocity   │       │ + Per-streamer   │
│ Transcription    │──────│ + Chat sentiment  │───────│   fine-tuning    │
│ Speech sentiment │      │ + Donations       │       │ + Audience       │
│ Scene changes    │      │ + Emote density   │       │   preferences    │
│ Frame analysis   │      │ + Viewer delta    │       │ + Content type   │
└─────────────────┘      │ + Manual clips    │       │   specialization │
   Trained on public     └──────────────────┘       └──────────────────┘
   VODs + clips             Shadow mode first          Embedding-based
                            Gradual weight ramp        clustering
```

---

## Key Principles

1. **Start with what's always available** — video/audio exists for every stream
2. **Let users label for you** — existing clips on Twitch/YT = free training data
3. **Shadow before you ship** — log new features before using them in scoring
4. **Measure everything** — A/B test each new signal's impact
5. **Don't overfit to big streamers** — validate across streamer sizes and categories
