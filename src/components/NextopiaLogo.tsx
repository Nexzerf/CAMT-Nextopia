/** โลโก้งาน CAMT NEXTopia (ตัวอักษรโครเมียม + ประกายดาว + แสงไฟส้ม) */
export default function NextopiaLogo({ size = 44, tagline = true, className = "" }: { size?: number; tagline?: boolean; className?: string }) {
  return (
    <div className={`nx-logo ${className}`} style={{ ["--nx" as string]: `${size}px` }} role="img" aria-label="CAMT NEXTopia — Design Your Future">
      <span className="nx-streak" aria-hidden />
      <span className="nx-camt" aria-hidden>
        CAMT
      </span>
      <span className="nx-word" aria-hidden>
        NE<span className="nx-x">X</span>T<span className="nx-low">opia</span>
        <span className="nx-star">✦</span>
      </span>
      {tagline && (
        <span className="nx-tag" aria-hidden>
          DESIGN YOUR FUTURE
        </span>
      )}
      <span className="nx-flare" aria-hidden />
    </div>
  );
}
