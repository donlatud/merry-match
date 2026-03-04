import { prisma } from "@/lib/prisma";

const profileIncludes = {
  images: { orderBy: { order: "asc" } },
  profileHobbies: { include: { hobby: true } },
  user: { select: { username: true, email: true } },
};

export async function findProfileById(rawId) {
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== "string") {
    const error = new Error("Profile id is required");
    error.statusCode = 400;
    throw error;
  }

  const profile = await prisma.profile.findUnique({
    where: { id },
    include: profileIncludes,
  });

  if (!profile) {
    const error = new Error("Profile not found");
    error.statusCode = 404;
    throw error;
  }

  return profile;
}

export async function findAllProfiles() {
  return prisma.profile.findMany({
    include: profileIncludes,
  });
}

function calculateAge(birthday) {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const m = today.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
}

export function toPublicProfileJson(profile) {
  return {
    id: profile.id,
    name: profile.full_name,
    age: profile.birthday ? calculateAge(profile.birthday) : null,
    birthday: profile.birthday,
    location: profile.location,
    city: profile.city,
    sexualIdentity: profile.gender,
    sexualPreference: profile.sexual_preference,
    racialPreference: profile.racial_preference,
    meetingInterest: profile.meeting_interest,
    about: profile.bio,
    interests: (profile.profileHobbies ?? [])
      .map((ph) => ph.hobby?.name)
      .filter(Boolean),
    images: (profile.images ?? []).map((img) => img.image_url),
    username: profile.user?.username ?? "",
    email: profile.user?.email ?? "",
  };
}

export function toPublicProfileListJson(profiles) {
  return profiles.map(toPublicProfileJson);
}
