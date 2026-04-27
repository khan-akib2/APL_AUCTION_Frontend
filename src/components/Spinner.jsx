export default function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  return <div className={`${s} border border-white/20 border-t-white rounded-full animate-spin`} />;
}
