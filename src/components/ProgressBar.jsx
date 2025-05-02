export default function ProgressBar({ progress }) {
  const limitedProgress = Math.max(0, Math.min(progress, 100));

  return (
    <div className="progress-bar-container">
      <div
        className="progress-bar-fill"
        style={{ width: `${limitedProgress}%` }}
      />
    </div>
  );
}
