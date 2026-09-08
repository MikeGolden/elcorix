import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  type Ref,
} from "react";

/**
 * The scroll-reveal used across the landing page: an element starts
 * transparent and nudged down, then eases into place the first time it
 * enters the viewport.
 *
 * It is one-shot on purpose — the observer disconnects on the first hit, so
 * scrolling back up never replays the movement and nothing flickers while
 * the visitor reads.
 *
 * Content must never be lost to an animation, so there are three ways out:
 * without IntersectionObserver (old browsers, jsdom) the element renders
 * revealed from the very first paint, and `prefers-reduced-motion` and
 * `@media print` flatten it in CSS — see `.reveal` in index.css.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const element = ref.current;
    if (revealed || !element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setRevealed(true);
        observer.disconnect();
      },
      // A negative bottom margin holds the reveal back until the element is
      // properly on screen rather than one pixel into it; the low threshold
      // keeps blocks taller than the viewport from waiting forever.
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [revealed]);

  return { ref, revealed };
}

type RevealOwnProps<T extends ElementType> = {
  /** Element or component to render. Defaults to a plain `div`. */
  as?: T;
  /** Stagger, in ms. Keep siblings within ~60–120ms of each other. */
  delay?: number;
  /**
   * "up" fades and slides; "fade" only changes opacity — for elements whose
   * own position is load-bearing (the hero photo bleeds off the viewport).
   */
  variant?: "up" | "fade";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export type RevealProps<T extends ElementType> = RevealOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof RevealOwnProps<T>>;

export default function Reveal<T extends ElementType = "div">({
  as,
  delay = 0,
  variant = "up",
  className = "",
  style,
  children,
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, revealed } = useReveal();

  return (
    <Tag
      {...rest}
      // The generic `as` widens the ref past what one element type accepts;
      // the hook only ever reads `.getBoundingClientRect()` through it.
      ref={ref as Ref<never>}
      data-revealed={revealed ? "true" : "false"}
      className={`${variant === "fade" ? "reveal-fade" : "reveal"} ${className}`.trim()}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
    >
      {children}
    </Tag>
  );
}
