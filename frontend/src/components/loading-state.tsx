"use client";

type LoadingStateProps = {
  title?: string;
  detail?: string;
};

export function LoadingState({
  title = "Loading EduFX",
  detail = "Preparing your study session..."
}: LoadingStateProps) {
  return (
    <div className="panel loading-panel">
      <div className="pulse-dot" />
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </div>
  );
}
