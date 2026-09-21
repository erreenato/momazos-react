import { useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

/** Tags an element so the browser's View Transitions API can morph it smoothly
 *  between two different layouts (e.g. a small card and a big detail view). */
export function useViewTransitionName<T extends HTMLElement = HTMLElement>(name: string) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    ref.current?.style.setProperty('view-transition-name', name);
  }, [name]);
  return ref;
}

/** Runs a state update inside the View Transitions API when available, so any element
 *  sharing a view-transition-name morphs smoothly between its before/after layout. */
export function withViewTransition(applyChange: () => void) {
  const doc = document as ViewTransitionDocument;
  if (doc.startViewTransition) {
    doc.startViewTransition(() => flushSync(applyChange));
  } else {
    applyChange();
  }
}
