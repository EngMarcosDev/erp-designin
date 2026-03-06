import { useEffect, useMemo, useRef, useState } from "react";

const PROMO_SLIDE_MS = 3330;
const PROMO_LOOP_MS = PROMO_SLIDE_MS * 3;
const TRANSITION_MS = 500;
const DRAG_THRESHOLD = 60;

const NewsBanner = () => {
  const slides = useMemo(
    () => [
      {
        title: "Novidade 1",
        subtitle: "Destaque da semana",
        name: "Kit Premium Brown",
        price: "R$ 89,90",
        badge: "Novo",
        image: "",
      },
      {
        title: "Novidade 2",
        subtitle: "Selecao especial",
        name: "Piteira Gold Slim",
        price: "R$ 19,90",
        badge: "Exclusivo",
        image: "",
      },
      {
        title: "Novidade 3",
        subtitle: "Chegou agora",
        name: "Cuia Mate Lux",
        price: "R$ 59,90",
        badge: "Limitado",
        image: "",
      },
    ],
    []
  );
  const extendedSlides = useMemo(
    () => [...slides, slides[0]],
    [slides]
  );
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const dragStartX = useRef<number | null>(null);
  const dragDelta = useRef(0);

  useEffect(() => {
    const onLoop = () => {
      if (isPaused) return;
      setIndex((prev) => prev + 1);
      setCycleKey((prev) => prev + 1);
      setIsTransitioning(true);
    };
    window.addEventListener("abacaxita:promo-loop", onLoop);
    return () => {
      window.removeEventListener("abacaxita:promo-loop", onLoop);
    };
  }, [isPaused]);

  const goNext = () => {
    setIndex((prev) => prev + 1);
    setCycleKey((prev) => prev + 1);
    setIsTransitioning(true);
  };
  const goPrev = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setCycleKey((prev) => prev + 1);
    setIsTransitioning(true);
  };
  const goTo = (nextIndex: number) => {
    setIndex(nextIndex);
    setCycleKey((prev) => prev + 1);
    setIsTransitioning(true);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
    dragDelta.current = 0;
    setIsPaused(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    dragDelta.current = event.clientX - dragStartX.current;
  };

  const handlePointerUp = () => {
    if (dragStartX.current === null) return;
    const delta = dragDelta.current;
    dragStartX.current = null;
    dragDelta.current = 0;
    setIsPaused(false);
    if (Math.abs(delta) < DRAG_THRESHOLD) return;
    if (delta < 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  return (
    <section className="news-banner">
      <div className="news-banner-header">
        <h2 className="news-banner-title">Novidades</h2>
      </div>

      <div className="news-banner-shell">
        <div
          className="news-banner-track"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            transform: `translateX(-${index * 100}%)`,
            transitionDuration: isTransitioning ? `${TRANSITION_MS}ms` : "0ms",
          }}
          onTransitionEnd={() => {
            if (index === slides.length) {
              setIsTransitioning(false);
              setIndex(0);
            }
          }}
        >
          {extendedSlides.map((slide, i) => (
            <div
              key={`${slide.title}-${i}`}
              className="news-banner-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${(i % slides.length) + 1} de ${slides.length}`}
            >
              <div className="news-banner-slide-inner">
                <div className="news-banner-card">
                  <div
                    className="news-banner-image"
                    aria-hidden="true"
                    style={slide.image ? { backgroundImage: `url(${slide.image})` } : undefined}
                  >
                    <div className="news-banner-image-label">{slide.badge}</div>
                  </div>
                  <div className="news-banner-text">
                    <span className="news-banner-label">{slide.title}</span>
                    <span className="news-banner-subtitle">{slide.subtitle}</span>
                    <span className="news-banner-name">{slide.name}</span>
                    <span className="news-banner-price">{slide.price}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="news-banner-progress">
        {slides.map((_, i) => (
          <button
            key={`bar-${i}`}
            type="button"
            className={`news-banner-progress-item ${i === index ? "is-active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Ir para novidade ${i + 1}`}
          >
            <span
              key={`bar-fill-${cycleKey}-${index}-${i}`}
              className={`news-banner-progress-fill ${i === index ? "is-active" : ""}`}
              style={{ animationDuration: `${PROMO_LOOP_MS}ms` }}
            />
          </button>
        ))}
      </div>
    </section>
  );
};

export default NewsBanner;

