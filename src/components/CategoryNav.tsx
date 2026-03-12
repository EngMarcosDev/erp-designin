import { Cigarette, Coffee, Filter, Flame, Package, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { name: "Sedas", icon: Cigarette, href: "/categoria/sedas" },
  { name: "Piteiras", icon: Filter, href: "/categoria/piteira" },
  { name: "Fumigenos", icon: Flame, href: "/categoria/fumigenos" },
  { name: "Cuias", icon: Coffee, href: "/categoria/cuia" },
  { name: "BacaKits", icon: Package, href: "/categoria/bacakits" },
  { name: "Acessorios", icon: Sparkles, href: "/categoria/acessorios" },
];

const CategoryNav = () => {
  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={category.href}
              className="group flex flex-col items-center gap-1.5 sm:gap-2"
            >
              <div className="category-circle w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18">
                <category.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary group-hover:text-accent transition-colors" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm font-medium text-foreground/80 group-hover:text-accent transition-colors text-center">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-4xl mx-auto mt-6 sm:mt-8">
        <div className="h-px bg-border/60" />
      </div>
    </section>
  );
};

export default CategoryNav;
