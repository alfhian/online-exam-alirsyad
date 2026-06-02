const LoadingButton = ({
  children,
  loading = false,
  loadingText = "Memproses...",
  disabled = false,
  className = "",
  type = "button",
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    {...props}
  >
    <span className="inline-flex items-center justify-center gap-2">
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {loading ? loadingText : children}
    </span>
  </button>
);

export default LoadingButton;
