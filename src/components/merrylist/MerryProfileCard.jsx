import React, { useState } from "react";
import { MerryStatus } from "@/components/merrylist/MerryStatus.jsx";
import { ButtonGoToChat, ButtonSeeProfile, ButtonMerry } from "@/components/commons/button/IconButton";

export function MerryProfileCard({ profile, children, onViewProfile }) {
  if (!profile) return null;

  const mainImage = profile.images?.[0];

  const [isMerryPressed, setIsMerryPressed] = useState(true);
  // Default action buttons (used when no children are provided)
  const defaultActions = (
    <div className="flex gap-3">
      {profile.status === 1 && (
        <ButtonGoToChat iconClassName="brightness-0 saturate-0 opacity-60" />
      )}
      <ButtonSeeProfile
        iconClassName="brightness-0 saturate-0 opacity-60"
        onClick={onViewProfile}
      />
      <ButtonMerry
        pressed={isMerryPressed}
        onClick={() => setIsMerryPressed((prev) => !prev)}
      />
    </div>
  );

  const actions = children ?? defaultActions;

  return (
    <div>
      <div className="pb-2 px-1 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex justify-between">
          {/* Profile image */}
          {mainImage && (
            <div className="relative w-[120px] h-[120px] shrink-0 lg:w-[187px] lg:h-[187px]">
              <img
                src={mainImage}
                alt={profile.name}
                className="w-full h-full rounded-[24px] object-cover aspect-square"
              />
              {profile.merryMatchedToday && (
                <div className="absolute inset-0 flex items-end justify-start">
                  <h1 className="text-purple-600 bg-purple-100 text-body5 w-fit h-fit px-2 rounded-tr-xl rounded-bl-[20px]">
                    Merry today
                  </h1>
                </div>
              )}
            </div>
          )}
          <div className="flex items-start justify-between gap-3 lg:hidden">
            <div className="flex flex-col items-end gap-3 min-w-0">
              <MerryStatus status={profile.status} />
              {actions}
            </div>
          </div>



        </div>
        {/* Main profile content */}
        <div className="flex flex-col gap-4 w-full min-w-0 lg:flex-1 lg:order-1">
          {/* Mobile top row: status/actions (อยู่ใต้รูป) */}


          {/* Name + location */}
          <div className="flex flex-row gap-4 lg:items-center ">
            <div className="flex items-center gap-2 min-w-0">

              <h1 className="text-headline4 font-bold text-gray-900 truncate">{profile.name}</h1>
              <h1 className="text-headline4 font-bold text-gray-700 shrink-0">{profile.age}</h1>
            </div>

            <div className="flex items-center gap-1.5 text-body2 text-gray-700">
              <img src="/merry_icon/icon-match-log.svg" alt="" className="h-4 w-4 shrink-0" />
              <p className="truncate">{profile.location}</p>
            </div>
          </div>

          {/* Detail table */}
          <dl className="grid grid-cols-[auto_1fr] gap-y-3 gap-x-8 text-body2">
            <dt className="text-gray-900 font-medium text-left">Sexual identities</dt>
            <dd className="min-w-0 font-semibold text-gray-700 wrap-break-word text-left">
              {profile.sexualIdentity}
            </dd>
            <dt className="text-gray-900 font-medium text-left">Sexual preferences</dt>
            <dd className="min-w-0 font-semibold text-gray-700 wrap-break-word text-left">
              {profile.sexualPreference}
            </dd>
            <dt className="text-gray-900 font-medium text-left">Racial preferences</dt>
            <dd className="min-w-0 font-semibold text-gray-700 wrap-break-word text-left">
              {profile.racialPreference}
            </dd>
            <dt className="text-gray-900 font-medium text-left">Meeting interests</dt>
            <dd className="min-w-0 font-semibold text-gray-700 wrap-break-word text-left">
              {profile.meetingInterest}
            </dd>
          </dl>
        </div>

        {/* Desktop status/actions */}
        <div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-6 lg:order-2 shrink-0">
          <MerryStatus status={profile.status} />
          {actions}
        </div>
      </div>
      <div className="border"></div>
      <div className="pb-8"></div>
    </div>
  );
}

