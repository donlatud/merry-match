// components/matching/ProfileCard.jsx
export default function ProfileCard({ profile, onViewProfile }) {
  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <img
        src={profile.image}
        alt={profile.name}
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
        draggable={false}
      />
      <div className="absolute inset-0 bg-linear-to-t from-[rgba(116,33,56,0.9)] via-[rgba(116,33,56,0.15)] to-transparent" />
      <div className="absolute bottom-0 left-5 right-5 pb-14">
        <h2 className="text-headline3 font-bold text-white">
          {profile.name} {profile.age}
        </h2>
        <div className="flex items-center gap-1.5 mt-1">
          <img
            src="/merry_icon/icon-location.svg"
            alt=""
            className="w-4 h-4 opacity-80"
          />
          <span className="text-body4 text-white/80">{profile.location}</span>
        </div>
        <button
          onClick={() => onViewProfile?.(profile.id)}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
        >
          <img src="/merry_icon/icon-view.svg" alt="view profile" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}