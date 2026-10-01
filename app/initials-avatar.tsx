export default function InitialsAvatar({ initials }: { initials: string }) {
  return (
    <span className="avatar" aria-hidden="true">
      {initials}
    </span>
  );
}
