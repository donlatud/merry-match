// components/matching/ActionButtons.jsx
import { ButtonMerry, ButtonPass } from "../commons/button/IconButton";
export default function ActionButtons({
  onPass,
  onMerry,
  merryDisabled,
  currentProfileId,
}) {
  return (
    <div className="flex items-center justify-center gap-6 pb-6">
      {/* Pass */}
      <ButtonPass
        key={`pass-${currentProfileId}`}
        onClick={onPass}
        className="w-20 h-20 disabled:opacity-40 disabled:cursor-not-allowed [&_img]:w-12 [&_img]:h-12 "
      />

      {/* Merry */}
      <ButtonMerry
         key={`merry-${currentProfileId}`} 
        onClick={onMerry}
        disabled={merryDisabled}
        className="w-20 h-20 disabled:opacity-40 disabled:cursor-not-allowed [&_img]:w-12 [&_img]:h-12"
      />
    </div>
  );
}
