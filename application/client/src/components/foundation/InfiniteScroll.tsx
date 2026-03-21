import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const bottomMarkerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bottomMarkerRef.current) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting);
        if (isIntersecting && latestItem !== undefined) {
          fetchMore();
        }
      },
      { threshold: 1.0 },
    );
    observer.observe(bottomMarkerRef.current);
    return () => {
      observer.disconnect();
    };
  }, [fetchMore, latestItem]);

  return (
    <>
      {children}
      <div ref={bottomMarkerRef} aria-hidden />
    </>
  );
};
