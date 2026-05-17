const SkeletonPage = () => (
  <div className="skeleton-page">
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-text" style={{ width: "40%", marginBottom: "20px" }} />
    <div className="skeleton-grid">
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
    <div className="skeleton skeleton-card" style={{ marginTop: "16px" }} />
    <div className="skeleton skeleton-text" style={{ width: "80%", marginTop: "12px" }} />
    <div className="skeleton skeleton-text" style={{ width: "60%", marginTop: "8px" }} />
  </div>
);

export default SkeletonPage;
