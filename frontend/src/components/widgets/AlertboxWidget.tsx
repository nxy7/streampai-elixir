import { Show, createMemo } from "solid-js";

interface AlertEvent {
  id: string;
  type: 'donation' | 'follow' | 'subscription' | 'raid';
  username: string;
  message?: string;
  amount?: number;
  currency?: string;
  timestamp: Date;
  displayTime?: number;
  ttsUrl?: string;
  platform: {
    icon: string;
    color: string;
  };
}

interface AlertConfig {
  animationType: 'slide' | 'fade' | 'bounce';
  displayDuration: number;
  soundEnabled: boolean;
  soundVolume: number;
  showMessage: boolean;
  showAmount: boolean;
  fontSize: 'small' | 'medium' | 'large';
  alertPosition: 'top' | 'center' | 'bottom';
}

interface AlertboxWidgetProps {
  config: AlertConfig;
  event: AlertEvent | null;
}

export default function AlertboxWidget(props: AlertboxWidgetProps) {
  const fontClass = createMemo(() => {
    switch (props.config.fontSize) {
      case 'small': return 'text-lg';
      case 'large': return 'text-4xl';
      default: return 'text-2xl';
    }
  });

  const positionClass = createMemo(() => {
    switch (props.config.alertPosition) {
      case 'top': return 'items-start pt-8';
      case 'bottom': return 'items-end pb-8';
      default: return 'items-center';
    }
  });

  const getAlertColor = (type: string) => {
    const colors = {
      donation: 'text-green-400',
      follow: 'text-blue-400',
      subscription: 'text-purple-400',
      raid: 'text-yellow-400'
    };
    return colors[type as keyof typeof colors] || colors.donation;
  };

  const getGradientColor = (type: string) => {
    const gradients = {
      donation: 'from-green-500 to-emerald-600',
      follow: 'from-blue-500 to-cyan-600',
      subscription: 'from-purple-500 to-violet-600',
      raid: 'from-yellow-500 to-orange-600'
    };
    return gradients[type as keyof typeof gradients] || gradients.donation;
  };

  const getAlertTypeLabel = (type: string) => {
    const labels = {
      donation: 'Donation',
      follow: 'New Follower',
      subscription: 'New Subscriber',
      raid: 'Raid'
    };
    return labels[type as keyof typeof labels] || 'Alert';
  };

  const getPlatformName = (icon: string) => {
    const platformNames = {
      twitch: 'Twitch',
      youtube: 'YouTube',
      facebook: 'Facebook',
      kick: 'Kick'
    };
    return platformNames[icon as keyof typeof platformNames] || icon;
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return '';
    return `${currency || '$'}${amount.toFixed(2)}`;
  };

  return (
    <div class="alertbox-widget h-full w-full relative overflow-hidden">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.85) translateY(20px); filter: blur(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-60px) scale(0.8) rotateX(15deg); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); filter: blur(0px); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.2) translateY(-100px) rotateZ(-5deg); filter: blur(4px); }
          50% { opacity: 1; transform: scale(1.15) translateY(-10px) rotateZ(2deg); filter: blur(1px); }
          75% { transform: scale(0.95) translateY(5px) rotateZ(-1deg); filter: blur(0px); }
          100% { opacity: 1; transform: scale(1) translateY(0) rotateZ(0deg); filter: blur(0px); }
        }
        @keyframes fade-out {
          from { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
          to { opacity: 0; transform: scale(0.85) translateY(-20px); filter: blur(4px); }
        }
        @keyframes slide-out {
          from { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); filter: blur(0px); }
          to { opacity: 0; transform: translateY(-60px) scale(0.8) rotateX(15deg); filter: blur(4px); }
        }
        @keyframes bounce-out {
          0% { opacity: 1; transform: scale(1) translateY(0) rotateZ(0deg); filter: blur(0px); }
          25% { transform: scale(1.05) translateY(-5px) rotateZ(1deg); filter: blur(0px); }
          50% { opacity: 1; transform: scale(0.95) translateY(10px) rotateZ(-2deg); filter: blur(1px); }
          100% { opacity: 0; transform: scale(0.2) translateY(100px) rotateZ(5deg); filter: blur(4px); }
        }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-in { animation: slide-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-in { animation: bounce-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-out { animation: fade-out 0.6s cubic-bezier(0.3, 0, 0.8, 0.15) forwards; }
        .animate-slide-out { animation: slide-out 0.5s cubic-bezier(0.3, 0, 0.8, 0.15) forwards; }
        .animate-bounce-out { animation: bounce-out 0.8s cubic-bezier(0.3, 0, 0.8, 0.15) forwards; }
      `}</style>

      <div class={`absolute inset-0 flex justify-center ${positionClass()}`}>
        <Show when={props.event}>
          <div class={`alert-card relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-lg border border-white/20 backdrop-blur-lg shadow-2xl p-8 w-96 mx-4 ${fontClass()} animate-${props.config.animationType}-in`}>
            <div class="absolute inset-0 rounded-lg bg-linear-to-r from-purple-500/50 to-pink-500/50 opacity-20 blur-sm"></div>
            <div class={`absolute inset-0 rounded-lg bg-linear-to-r ${getGradientColor(props.event!.type)} opacity-10 animate-pulse`}></div>

            <div class="relative z-10">
              <div class="text-center mb-6">
                <div class={`font-extrabold text-sm tracking-wider uppercase ${getAlertColor(props.event!.type)} drop-shadow-sm mb-2`}>
                  {getAlertTypeLabel(props.event!.type)}
                </div>
                <div class="text-white font-bold text-2xl drop-shadow-sm">
                  {props.event!.username}
                </div>
                <div class="flex justify-center mt-3">
                  <div class="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-white">
                    <span class="opacity-70">via</span> <span class="font-bold">{getPlatformName(props.event!.platform.icon)}</span>
                  </div>
                </div>
              </div>

              <Show when={props.config.showAmount && props.event!.amount}>
                <div class="text-center mb-6">
                  <div class="relative inline-block">
                    <div class="absolute inset-0 text-4xl font-black text-green-400 blur-sm opacity-50">
                      {formatAmount(props.event!.amount, props.event!.currency)}
                    </div>
                    <div class="relative text-4xl font-black text-green-400 drop-shadow-lg">
                      {formatAmount(props.event!.amount, props.event!.currency)}
                    </div>
                  </div>
                </div>
              </Show>

              <Show when={props.config.showMessage && props.event!.message}>
                <div class="text-center mb-4">
                  <div class="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm">
                    <div class="text-gray-200 font-medium leading-relaxed">
                      {props.event!.message}
                    </div>
                  </div>
                </div>
              </Show>

              <div class="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
              <div class="absolute bottom-4 left-4 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-300"></div>
            </div>

            <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-lg overflow-hidden">
              <div
                class="h-full bg-linear-to-r from-purple-500 to-pink-500"
                style={{
                  width: "100%",
                  animation: `progress-width-shrink ${props.config.displayDuration}s linear forwards`
                }}
              ></div>
            </div>
          </div>
        </Show>
      </div>

      <style>{`
        @keyframes progress-width-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
