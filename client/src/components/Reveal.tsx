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
 * A negative bottom margin holds the reveal back until the element is
 * properly on screen rather than one pixel into it; the low threshold keeps
 * blocks taller than the viewport from waiting forever.
 */
const OBSERVER_OPTIONS: IntersectionObserverInit = {
  threshold: 0.05,
  rootMargin: "0px 0px -8% 0px",
};

/**
 * One observer for the whole page instead of one per <Reveal>.
 *
 * The landing page mounts around twenty reveals, all with identical
 * options, so a shared observer is exactly equivalent and costs the browser
 * a single set of intersection computations. It is created lazily so that
 * importing this module never touches the API (jsdom, SSR), and it is
 * unobserved — not disconnected — per element, since its other subscribers
 * are still waiting their turn.
 */
type Subscriber = () => void;
let sharedObserver: IntersectionObserver | null = null;
const subscribers = new Map<Element, Subscriber>();

function watch(element: Element, onEnter: Subscriber): () => void {
  if (sharedObserver === null) {
    sharedObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const notify = subscribers.get(entry.target);
        if (notify === undefined) continue;
        // Drop the subscription before notifying: the reveal is one-shot,
        // and React may re-render synchronously from the callback.
        subscribers.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
        notify();
      }
    }, OBSERVER_OPTIONS);
  }
  subscribers.set(element, onEnter);
  sharedObserver.observe(element);

  return () => {
    if (subscribers.delete(element)) sharedObserver?.unobserve(element);
  };
}

/** Test seam: forget the shared observer so a stubbed one is picked up. */
export function resetRevealObserver(): void {
  sharedObserver?.disconnect();
  sharedObserver = null;
  subscribers.clear();
}

/**
 * The scroll-reveal used across the landing page: an element starts
 * transparent and nudged down, then eases into place the first time it
 * enters the viewport.
 *
 * It is one-shot on purpose — the element is unobserved on the first hit,
 * so scrolling back up never replays the movement and nothing flickers
 * while the visitor reads.
 *
 * Content must never be lost to an animation, so there are four ways out:
 * without IntersectionObserver (old browsers, jsdom) the element reveals
 * itself on mount, `prefers-reduced-motion` and `@media print` flatten it
 * in CSS, and a `<noscript>` rule in index.html does the same for a
 * visitor with no JavaScript at all — see `.reveal` in index.css.
 *
 * The first render is always the unrevealed one, in the browser and in
 * `entry-server.tsx` alike. It has to be: the prerendered markup is
 * hydrated, not replaced, and React only reuses the server's DOM when the
 * client's first render agrees with it attribute for attribute. Deciding
 * from `typeof IntersectionObserver` — which is undefined in Node and
 * defined in every browser — is exactly the disagreement that would throw
 * the whole tree away and re-render it.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (revealed || !element) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    return watch(element, () => setRevealed(true));
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
