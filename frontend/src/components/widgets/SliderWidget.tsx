import { Show, createSignal, onCleanup, onMount } from "solid-js";

interface SliderImage {
	id: string;
	url: string;
	alt?: string;
	index: number;
}

interface SliderConfig {
	slideDuration: number;
	transitionDuration: number;
	transitionType: "fade" | "slide" | "slide-up" | "zoom" | "flip";
	fitMode: "contain" | "cover" | "fill";
	backgroundColor: string;
	images?: SliderImage[];
}

interface SliderWidgetProps {
	config: SliderConfig;
}

export default function SliderWidget(props: SliderWidgetProps) {
	const [currentSlideIndex, setCurrentSlideIndex] = createSignal(0);

	const slides = () => props.config.images || [];
	const currentSlide = () => {
		const slideList = slides();
		if (slideList.length === 0) return null;
		return slideList[currentSlideIndex() % slideList.length];
	};

	const slideDuration = () =>
		Math.max(1000, (props.config.slideDuration || 5) * 1000);
	const transitionDuration = () =>
		Math.max(200, Math.min(2000, props.config.transitionDuration || 500));

	const getImageStyle = (): Record<string, string> => {
		const fitMode = props.config.fitMode || "contain";

		switch (fitMode) {
			case "cover":
				return {
					width: "100%",
					height: "100%",
					"object-fit": "cover",
				};
			case "fill":
				return {
					width: "100%",
					height: "100%",
					"object-fit": "fill",
				};
			default:
				return {
					"max-width": "100%",
					"max-height": "100%",
					"object-fit": "contain",
				};
		}
	};

	const nextSlide = () => {
		const slideList = slides();
		if (slideList.length <= 1) return;
		setCurrentSlideIndex((prev) => (prev + 1) % slideList.length);
	};

	onMount(() => {
		if (slides().length > 1) {
			const interval = setInterval(nextSlide, slideDuration());
			onCleanup(() => clearInterval(interval));
		}
	});

	return (
		<div
			style={{
				"background-color": props.config.backgroundColor || "transparent",
				width: "100%",
				height: "100%",
				position: "relative",
				overflow: "hidden",
			}}>
			<Show
				fallback={
					<div
						style={{ color: "white", "text-align": "center", padding: "20px" }}>
						<p>No images available for slider</p>
						<p style={{ "font-size": "0.8em", opacity: "0.7" }}>
							Upload images or wait for demo images to load
						</p>
					</div>
				}
				when={slides().length > 0}>
				<div
					style={{
						width: "100%",
						height: "100%",
						position: "relative",
					}}>
					<Show when={currentSlide()}>
						{(slide) => (
							<div
								class={`slide-transition slide-${props.config.transitionType}`}
								style={{
									position: "absolute",
									top: "0",
									left: "0",
									width: "100%",
									height: "100%",
									display: "flex",
									"align-items": "center",
									"justify-content": "center",
									"--transition-duration": `${transitionDuration()}ms`,
								}}>
								<img
									alt={slide().alt || `Slide ${slide().index + 1}`}
									src={slide().url}
									style={{
										...getImageStyle(),
										"border-radius": "4px",
									}}
								/>
							</div>
						)}
					</Show>
				</div>
			</Show>

			<style>{`
        .slide-transition {
          animation: slideIn var(--transition-duration, 500ms) ease-in-out;
        }

        .slide-fade {
          animation: fadeIn var(--transition-duration, 500ms) ease-in-out;
        }

        .slide-slide {
          animation: slideInFromRight var(--transition-duration, 500ms) ease-in-out;
        }

        .slide-slide-up {
          animation: slideInFromBottom var(--transition-duration, 500ms) ease-in-out;
        }

        .slide-zoom {
          animation: zoomIn var(--transition-duration, 500ms) ease-in-out;
        }

        .slide-flip {
          animation: flipIn var(--transition-duration, 500ms) ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInFromBottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes flipIn {
          from {
            transform: rotateY(90deg);
            opacity: 0;
          }
          to {
            transform: rotateY(0);
            opacity: 1;
          }
        }
      `}</style>
		</div>
	);
}
