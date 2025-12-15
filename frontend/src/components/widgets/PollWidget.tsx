import { Show, For, createMemo } from "solid-js";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollStatus {
  id: string;
  title?: string;
  status: 'waiting' | 'active' | 'ended';
  options: PollOption[];
  totalVotes: number;
  createdAt: Date;
  endsAt?: Date;
  platform?: string;
}

interface PollConfig {
  showTitle: boolean;
  showPercentages: boolean;
  showVoteCounts: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  winnerColor: string;
  animationType: 'none' | 'smooth' | 'bounce';
  highlightWinner: boolean;
  autoHideAfterEnd: boolean;
  hideDelay: number;
}

interface PollWidgetProps {
  config: PollConfig;
  pollStatus?: PollStatus;
}

export default function PollWidget(props: PollWidgetProps) {
  const totalVotes = createMemo(() => {
    if (!props.pollStatus?.options) return 0;
    return props.pollStatus.options.reduce((sum, option) => sum + option.votes, 0);
  });

  const sortedResults = createMemo(() => {
    if (!props.pollStatus?.options) return [];
    return [...props.pollStatus.options].sort((a, b) => b.votes - a.votes);
  });

  const getPercentage = (option: PollOption): number => {
    if (totalVotes() === 0) return 0;
    return Math.round((option.votes / totalVotes()) * 100);
  };

  const isWinning = (option: PollOption): boolean => {
    if (!props.config.highlightWinner || totalVotes() === 0) return false;
    const maxVotes = Math.max(...(props.pollStatus?.options.map(o => o.votes) || [0]));
    return option.votes === maxVotes && option.votes > 0;
  };

  const formatTimeRemaining = (endsAt: Date): string => {
    const now = new Date();
    const end = new Date(endsAt);
    const diffMs = end.getTime() - now.getTime();

    if (diffMs <= 0) return 'now';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (diffMinutes > 0) {
      return `in ${diffMinutes}m ${diffSeconds}s`;
    } else {
      return `in ${diffSeconds}s`;
    }
  };

  const widgetClasses = createMemo(() => {
    const classes = [];
    classes.push(`font-${props.config.fontSize}`);
    classes.push(`animation-${props.config.animationType}`);
    return classes.join(' ');
  });

  const animationDuration = createMemo(() => {
    switch (props.config.animationType) {
      case 'smooth': return '1.2s';
      case 'bounce': return '0.8s';
      default: return '0.3s';
    }
  });

  const animationEasing = createMemo(() => {
    switch (props.config.animationType) {
      case 'smooth': return 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      case 'bounce': return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      default: return 'ease';
    }
  });

  return (
    <div class={`poll-widget ${widgetClasses()}`} style={{
      "font-family": "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: props.config.textColor,
      padding: "1rem"
    }}>
      <style>{`
        .poll-widget .option-progress {
          transition: width ${animationDuration()} ${animationEasing()};
        }
        .poll-widget .result-progress {
          transition: width ${animationDuration()} ${animationEasing()};
        }
        .poll-widget.animation-none .option-progress,
        .poll-widget.animation-none .result-progress {
          transition: width 0.3s ease;
        }
        .poll-option.winning {
          animation: winnerGlow 2s infinite alternate;
        }
        @keyframes winnerGlow {
          0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
          100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
        }
        .result-option.winner {
          animation: resultWinner 1s ease-in-out;
        }
        @keyframes resultWinner {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div class="poll-container" style={{
        "background-color": props.config.backgroundColor,
        "border-radius": "0.75rem",
        padding: "1.5rem",
        "box-shadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
        "min-height": "200px",
        display: "flex",
        "flex-direction": "column"
      }}>
        <Show when={props.config.showTitle && props.pollStatus?.title}>
          <div class="poll-title" style={{
            "font-size": "1.25em",
            "font-weight": "bold",
            "text-align": "center",
            "margin-bottom": "1.5rem",
            color: props.config.primaryColor
          }}>
            {props.pollStatus?.title}
          </div>
        </Show>

        <Show when={props.pollStatus?.status === 'active'}>
          <div class="poll-active" style={{ flex: 1, display: "flex", "flex-direction": "column" }}>
            <div class="poll-options" style={{ flex: 1, display: "flex", "flex-direction": "column", gap: "1rem" }}>
              <For each={props.pollStatus?.options}>
                {(option) => (
                  <div
                    class={`poll-option ${isWinning(option) ? 'winning' : ''}`}
                    style={{
                      position: "relative",
                      border: `2px solid ${isWinning(option) ? props.config.winnerColor : 'transparent'}`,
                      "border-radius": "0.5rem",
                      overflow: "hidden",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <div class="option-content" style={{
                      position: "relative",
                      "z-index": "2",
                      padding: "1rem",
                      display: "flex",
                      "justify-content": "space-between",
                      "align-items": "center"
                    }}>
                      <div class="option-text" style={{ "font-weight": "500", flex: 1 }}>
                        {option.text}
                      </div>
                      <div class="option-stats" style={{
                        display: "flex",
                        gap: "1rem",
                        "font-size": "0.875em",
                        opacity: "0.8"
                      }}>
                        <span class="option-votes">{option.votes} votes</span>
                        <span class="option-percentage">{getPercentage(option)}%</span>
                      </div>
                    </div>
                    <div class="option-bar" style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      "background-color": "rgba(0, 0, 0, 0.05)"
                    }}>
                      <div class="option-progress" style={{
                        height: "100%",
                        width: `${getPercentage(option)}%`,
                        "background-color": isWinning(option) ? props.config.winnerColor : props.config.primaryColor,
                        opacity: isWinning(option) ? "0.3" : "0.2"
                      }} />
                    </div>
                  </div>
                )}
              </For>
            </div>

            <div class="poll-footer" style={{
              "margin-top": "1.5rem",
              display: "flex",
              "justify-content": "space-between",
              "align-items": "center",
              "font-size": "0.875em",
              opacity: "0.7",
              "padding-top": "1rem",
              "border-top": "1px solid rgba(0, 0, 0, 0.1)"
            }}>
              <div class="total-votes">{totalVotes()} total votes</div>
              <Show when={props.pollStatus?.endsAt}>
                <div class="time-remaining">
                  Ends {formatTimeRemaining(props.pollStatus!.endsAt!)}
                </div>
              </Show>
            </div>
          </div>
        </Show>

        <Show when={props.pollStatus?.status === 'ended'}>
          <div class="poll-ended" style={{ flex: 1 }}>
            <div class="winner-announcement" style={{
              "text-align": "center",
              "font-size": "1.125em",
              "font-weight": "bold",
              "margin-bottom": "1.5rem",
              color: props.config.primaryColor
            }}>
              Poll Results
            </div>

            <div class="poll-results" style={{
              display: "flex",
              "flex-direction": "column",
              gap: "0.75rem"
            }}>
              <For each={sortedResults()}>
                {(option, index) => (
                  <div
                    class={`result-option ${index() === 0 ? 'winner' : ''} ${index() === 1 ? 'runner-up' : ''}`}
                    style={{
                      position: "relative",
                      "border-radius": "0.5rem",
                      overflow: "hidden",
                      border: `2px solid ${
                        index() === 0 ? props.config.winnerColor :
                        index() === 1 ? props.config.secondaryColor :
                        'transparent'
                      }`,
                      "box-shadow": index() === 0 ? "0 0 15px rgba(255, 215, 0, 0.4)" : "none"
                    }}
                  >
                    <div class="result-content" style={{
                      position: "relative",
                      "z-index": "2",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      "align-items": "center",
                      gap: "1rem"
                    }}>
                      <div
                        class="result-position"
                        style={{
                          "font-weight": "bold",
                          "font-size": "1.125em",
                          "min-width": "2rem",
                          color: index() === 0 ? props.config.winnerColor : "inherit"
                        }}
                      >
                        #{index() + 1}
                      </div>
                      <div class="result-text" style={{ "font-weight": "500", flex: 1 }}>
                        {option.text}
                      </div>
                      <div class="result-stats" style={{
                        display: "flex",
                        gap: "1rem",
                        "font-size": "0.875em",
                        opacity: "0.8"
                      }}>
                        <span class="result-votes">{option.votes} votes</span>
                        <span class="result-percentage">{getPercentage(option)}%</span>
                      </div>
                    </div>
                    <div class="result-bar" style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      "background-color": "rgba(0, 0, 0, 0.03)"
                    }}>
                      <div class="result-progress" style={{
                        height: "100%",
                        width: `${getPercentage(option)}%`,
                        "background-color": index() === 0 ? props.config.winnerColor : props.config.primaryColor,
                        opacity: index() === 0 ? "0.25" : "0.15"
                      }} />
                    </div>
                  </div>
                )}
              </For>
            </div>

            <div class="poll-footer" style={{
              "margin-top": "1.5rem",
              display: "flex",
              "justify-content": "space-between",
              "align-items": "center",
              "font-size": "0.875em",
              opacity: "0.7",
              "padding-top": "1rem",
              "border-top": "1px solid rgba(0, 0, 0, 0.1)"
            }}>
              <div class="total-votes">{totalVotes()} total votes</div>
              <div class="poll-ended-text">Poll ended</div>
            </div>
          </div>
        </Show>

        <Show when={!props.pollStatus || props.pollStatus.status === 'waiting'}>
          <div class="poll-waiting" style={{
            flex: 1,
            display: "flex",
            "align-items": "center",
            "justify-content": "center"
          }}>
            <div class="waiting-message" style={{
              "font-size": "1.125em",
              opacity: "0.6",
              "text-align": "center"
            }}>
              Waiting for poll...
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
