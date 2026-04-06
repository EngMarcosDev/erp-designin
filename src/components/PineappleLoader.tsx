type PineappleLoaderProps = {
  label?: string;
  fullScreen?: boolean;
  compact?: boolean;
};

const PineappleLoader = ({
  label = "Carregando",
  fullScreen = false,
  compact = false,
}: PineappleLoaderProps) => {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-4 ${
        fullScreen ? "min-h-screen px-6" : compact ? "py-6" : "py-12"
      }`}
    >
      <div className="pineapple-loader-shell" aria-hidden="true">
        <span className="pineapple-loader-orbit pineapple-loader-orbit--outer" />
        <span className="pineapple-loader-orbit pineapple-loader-orbit--inner" />
        <img
          src="/assets/branding/pineapple-icon.png"
          alt=""
          className="pineapple-loader-icon"
        />
      </div>
      <p className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
};

export default PineappleLoader;
