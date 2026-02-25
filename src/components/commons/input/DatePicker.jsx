"use client";

import * as React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { enUS } from "date-fns/locale";


// ====== AGE 18+ LOGIC ======

const today = new Date();

const maxDate18 = new Date(
  today.getFullYear() - 18,
  today.getMonth(),
  today.getDate(),
);

const isOver18 = (birthDate) => {
  const cutoff = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  return birthDate <= cutoff;
};

const DatePicker = ({
  label = "Select date",
  value,
  onChange,
  placeholder = "Pick a date",
  className = "",
  error = false,
}) => {
  const [open, setOpen] = React.useState(false);

  const [month, setMonth] = React.useState(value ?? new Date());

  return (
    <Field className="mx-auto w-full">
      {label && (
        <label className="block mt-2 -mb-1 text-body2 font-medium text-black">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-empty={!value}
            className={`
            relative
            data-[empty=true]:text-muted-foreground 
            justify-between 
            text-left 
            font-normal             
            w-full
            h-12
            px-4
            py-3
            border
            rounded-lg
            focus:border-purple-500
            outline-none
            pr-4
            text-body2
            ${error ? "border-utility-red" : ""}
            ${className}
          `}
          >
            {value ? (
              <span className="text-body2">
                {format(value, "PPP", { locale: enUS })}
              </span>
            ) : (
              <span className="text-body2 text-gray-600 pl-1">
                {placeholder}
              </span>
            )}
            {error && (
              <Image
                src="/merry_icon/icon-exclamation.svg"
                className="absolute right-15 top-1/2 -translate-y-1/2 pointer-events-none"
                alt="error"
                width={16}
                height={16}
              />
            )}
            <Image
              src="/merry_icon/icon-calendar.svg"
              alt="calendar-icon"
              width={24}
              height={24}
              className="text-gray-600"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            month={month}
            onMonthChange={setMonth}
            defaultMonth={maxDate18}
            toDate={maxDate18} // 🔥 จำกัดอายุ 18+
            captionLayout="label"
            fromYear={1960}
            toYear={maxDate18.getFullYear()}
            onSelect={(date) => {
              if (!date) return;

              if (!isOver18(date)) {
                alert("You must be at least 18 years old.");
                return;
              }

              onChange(date);
              setMonth(date);
            }}
            locale={enUS}
            className="
    [&_[data-selected=true]>button]:bg-purple-500 
    [&_[data-selected=true]>button]:text-white
    [&_[data-selected=true]>button]:rounded-full
    [&_[data-selected=true]>button]:border-none  
    [&_button[data-selected-single=true]]:rounded-full!

    [&_.rdp-day_range_start]:bg-transparent
    [&_.rdp-day_range_end]:bg-transparent

    [&_[data-focus=true]>button]:rounded-full!
    [&_[data-focus=true]>button]:border-purple-500!
    [&_[data-focus=true]>button]:ring-0!
    [&_[data-focus=true]>button]:outline-none!      

    [&_[data-today=true]>button]:rounded-full
    [&_[data-today=true]>button]:border-2
    [&_[data-today=true]>button]:bg-gray-300

    [&_[data-today=true][data-selected=true]>button]:bg-purple-500
    [&_[data-today=true][data-selected=true]>button]:text-white
  "
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
};

export default DatePicker;

// example
//   const [date, setDate] = useState("");
//       <DatePicker
//       value={date}
//       onChange={setDate}
//       placeholder="Choose date" เปลี่ยน place holder
//     />
          