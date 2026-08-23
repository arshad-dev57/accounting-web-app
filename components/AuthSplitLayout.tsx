import type { ReactNode } from 'react';

const HERO_SRC =
  'https://images.unsplash.com/photo-1553413077-190dd305871c?w=900&q=80&fit=crop';

const CRITICAL_CSS = `
.bt-auth{display:flex;min-height:100vh;width:100%;background:#fff}
.bt-auth-hero{display:none}
.bt-auth-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.bt-auth-hero-shade{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.8),rgba(0,0,0,.35),rgba(0,0,0,.2))}
.bt-auth-hero-copy{position:relative;z-index:1;margin-top:auto;padding:48px;color:#fff}
.bt-auth-panel{flex:1 1 50%;position:relative;z-index:2;background:#fff;display:flex;align-items:center;justify-content:center;padding:32px;min-height:100vh}
@media(min-width:1024px){
  .bt-auth-hero{display:flex;flex-direction:column;width:50%;flex-shrink:0;position:relative;overflow:hidden;min-height:100vh}
}
`;

export default function AuthSplitLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      <div className="bt-auth">
        <div className="bt-auth-hero">
          {/* Native img — Hostinger often breaks /_next/image on first hit */}
          <img src={HERO_SRC} alt="" />
          <div className="bt-auth-hero-shade" />
          {(title || subtitle) && (
            <div className="bt-auth-hero-copy">
              {title ? (
                <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, margin: '0 0 12px' }}>
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,.75)', maxWidth: 360 }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          )}
        </div>
        <div className="bt-auth-panel">{children}</div>
      </div>
    </>
  );
}
