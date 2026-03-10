import NavBar from "@/components/NavBar";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { supabase } from "@/providers/supabase.provider";
import InputBar from "@/components/commons/input/InputBar";
import DatePicker from "@/components/commons/input/DatePicker";
import DropdownBar from "@/components/commons/input/DropDownBar";
import MultiSelect from "@/components/commons/input/MultiSelect";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import { SecondaryButton } from "@/components/commons/button/SecondaryButton";
import { PhotoUploadCard } from "@/components/register/PhotoUploadCard";
import Footer from "@/components/Footer";
import { ProfilePopup } from "@/components/profilePopup/ProfilePopup";
import { merryToast } from "@/components/commons/toast/MerryToast";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { PROFILE_IMAGES_BUCKET } from "@/lib/storageHelpers";
import { Loading } from "@/components/commons/Loading/Loading";

const PROFILE_PHOTO_SLOTS = 5;
const DEFAULT_PROFILE_ID = "2d552fcd-a0be-47fb-b325-9b2b3fc435b8";

const LOCATION_OPTIONS = ["Bangkok, Thailand", "Chiang Mai, Thailand", "Phuket, Thailand", "Other"];
const CITY_OPTIONS = ["Bangkok", "Chiang Mai", "Phuket", "Krabi", "Pattaya", "Other"];
const SEXUAL_IDENTITY_OPTIONS = ["Male", "Female", "Non-binary", "Other"];
const SEXUAL_PREFERENCE_OPTIONS = ["Male", "Female", "Any"];
const RACIAL_PREFERENCE_OPTIONS = ["Asian", "Any", "Other"];
const MEETING_INTEREST_OPTIONS = ["Friends", "Relationship", "Networking", "Dating", "Other"];
const HOBBIES_OPTIONS = ["E-sport", "Travel", "Movies", "Fitness", "Photography", "Hiking", "Cafe hopping", "Tech", "Business", "Gaming", "Music", "Reading"];

export default function ProfilePage() {
  const router = useRouter();
  const profileId = router.query.id ?? DEFAULT_PROFILE_ID;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(undefined);
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [sexualIdentity, setSexualIdentity] = useState("");
  const [sexualPreference, setSexualPreference] = useState("");
  const [racialPreference, setRacialPreference] = useState("");
  const [meetingInterest, setMeetingInterest] = useState("");
  const [interests, setInterests] = useState([]);
  const [about, setAbout] = useState("");
  const [photos, setPhotos] = useState(() => Array(PROFILE_PHOTO_SLOTS).fill(null));
  const [profileError, setProfileError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUser, setPreviewUser] = useState(null);
  const [previewImageUrls, setPreviewImageUrls] = useState([]);
  const fileInputRef = useRef(null);
  const pendingPhotoSlotRef = useRef(null);

  useEffect(() => {
    if (!profileId) return;

    setProfileError(null);
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/profile/${profileId}`);
        const data = res.data;

        setName(data.name ?? "");
        setDateOfBirth(data.birthday ? new Date(data.birthday) : undefined);
        setLocation(data.location ?? "");
        setCity(data.city ?? "");
        setUsername(data.username ?? "");
        setEmail(data.email ?? "");
        setSexualIdentity(data.sexualIdentity ?? "");
        setSexualPreference(data.sexualPreference ?? "");
        setRacialPreference(data.racialPreference ?? "");
        setMeetingInterest(data.meetingInterest ?? "");
        setAbout(data.about ?? "");
        setInterests(data.interests ?? []);
        const urls = (data.images ?? []).slice(0, PROFILE_PHOTO_SLOTS);
        const padded = [...urls, ...Array(PROFILE_PHOTO_SLOTS).fill(null)].slice(0, PROFILE_PHOTO_SLOTS);
        setPhotos(padded);
      } catch (err) {
        if (err.response?.status === 404) {
          setProfileError("ไม่พบโปรไฟล์นี้");
        } else {
          setProfileError(err.response?.data?.error || err.message || "โหลดโปรไฟล์ไม่สำเร็จ");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId]);

  const handlePhotoUploadClick = (slotIndex) => {
    pendingPhotoSlotRef.current = slotIndex;
    fileInputRef.current?.click();
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file == null) return;
    const index = pendingPhotoSlotRef.current;
    if (index == null || index < 0 || index >= PROFILE_PHOTO_SLOTS) return;
    setPhotos((prev) => {
      const next = [...prev];
      while (next.length < PROFILE_PHOTO_SLOTS) next.push(null);
      next[index] = file;
      return next;
    });
    e.target.value = "";
    pendingPhotoSlotRef.current = null;
  };

  const uploadFileToStorage = async (file) => {
    const ext = file.name.split(".").pop();
    const filePath = `${profileId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from(PROFILE_IMAGES_BUCKET)
      .upload(filePath, file, { upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data } = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      setProfileError(null);

      const imageUrls = [];
      for (const photo of photos) {
        if (photo instanceof File) {
          const url = await uploadFileToStorage(photo);
          imageUrls.push(url);
        } else if (typeof photo === "string" && photo) {
          imageUrls.push(photo);
        }
      }

      await axios.put(`/api/profile/${profileId}`, {
        name,
        birthday: dateOfBirth ? dateOfBirth.toISOString() : null,
        location,
        city,
        username,
        email,
        sexualIdentity,
        sexualPreference,
        racialPreference,
        meetingInterest,
        about,
        interests,
        images: imageUrls,
      });
      merryToast.success(
        "Profile updated",
        "อัปเดตโปรไฟล์สำเร็จ!",
        <CheckCircleIcon className="size-10! text-green-500" />,
      );
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "อัปเดตไม่สำเร็จ";
      setProfileError(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoRemove = (slotIndex) => {
    setPhotos((prev) => {
      const next = [...prev];
      while (next.length < PROFILE_PHOTO_SLOTS) next.push(null);
      next[slotIndex] = null;
      return next;
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const now = new Date();
    const birth = new Date(dob);
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleOpenPreview = () => {
    // cleanup object URLs เดิม (ถ้ามี)
    setPreviewImageUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });

    const tempUrls = [];
    const images = photos
      .map((photo) => {
        if (typeof photo === "string" && photo) return photo;
        if (photo instanceof File) {
          const url = URL.createObjectURL(photo);
          tempUrls.push(url);
          return url;
        }
        return null;
      })
      .filter(Boolean);

    if (tempUrls.length > 0) {
      setPreviewImageUrls(tempUrls);
    }

    const age = calculateAge(dateOfBirth);

    setPreviewUser({
      name,
      age,
      location,
      sexualIdentity,
      sexualPreference,
      racialPreference,
      meetingInterest,
      about,
      interests,
      images,
    });

    setPreviewOpen(true);
  };

  // cleanup object URLs เมื่อ component ถูก unmount
  React.useEffect(() => {
    return () => {
      previewImageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewImageUrls]);

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="flex justify-center items-center min-h-[60vh] bg-utility-bg-main">
          <Loading />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      {profileError && (
        <div className="mx-4 mt-4 p-4 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 text-body2" role="alert">
          {profileError}
        </div>
      )}
      <div className="lg:justify-center">
        <NavBar />
        {!previewOpen && (
        <div className="lg:flex lg:justify-center ">
        
          <div className="py-10  lg:flex lg:w-[931px]  lg:justify-center  px-4 flex flex-col gap-10 ">
            
            <header className="">
              <div>
                <span className="text-body2 font-semibold text-beige-700 tracking-widest">
                  PROFILE
                </span>
                <div className="lg:flex lg:justify-between items-end">
                  <h1 className="text-headline3 lg:text-headline2 text-purple-500 font-bold mt-2">
                    Let’s make profile <br />
                    <span className="text-purple-500 lg:text-headline2 font-bold">
                      to let others know you
                    </span>
                  </h1>
                  <div className="hidden lg:flex lg:gap-6 lg:justify-center lg:mt-6">
                    <SecondaryButton
                      type="button"
                      className="w-[156px] font-semibold py-4 "
                      onClick={handleOpenPreview}
                    >
                      Preview Profile
                    </SecondaryButton>
                    <PrimaryButton
                      type="button"
                      className="w-[156px]  font-semibold py-4 "
                      onClick={handleUpdateProfile}
                      disabled={updating}
                    >
                      {updating ? "Updating..." : "Update Profile"}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </header>
            <article className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <h1 className="text-headline4 text-gray-900 font-bold col-span-1 md:col-span-2">Basic Information</h1>
              <div className="gap-1">
                <h1 className="text-body2">Name</h1>
                <InputBar
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  maxLength={24}
                />
              </div>
              <div className="gap-1">
                <h1 className="text-body2">Date of birth</h1>
                <DatePicker value={dateOfBirth} onChange={setDateOfBirth} label="" placeholder="" />
              </div>
              <div className="gap-1">
                <h1 className="text-body2">Location</h1>
                <DropdownBar options={LOCATION_OPTIONS} value={location} onChange={setLocation} placeholder="Select location" />
              </div>
              <div className="gap-1">
                <h1 className="text-body2">City</h1>
                <DropdownBar options={CITY_OPTIONS} value={city} onChange={setCity} placeholder="Select city" />
              </div>
              <div className="gap-1">
                <h1 className="text-body2">Username</h1>
                <InputBar
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  maxLength={24}
                />
              </div>
              <div className="gap-1">
                <h1 className="text-body2 text-gray-600">Email</h1>
                <InputBar
                  type="email"
                  value={email}
                  readOnly
                  placeholder="Enter email"
                  className="cursor-not-allowed"
                  inputClassName="bg-gray-200 text-gray-600 cursor-not-allowed border-gray-300"
                />
              </div>
            </article>
            <article className="flex flex-col gap-6">

              <h1 className="text-headline4 text-gray-900 font-bold">Identities and Interests</h1>
              <div className="flex flex-col gap-6 lg:grid  lg:grid-cols-2">
                <div className="gap-1">
                  <h1 className="text-body2">Sexual identities</h1>
                  <DropdownBar options={SEXUAL_IDENTITY_OPTIONS} value={sexualIdentity} onChange={setSexualIdentity} placeholder="Select identity" />
                </div>
                <div className="gap-1 ">
                  <h1 className="text-body2">Sexual preferences</h1>
                  <DropdownBar options={SEXUAL_PREFERENCE_OPTIONS} value={sexualPreference} onChange={setSexualPreference} placeholder="Select preference" />
                </div>
                <div className="gap-1">
                  <h1 className="text-body2">Racial preferences</h1>
                  <DropdownBar options={RACIAL_PREFERENCE_OPTIONS} value={racialPreference} onChange={setRacialPreference} placeholder="Select preference" />
                </div>
                <div className="gap-1">
                  <h1 className="text-body2">Meeting interests</h1>
                  <DropdownBar options={MEETING_INTEREST_OPTIONS} value={meetingInterest} onChange={setMeetingInterest} placeholder="Select interest" />
                </div>

              </div>

              <div className="gap-1">
                <h1 className="text-body2">Hobbies / Interests (Maximum 10)</h1>
                <MultiSelect options={HOBBIES_OPTIONS} value={interests} onChange={setInterests} placeholder="Select hobbies" />
              </div>
              <div className="gap-1">
                <h1 className="text-body2">About me (Maximum 150 characters)</h1>
                <InputBar value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell us about you" maxLength={150} />
              </div>
            </article>
            {/* Profile pictures – upload grid (StepThreeUpload style) */}
            <article className="flex flex-col gap-6" aria-labelledby="profile-pictures-heading">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-hidden
                onChange={handlePhotoFileChange}
              />
              <header className="flex flex-col gap-1">
                <h2 id="profile-pictures-heading" className="text-headline4 text-purple-500 font-bold">
                  Profile pictures
                </h2>
                <p className="text-gray-800 text-body2 mt-1">Upload at least 2 photos</p>
              </header>
              <div
                className="grid grid-cols-2 gap-2 lg:grid-cols-5 lg:gap-6"
                role="list"
                aria-label="Profile photo slots"
              >
                {Array.from({ length: PROFILE_PHOTO_SLOTS }, (_, i) => {
                  const value = photos[i] ?? null;
                  const hasImage = value != null;
                  const isFile = value instanceof File;
                  const imageUrl = typeof value === "string" ? value : null;
                  return (
                    <PhotoUploadCard
                      key={i}
                      slotNumber={i + 1}
                      hasImage={hasImage}
                      file={isFile ? value : null}
                      imageUrl={imageUrl}
                      onRemove={() => handlePhotoRemove(i)}
                      onUpload={() => handlePhotoUploadClick(i)}
                      className="z-10"
                    />
                  );
                })}
              </div>

              <div className="flex gap-6 justify-center mt-6 lg:hidden">
                <SecondaryButton
                  type="button"
                  className="w-[156px] font-semibold py-4 "
                  onClick={handleOpenPreview}
                >
                  Preview Profile
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  className="w-[156px]  font-semibold  py-4 "
                  onClick={handleUpdateProfile}
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Update Profile"}
                </PrimaryButton>
              </div>
            </article>

          </div>

        </div>
        )}

      </div>
      <ProfilePopup
        className="z-50"
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        id={profileId}
        prefilledUser={previewUser}
        leftButton={null}
        rightButton={null}
      />
      <Footer />
    </>
  );
}