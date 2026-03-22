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
import { PhotoUploadCard, SortablePhotoUploadCard } from "@/components/register/PhotoUploadCard";
import Footer from "@/components/Footer";
import { ProfilePopup } from "@/components/profilePopup/ProfilePopup";
import { merryToast } from "@/components/commons/toast/MerryToast";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { PROFILE_IMAGES_BUCKET } from "@/lib/storageHelpers";
import { Loading } from "@/components/commons/Loading/Loading";
import Modal from "@/components/commons/modal/modal";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";

const PROFILE_PHOTO_SLOTS = 5;

function getAuthHeaders(token) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

const LOCATION_OPTIONS = ["Bangkok, Thailand", "Chiang Mai, Thailand", "Phuket, Thailand", "Other"];
const CITY_OPTIONS = ["Bangkok", "Chiang Mai", "Phuket", "Krabi", "Pattaya", "Other"];
const SEXUAL_IDENTITY_OPTIONS = ["Male", "Female", "Non-binary", "Other"];
const SEXUAL_PREFERENCE_OPTIONS = ["Male", "Female", "Any"];
const RACIAL_PREFERENCE_OPTIONS = ["Asian", "Any", "Other"];
const MEETING_INTEREST_OPTIONS = ["Friends", "Relationship", "Networking", "Dating", "Other"];
const HOBBIES_OPTIONS = ["E-sport", "Travel", "Movies", "Fitness", "Photography", "Hiking", "Cafe hopping", "Tech", "Business", "Gaming", "Music", "Reading"];

export default function ProfilePage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState(null);

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");
  const [deleteEmailError, setDeleteEmailError] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [dropJustEnded, setDropJustEnded] = useState(false);
  const fileInputRef = useRef(null);
  const pendingPhotoSlotRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );

  const getPhotoDragBaseId = (photo, index) => {
    if (typeof photo === "string") return `url:${photo}`;
    if (photo instanceof File) {
      return `file:${photo.name}:${photo.size}:${photo.lastModified}`;
    }
    return `photo:${index}`;
  };

  const buildPhotoDragEntries = (photoList) => {
    const counter = new Map();
    return photoList
      .map((value, index) => ({ value, index }))
      .filter((item) => item.value != null)
      .map((item) => {
        const baseId = getPhotoDragBaseId(item.value, item.index);
        const count = counter.get(baseId) ?? 0;
        counter.set(baseId, count + 1);
        return {
          ...item,
          dragId: `${baseId}#${count}`,
        };
      });
  };

  const handlePhotosDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDropJustEnded(true);
    setPhotos((prev) => {
      const entries = buildPhotoDragEntries(prev);
      const oldIndex = entries.find((entry) => entry.dragId === String(active.id))?.index ?? -1;
      const newIndex = entries.find((entry) => entry.dragId === String(over.id))?.index ?? -1;

      if (oldIndex < 0 || newIndex < 0) {
        return prev;
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
    setTimeout(() => setDropJustEnded(false), 120);
  };

  useEffect(() => {
    setProfileError(null);
    const fetchProfile = async () => {
      try {
        setLoading(true);

        // ดึง user ปัจจุบันจาก auth → profile id
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;

        const meRes = await axios.get("/api/me", {
          headers: getAuthHeaders(token),
        });
        const meProfileId = meRes.data?.profile?.id ?? null;

        if (!meProfileId) {
          setProfileError("Profile not found.");
          setLoading(false);
          return;
        }

        setProfileId(meProfileId);

        // ใช้ profile id ที่ได้ไปดึงข้อมูลโปรไฟล์แบบเดิม
        const res = await axios.get(`/api/profile/${meProfileId}`);
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
        const padded = [...urls, ...Array(PROFILE_PHOTO_SLOTS).fill(null)].slice(
          0,
          PROFILE_PHOTO_SLOTS,
        );
        setPhotos(padded);
      } catch (err) {
        if (err.response?.status === 404) {
          setProfileError("Profile not found.");
        } else {
          setProfileError(
            err.response?.data?.error ||
              err.message ||
              "Failed to load your profile. Please try again.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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
        "Your profile has been updated successfully.",
        <CheckCircleIcon className="size-10! text-green-500" />,
      );
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Failed to update profile. Please try again.";
      setProfileError(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoRemove = (slotIndex) => {
    setPhotos((prev) => {
      // ลบรูปที่ตำแหน่ง slotIndex แล้วจัดรูปที่เหลือให้ชิดซ้าย
      const kept = prev.filter((_, i) => i !== slotIndex && prev[i] != null);
      const padded = [...kept, ...Array(PROFILE_PHOTO_SLOTS).fill(null)].slice(
        0,
        PROFILE_PHOTO_SLOTS,
      );
      return padded;
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

  const handleConfirmDeleteAccount = async () => {
    if (deletingAccount) return;

    // ตรวจว่า email ที่พิมพ์ตรงกับ email ปัจจุบันหรือไม่
    if (
      !email ||
      !deleteEmailInput ||
      deleteEmailInput.trim().toLowerCase() !== email.trim().toLowerCase()
    ) {
      setDeleteEmailError(true);
      return;
    }

    try {
      setDeletingAccount(true);
      setDeleteEmailError(false);
      setProfileError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;

      await axios.delete("/api/me/account", {
        headers: getAuthHeaders(token),
      });

      // sign out ฝั่ง client แล้วพาไปหน้า login
      await supabase.auth.signOut();
      setDeleteModalOpen(false);
      merryToast.success(
        "Account deleted",
        "Your account has been deleted successfully.",
        <CheckCircleIcon className="size-10! text-green-500" />,
      );
      await router.replace("/login");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to delete your account. Please try again.";
      setProfileError(msg);
    } finally {
      setDeletingAccount(false);
    }
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

  // ถ้าไม่พบโปรไฟล์ แสดงหน้า error เต็มหน้า
  if (profileError === "Profile not found.") {
    return (
      <>
        <NavBar />
        <div className="flex justify-center items-center min-h-[60vh] bg-utility-bg-main">
          <div className="max-w-md mx-auto text-center px-4">
            <h1 className="text-headline4 font-bold text-gray-900 mb-2">
              Profile not found
            </h1>
            <p className="text-body3 text-gray-700">
              We couldn&apos;t find your profile. You may need to create a new one or sign in
              again.
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      {profileError && (
        <div
          className="mx-4 mt-4 p-4 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 text-body2"
          role="alert"
        >
          {profileError}
        </div>
      )}
      <div className="lg:justify-center">
        <NavBar />
        <div className="lg:flex lg:justify-center ">
        
          <div className="py-10  lg:flex lg:w-[931px]  lg:justify-center  px-4 flex flex-col gap-10 lg:gap-20 ">
            
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
                <DatePicker
                  label=""
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  placeholder="Choose date"
                  className="h-[48px]"
                  minAge={18}
                />
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePhotosDragEnd}
              >
                {(() => {
                  const photoDragEntries = buildPhotoDragEntries(photos);
                  return (
                <SortableContext
                  items={photoDragEntries.map((item) => item.dragId)}
                  strategy={rectSortingStrategy}
                >
                  <div
                    className="grid grid-cols-2 gap-2 lg:grid-cols-5 lg:gap-6"
                    role="list"
                    aria-label="Profile photo slots"
                  >
                    {photos.map((value, i) => {
                      const hasImage = value != null;
                      const isFile = value instanceof File;
                      const imageUrl = typeof value === "string" ? value : null;
                      if (hasImage) {
                        const photoDragId =
                          photoDragEntries.find((entry) => entry.index === i)?.dragId ??
                          `photo:${i}#0`;
                        return (
                          <SortablePhotoUploadCard
                            key={photoDragId}
                            id={photoDragId}
                            slotNumber={i + 1}
                            hasImage
                            file={isFile ? value : null}
                            imageUrl={imageUrl}
                            onRemove={() => handlePhotoRemove(i)}
                            onUpload={() => handlePhotoUploadClick(i)}
                            disableTransition={dropJustEnded}
                          />
                        );
                      }

                      return (
                        <PhotoUploadCard
                          key={i}
                          slotNumber={i + 1}
                          hasImage={false}
                          file={null}
                          imageUrl={null}
                          onRemove={() => handlePhotoRemove(i)}
                          onUpload={() => handlePhotoUploadClick(i)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
                  );
                })()}
              </DndContext>

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
            <button
              type="button"
              className="mt-4 text-body3 font-bold text-gray-700 flex justify-center lg:justify-end cursor-pointer hover:text-red-400 hover:underline"
              onClick={() => {
                setDeleteEmailInput("");
                setDeleteEmailError(false);
                setDeleteModalOpen(true);
              }}
            >
              Delete account
            </button>

          </div>

        </div>

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
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteEmailError(false);
          setDeletingAccount(false);
        }}
        title="Delete Confirmation"
        message={
          <div className="flex flex-col gap-2">
            <p className="text-body3 text-gray-800">
              Are you sure you want to delete your account?
            </p>
            <p className="text-body4 text-gray-600">
              To confirm, please type this email:&nbsp;
              <span className="font-semibold text-gray-900">{email || "-"} </span>
            </p>
            <InputBar
              type="email"
              value={deleteEmailInput}
              onChange={(e) => {
                setDeleteEmailInput(e.target.value);
                if (deleteEmailError) setDeleteEmailError(false);
              }}
              placeholder="Type your email to confirm"
              inputClassName={
                deleteEmailError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                  : undefined
              }
            />
            {deleteEmailError && (
              <p className="text-body5 text-red-500">
                The email you entered doesn&apos;t match. Please type the email shown above.
              </p>
            )}
            {deletingAccount && (
              <p className="text-body5 text-gray-500">
                Deleting your account, please wait...
              </p>
            )}
          </div>
        }
        leftText="Yes, I want to delete"
        rightText="No, I don’t"
        type="secondary"
        onLeftClick={handleConfirmDeleteAccount}
        onRightClick={() => {
          setDeleteModalOpen(false);
          setDeleteEmailError(false);
          setDeletingAccount(false);
        }}
        fullWidthButtons
      />
      <Footer />
    </>
  );
}