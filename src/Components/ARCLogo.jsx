export function ARCLogo({ width = 30, height = 26 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 56 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 2 L28 9 L33 2" fill="none" stroke="#BFA06A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="26.5" y1="10" x2="5"  y2="47" stroke="#BFA06A" strokeWidth="5.5" strokeLinecap="square"/>
      <line x1="29.5" y1="10" x2="51" y2="47" stroke="#BFA06A" strokeWidth="5.5" strokeLinecap="square"/>
      <line x1="13"   y1="29" x2="43" y2="29" stroke="#BFA06A" strokeWidth="5.5" strokeLinecap="square"/>
    </svg>
  );
}
