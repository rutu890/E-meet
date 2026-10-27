import { memo } from "react";

const Sk = ({ w = "100%", h = 12, r = 8, circle = false, style }) => (
  <span className="em-skel" aria-hidden="true" style={{ width: w, height: h, borderRadius: circle ? "50%" : r, ...style }} />
);

export const HomeSkeleton = memo(function HomeSkeleton() {
  return (
    <div className="em-dashboard-grid" aria-busy="true" aria-label="Loading dashboard">
      <section className="em-primary-column">
        <div className="em-welcome"><Sk w={280} h={24} style={{ marginBottom: 10 }} /><Sk w={210} h={12} /></div>
        <div className="em-action-grid">
          {[0, 1].map((i) => (
            <div className="em-skel-card" style={{ minHeight: 174 }} key={i}>
              <Sk w={36} h={36} circle style={{ marginBottom: 14 }} /><Sk w="45%" h={16} style={{ marginBottom: 10 }} /><Sk w="75%" h={10} style={{ marginBottom: 18 }} /><Sk w={i ? "100%" : 120} h={34} />
            </div>
          ))}
        </div>
        <div className="em-skel-card">
          <div className="em-skel-row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <div><Sk w={70} h={14} style={{ marginBottom: 8 }} /><Sk w={170} h={10} /></div><Sk w={210} h={32} r={8} />
          </div>
          {[0, 1, 2].map((i) => (
            <div className="em-skel-row" style={{ padding: "16px 0", borderTop: "1px solid #eef3f5" }} key={i}>
              <Sk w={34} h={34} circle /><div style={{ flex: 1 }}><Sk w="40%" h={12} style={{ marginBottom: 8 }} /><Sk w="25%" h={9} /></div><Sk w={70} h={22} r={20} /><Sk w={60} h={30} r={7} />
            </div>
          ))}
        </div>
      </section>
      <aside className="em-right-column">
        <div className="em-skel-card">
          <Sk w={120} h={14} style={{ marginBottom: 18 }} />
          <div className="em-skel-grid">{Array.from({ length: 28 }, (_, i) => <Sk key={i} h={26} r={8} />)}</div>
        </div>
        <div className="em-skel-card em-skel-stack">
          <Sk w={120} h={14} />{[0, 1, 2].map((i) => <Sk key={i} h={40} r={6} />)}
        </div>
      </aside>
    </div>
  );
});

export const SettingsSkeleton = memo(function SettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading settings">
      <div className="em-page-heading"><div><Sk w={160} h={10} style={{ marginBottom: 12 }} /><Sk w={190} h={28} style={{ marginBottom: 10 }} /><Sk w={340} h={11} /></div><Sk w={140} h={40} r={9} /></div>
      <Sk w={470} h={46} r={12} style={{ marginBottom: 20, maxWidth: "100%" }} />
      <div className="em-settings-content">
        <div className="em-skel-card" style={{ padding: 22 }}>
          <div className="em-skel-row" style={{ marginBottom: 22 }}><Sk w={40} h={40} r={12} /><div style={{ flex: 1 }}><Sk w={140} h={13} style={{ marginBottom: 8 }} /><Sk w={240} h={10} /></div></div>
          <div className="em-skel-row" style={{ marginBottom: 22 }}><Sk w={72} h={72} circle /><div style={{ flex: 1 }}><Sk w={110} h={12} style={{ marginBottom: 8 }} /><Sk w="70%" h={10} /></div></div>
          <div className="em-settings-fields">{[0, 1, 2, 3].map((i) => <div key={i}><Sk w={80} h={10} style={{ marginBottom: 8 }} /><Sk h={40} r={8} /></div>)}</div>
        </div>
      </div>
    </div>
  );
});

export const SupportSkeleton = memo(function SupportSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading help center">
      <div className="em-skel-card" style={{ padding: 30, display: "grid", justifyItems: "center", gap: 12, marginBottom: 28 }}>
        <Sk w={170} h={10} /><Sk w={300} h={28} style={{ maxWidth: "100%" }} /><Sk w={420} h={11} style={{ maxWidth: "100%" }} /><Sk w={540} h={48} r={11} style={{ maxWidth: "100%" }} />
      </div>
      <div className="em-support-grid">
        {[0, 1, 2, 3].map((i) => (
          <div className="em-skel-card" key={i}><Sk w={41} h={41} r={12} style={{ marginBottom: 14 }} /><Sk w="60%" h={13} style={{ marginBottom: 9 }} /><Sk h={10} style={{ marginBottom: 6 }} /><Sk w="80%" h={10} style={{ marginBottom: 16 }} /><Sk h={10} style={{ marginBottom: 10 }} /><Sk h={10} /></div>
        ))}
      </div>
    </div>
  );
});

export const ProfileSkeleton = memo(function ProfileSkeleton() {
  return (
    <div className="em-profile-page-wrap" aria-busy="true" aria-label="Loading profile">
      <Sk w={60} h={12} style={{ marginBottom: 20 }} />
      <div className="em-skel-card" style={{ display: "grid", justifyItems: "center", gap: 12, padding: 34 }}>
        <Sk w={92} h={92} circle /><Sk w={190} h={22} /><Sk w={100} h={11} /><Sk w={90} h={28} r={99} /><Sk w={190} h={40} r={9} />
      </div>
      <div className="em-skel-card" style={{ marginTop: 18 }}>
        <div className="em-skel-row" style={{ marginBottom: 20 }}><Sk w={40} h={40} r={12} /><Sk w={160} h={13} /></div>
        <div className="em-profile-detail-grid">{[0, 1, 2, 3].map((i) => <div key={i}><Sk w={70} h={9} style={{ marginBottom: 8 }} /><Sk w="70%" h={13} /></div>)}</div>
      </div>
    </div>
  );
});
