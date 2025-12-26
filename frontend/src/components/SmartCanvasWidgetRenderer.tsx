import { Component, lazy } from "solid-js";
import PlaceholderWidget from "./widgets/PlaceholderWidget";
import ViewerCountWidget from "./widgets/ViewerCountWidget";
import FollowerCountWidget from "./widgets/FollowerCountWidget";
import TimerWidget from "./widgets/TimerWidget";
import ChatWidget from "./widgets/ChatWidget";
import EventListWidget from "./widgets/EventListWidget";
import TopDonorsWidget from "./widgets/TopDonorsWidget";
import AlertboxWidget from "./widgets/AlertboxWidget";
import PollWidget from "./widgets/PollWidget";
import GiveawayWidget from "./widgets/GiveawayWidget";
import SliderWidget from "./widgets/SliderWidget";
import DonationGoalWidget from "./widgets/DonationGoalWidget";

interface CanvasWidget {
  id: string;
  widgetType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config?: any;
}

interface WidgetRendererProps {
  widget: CanvasWidget;
}

const DEFAULT_CONFIGS: Record<string, any> = {
  placeholder: {
    message: "Placeholder Widget",
    fontSize: 24,
    textColor: "#ffffff",
    backgroundColor: "#9333ea",
    borderColor: "#ffffff",
    borderWidth: 2,
    padding: 16,
    borderRadius: 8,
  },
  "viewer-count": {
    label: "viewers",
    fontSize: 32,
    textColor: "#ffffff",
    backgroundColor: "#8b5cf6",
    showIcon: true,
  },
  "follower-count": {
    label: "followers",
    fontSize: 32,
    textColor: "#ffffff",
    backgroundColor: "#ec4899",
    showIcon: true,
  },
  timer: {
    duration: 300,
    fontSize: 48,
    textColor: "#ffffff",
    backgroundColor: "#3b82f6",
    showLabel: true,
    label: "Time Remaining",
  },
  chat: {
    maxMessages: 10,
    fontSize: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    textColor: "#ffffff",
    showAvatars: true,
  },
  eventlist: {
    maxEvents: 5,
    fontSize: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    textColor: "#ffffff",
    showIcons: true,
  },
  topdonors: {
    maxDonors: 5,
    fontSize: 18,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    textColor: "#ffffff",
    showRank: true,
  },
  alertbox: {
    duration: 5,
    fontSize: 32,
    backgroundColor: "#8b5cf6",
    textColor: "#ffffff",
    soundEnabled: true,
  },
  poll: {
    question: "What should we play next?",
    options: ["Game 1", "Game 2", "Game 3"],
    fontSize: 20,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    textColor: "#ffffff",
  },
  giveaway: {
    title: "Giveaway!",
    prize: "Amazing Prize",
    fontSize: 24,
    backgroundColor: "#ec4899",
    textColor: "#ffffff",
  },
  slider: {
    slides: [
      { text: "Slide 1", duration: 5 },
      { text: "Slide 2", duration: 5 },
    ],
    fontSize: 24,
    backgroundColor: "#8b5cf6",
    textColor: "#ffffff",
  },
  "donation-goal": {
    goal: 1000,
    current: 450,
    title: "Support the Stream!",
    fontSize: 24,
    backgroundColor: "#10b981",
    textColor: "#ffffff",
    showPercentage: true,
  },
};

export default function SmartCanvasWidgetRenderer(props: WidgetRendererProps) {
  const getConfig = () => {
    const defaultConfig = DEFAULT_CONFIGS[props.widget.widgetType] || {};
    return { ...defaultConfig, ...props.widget.config };
  };

  const renderWidgetContent = () => {
    const config = getConfig();

    switch (props.widget.widgetType) {
      case "placeholder":
        return <PlaceholderWidget config={config} />;

      case "viewer-count":
        return <ViewerCountWidget config={config} data={null} />;

      case "follower-count":
        return <FollowerCountWidget config={config} count={Math.floor(Math.random() * 10000)} />;

      case "timer":
        return <TimerWidget config={config} />;

      case "chat":
        return <ChatWidget config={config} messages={[]} />;

      case "eventlist":
        return <EventListWidget config={config} events={[]} />;

      case "topdonors":
        return <TopDonorsWidget config={config} donors={[]} />;

      case "alertbox":
        return <AlertboxWidget config={config} event={null} />;

      case "poll":
        return <PollWidget config={config} />;

      case "giveaway":
        return <GiveawayWidget config={config} />;

      case "slider":
        return <SliderWidget config={config} />;

      case "donation-goal":
        return <DonationGoalWidget config={config} currentAmount={0} />;

      default:
        return (
          <div class="w-full h-full bg-linear-to-br from-gray-500 to-gray-700 border-2 border-white/20 rounded-lg shadow-lg p-4 flex items-center justify-center text-white">
            <div class="text-center">
              <div class="text-4xl mb-2">❓</div>
              <div class="font-semibold">Unknown Widget</div>
              <div class="text-sm opacity-80">{props.widget.widgetType}</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      class="absolute"
      style={{
        left: `${props.widget.x}px`,
        top: `${props.widget.y}px`,
        width: `${props.widget.width}px`,
        height: `${props.widget.height}px`,
        overflow: "hidden",
      }}
    >
      <div class="w-full h-full flex items-center justify-center">
        {renderWidgetContent()}
      </div>
    </div>
  );
}
