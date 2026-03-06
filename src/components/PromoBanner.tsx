import { useEffect, useState } from "react";
import { Leaf, Truck, Tag } from "lucide-react";

const banners = [
  {
    id: 1,
    bg: "bg-rasta-green",
    text: "Tenha uma boa Sesh!",
    textColor: "text-white",
    icon: Leaf,
  },
  {
    id: 2,
    bg: "bg-rasta-yellow",
    text: "Entregas rastreáveis.",
    textColor: "text-primary",
    icon: Truck,
  },
  {
    id: 3,
    bg: "bg-rasta-red",
    text: "Consulte nossas promoções.",
    textColor: "text-white",
    icon: Tag,
  },
];

const PromoBanner = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = setInterval(() => {
      if (current === banners.length - 1) {
        setIsTransitioning(false);
        setCurrent(0);
        setTimeout(() => setIsTransitioning(true), 50);
      } else {
        setCurrent((prev) => prev + 1);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [current]);

  return (
    <section className="relative w-full overflow-hidden h-9">
      <div
        className={`flex h-full ${
          isTransitioning ? "transition-transform duration-700 ease-in-out" : ""
        }`}
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`w-full flex-shrink-0 ${banner.bg} h-full flex items-center justify-center gap-2`}
          >
            <banner.icon className={`w-4 h-4 ${banner.textColor} opacity-80`} />
            <span
              className={`text-xs font-bold tracking-wide ${banner.textColor}`}
            >
              {banner.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PromoBanner;
