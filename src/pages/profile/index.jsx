import NavBar from "@/components/NavBar";
import React, { useState, useMemo } from "react";
import { mockProfiles } from "@/components/commons/mockProfile";
import InputBar from "@/components/commons/input/InputBar";
import DatePicker from "@/components/commons/input/DatePicker";
import DropdownBar from "@/components/commons/input/DropDownBar";
import MultiSelect from "@/components/commons/input/MultiSelect";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import { SecondaryButton } from "@/components/commons/button/SecondaryButton";
import PhotoUpload from "@/components/commons/input/PhotoUpload";
import Footer from "@/components/Footer";

const PROFILE_PHOTO_SLOTS = 5; // จำนวนช่องรูป (มือถือ grid 2 คอลัมน์, เดสก์ท็อปแถวเดียว)

const LOCATION_OPTIONS = ["Bangkok, Thailand", "Chiang Mai, Thailand", "Phuket, Thailand", "Other"];
const CITY_OPTIONS = ["Bangkok", "Chiang Mai", "Phuket", "Krabi", "Pattaya", "Other"];
const SEXUAL_IDENTITY_OPTIONS = ["Male", "Female", "Non-binary", "Other"];
const SEXUAL_PREFERENCE_OPTIONS = ["Male", "Female", "Any"];
const RACIAL_PREFERENCE_OPTIONS = ["Asian", "Any", "Other"];
const MEETING_INTEREST_OPTIONS = ["Friends", "Relationship", "Networking", "Dating", "Other"];
const HOBBIES_OPTIONS = ["E-sport", "Travel", "Movies", "Fitness", "Photography", "Hiking", "Cafe hopping", "Tech", "Business", "Gaming", "Music", "Reading"];

export default function ProfilePage() {
  const user = mockProfiles[0];
  const initialUrls = user?.images ?? [];
  const initialPhotos = useMemo(
    () => initialUrls.map((url) => ({ url })),
    [initialUrls.length]
  );

  const [name, setName] = useState(user?.name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined
  );
  const [location, setLocation] = useState(user?.location ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [sexualIdentity, setSexualIdentity] = useState(user?.sexualIdentity ?? "");
  const [sexualPreference, setSexualPreference] = useState(user?.sexualPreference ?? "");
  const [racialPreference, setRacialPreference] = useState(user?.racialPreference ?? "");
  const [meetingInterest, setMeetingInterest] = useState(user?.meetingInterest ?? "");
  const [interests, setInterests] = useState(user?.interests ?? []);
  const [about, setAbout] = useState(user?.about ?? "");
  const [photos, setPhotos] = useState(initialPhotos);
  console.log(name);
  
  return (
    <>

      <div className="lg:flex lg:justify-center">
        <div className="lg:flex lg:justify-center ">
          <div className="py-10 lg:pt-20 lg:flex lg:w-[931px]  lg:justify-center  px-4 flex flex-col gap-10 ">
            <NavBar />
            <header className="pt-[45px]">
              <div className="">
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
                    >
                      Preview Profile
                    </SecondaryButton>
                    <PrimaryButton
                      type="button"
                      className="w-[156px]  font-semibold py-4 "
                    >
                      Update Profile
                    </PrimaryButton>
                  </div>
                </div>


              </div>
              {/* <SecondaryButton >Preview Profile</SecondaryButton>
        <PrimaryButton>Update Profile</PrimaryButton> */}
            </header>
            <article className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <h1 className="text-headline4 text-gray-900 font-bold col-span-1 md:col-span-2">Basic Information</h1>
              <div className="gap-1">
                <h1 className="text-body2">Name</h1>
                <InputBar value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
              </div>
              <div className="gap-1">
                <h1 className="text-body2">Date of birth</h1>
                <DatePicker value={dateOfBirth} onChange={setDateOfBirth} placeholder="Pick a date" />
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
                <InputBar value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
              </div>
              <div className="gap-1">
                <h1 className="text-body2">Email</h1>
                <InputBar type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" />
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
            {/* ส่วน Profile pictures ตาม photo container.svg + photo.svg + photo (1).svg */}
            <article className="flex flex-col gap-6">
              <div>
                <h2 className="text-headline4 text-purple-500 font-bold">Profile pictures</h2>
                <p className="text-gray-800 text-body2 mt-1">Upload at least 2 photos</p>
              </div>
              <PhotoUpload
                className="w-[167px] h-[167px]"
                value={photos}
                onChange={setPhotos}
                maxSlots={PROFILE_PHOTO_SLOTS}
                accept="image/*"
              />
              <div className="flex gap-6 justify-center mt-6 lg:hidden">
                <SecondaryButton
                  type="button"
                  className="w-[156px] font-semibold py-4 "
                >
                  Preview Profile
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  className="w-[156px]  font-semibold  py-4 "
                >
                  Update Profile
                </PrimaryButton>
              </div>
            </article>

          </div>

        </div>

      </div>
      <Footer />
    </>
  );
}