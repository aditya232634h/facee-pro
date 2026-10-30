export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    fontFamily: { display: ['"Instrument Serif"', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'] },
    colors: { navy: '#0F172A', muted: '#64748B', accent: '#3B82F6',
      slot: { available: '#16A34A', reserved: '#F59E0B', occupied: '#DC2626', maintenance: '#94A3B8' } },
  } },
  plugins: [],
};
