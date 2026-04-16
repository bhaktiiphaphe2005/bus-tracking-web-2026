export default function StatusBadge({ text = "Available" }) {
  return (
    <div className="status-pill">
      <span className="dot"></span>
      <span>{text}</span>
    </div>
  )
}