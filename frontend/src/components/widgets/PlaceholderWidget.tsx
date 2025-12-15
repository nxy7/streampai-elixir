interface PlaceholderConfig {
  message: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  padding: number;
  borderRadius: number;
}

interface PlaceholderWidgetProps {
  config: PlaceholderConfig;
}

export default function PlaceholderWidget(props: PlaceholderWidgetProps) {
  return (
    <div
      style={{
        "background-color": props.config.backgroundColor,
        color: props.config.textColor,
        "font-size": `${props.config.fontSize}px`,
        border: `${props.config.borderWidth}px solid ${props.config.borderColor}`,
        padding: `${props.config.padding}px`,
        "border-radius": `${props.config.borderRadius}px`,
        display: "inline-block",
        "font-weight": "600",
        "text-align": "center",
        "font-family": "system-ui, -apple-system, sans-serif",
      }}
    >
      {props.config.message}
    </div>
  );
}
