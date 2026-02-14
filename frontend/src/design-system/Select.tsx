import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "~/design-system/design-system";

export interface SelectOption {
	value: string;
	label: string;
}

export interface SelectProps {
	options: SelectOption[];
	value: string;
	onChange: (value: string) => void;
	label?: string;
	placeholder?: string;
	error?: string;
	helperText?: string;
	disabled?: boolean;
	class?: string;
	wrapperClass?: string;
}

export default function Select(props: SelectProps) {
	const [isOpen, setIsOpen] = createSignal(false);
	const [opensUp, setOpensUp] = createSignal(false);
	const [dropdownPosition, setDropdownPosition] = createSignal({
		top: 0,
		left: 0,
		width: 0,
	});
	let triggerRef: HTMLButtonElement | undefined;
	let dropdownRef: HTMLDivElement | undefined;

	const selectedOption = () =>
		props.options.find((opt) => opt.value === props.value);

	// max-h-60 = 15rem = 240px
	const MAX_DROPDOWN_HEIGHT = 240;
	const GAP = 4;

	const updateDropdownPosition = () => {
		if (triggerRef) {
			const rect = triggerRef.getBoundingClientRect();
			const spaceBelow = window.innerHeight - rect.bottom - GAP;
			const spaceAbove = rect.top - GAP;
			const shouldOpenUp =
				spaceBelow < MAX_DROPDOWN_HEIGHT && spaceAbove > spaceBelow;

			setOpensUp(shouldOpenUp);
			setDropdownPosition({
				top: shouldOpenUp ? rect.top - GAP : rect.bottom + GAP,
				left: rect.left,
				width: rect.width,
			});
		}
	};

	const handleSelect = (value: string) => {
		props.onChange(value);
		setIsOpen(false);
		triggerRef?.focus();
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (props.disabled) return;

		switch (e.key) {
			case "Enter":
			case " ":
				e.preventDefault();
				if (!isOpen()) {
					updateDropdownPosition();
				}
				setIsOpen(!isOpen());
				break;
			case "Escape":
				setIsOpen(false);
				triggerRef?.focus();
				break;
			case "ArrowDown":
				e.preventDefault();
				if (!isOpen()) {
					updateDropdownPosition();
					setIsOpen(true);
				} else {
					const currentIndex = props.options.findIndex(
						(opt) => opt.value === props.value,
					);
					const nextIndex = Math.min(
						currentIndex + 1,
						props.options.length - 1,
					);
					props.onChange(props.options[nextIndex].value);
				}
				break;
			case "ArrowUp":
				e.preventDefault();
				if (isOpen()) {
					const currentIndex = props.options.findIndex(
						(opt) => opt.value === props.value,
					);
					const prevIndex = Math.max(currentIndex - 1, 0);
					props.onChange(props.options[prevIndex].value);
				}
				break;
		}
	};

	const handleClick = () => {
		if (props.disabled) return;
		updateDropdownPosition();
		setIsOpen(!isOpen());
	};

	// Close on outside click
	createEffect(() => {
		if (isOpen()) {
			const handleClickOutside = (e: MouseEvent) => {
				if (
					triggerRef &&
					!triggerRef.contains(e.target as Node) &&
					dropdownRef &&
					!dropdownRef.contains(e.target as Node)
				) {
					setIsOpen(false);
				}
			};

			const handleScroll = () => {
				updateDropdownPosition();
			};

			document.addEventListener("mousedown", handleClickOutside);
			window.addEventListener("scroll", handleScroll, true);
			window.addEventListener("resize", handleScroll);

			onCleanup(() => {
				document.removeEventListener("mousedown", handleClickOutside);
				window.removeEventListener("scroll", handleScroll, true);
				window.removeEventListener("resize", handleScroll);
			});
		}
	});

	const inputId = `select-${Math.random().toString(36).slice(2)}`;

	return (
		<div class={props.wrapperClass ?? "w-full"}>
			<Show when={props.label}>
				{/* biome-ignore lint/a11y/noLabelWithoutControl: label is associated via aria-labelledby on the button */}
				<label
					class="mb-1 block font-medium text-neutral-700 text-sm"
					id={`${inputId}-label`}>
					{props.label}
				</label>
			</Show>
			<div class="relative">
				<button
					aria-expanded={isOpen()}
					aria-haspopup="listbox"
					aria-labelledby={props.label ? `${inputId}-label` : undefined}
					class={cn(
						"flex w-full items-center justify-between rounded-lg bg-surface-input px-3 py-2 text-left text-sm transition-colors",
						"focus:outline-none",
						props.error
							? "ring-1 ring-red-300"
							: !isOpen() && "focus:ring-1 focus:ring-neutral-400",
						props.disabled && "cursor-not-allowed opacity-60",
						props.class,
					)}
					disabled={props.disabled}
					onClick={handleClick}
					onKeyDown={handleKeyDown}
					ref={triggerRef}
					type="button">
					<span class={cn("truncate", !selectedOption() && "text-neutral-500")}>
						{selectedOption()?.label ?? props.placeholder ?? "Select..."}
					</span>
					<svg
						aria-hidden="true"
						class={cn(
							"ml-2 h-4 w-4 shrink-0 text-neutral-500 transition-transform",
							isOpen() && "rotate-180",
						)}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							d="M19 9l-7 7-7-7"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						/>
					</svg>
				</button>

				<Show when={isOpen()}>
					<Portal>
						<div
							class="fixed z-[9999] max-h-60 overflow-auto rounded-lg border border-neutral-200 bg-surface py-1 shadow-lg"
							ref={dropdownRef}
							role="listbox"
							style={{
								...(opensUp()
									? {
											bottom: `${window.innerHeight - dropdownPosition().top}px`,
										}
									: { top: `${dropdownPosition().top}px` }),
								left: `${dropdownPosition().left}px`,
								width: `${dropdownPosition().width}px`,
							}}>
							<For each={props.options}>
								{(option) => (
									<button
										aria-selected={option.value === props.value}
										class={cn(
											"w-full px-4 py-2 text-left text-sm transition-colors hover:bg-surface-secondary",
											option.value === props.value
												? "font-medium text-primary"
												: "text-foreground",
										)}
										onClick={() => handleSelect(option.value)}
										role="option"
										type="button">
										{option.label}
									</button>
								)}
							</For>
						</div>
					</Portal>
				</Show>
			</div>
			<Show when={props.error}>
				<p class="mt-1 text-red-600 text-sm">{props.error}</p>
			</Show>
			<Show when={props.helperText && !props.error}>
				<p class="mt-1 text-neutral-500 text-xs">{props.helperText}</p>
			</Show>
		</div>
	);
}
