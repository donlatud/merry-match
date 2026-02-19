"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const DatePicker = ({
  value,
  onChange,
  placeholder = "Pick a date",
  className = "",
}) => {

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!value}
          className={`
            data-[empty=true]:text-muted-foreground 
            justify-between 
            text-left 
            font-normal             
            w-full
            h-12
            px-4
            py-3
            border
            border-gray-400
            rounded-lg
            focus:border-purple-500
            outline-none
            pr-4
            text-body2
            ${className}
          `}
        >
          {value ? (
            <span className="text-body2">
              {format(value, "PPP")}
            </span>
          ) : (
            <span className="text-body2 text-gray-600 pl-1">
              {placeholder}
            </span>
          )}
          <img src="/merry_icon/icon-calendar.svg" className="text-gray-600" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
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
            **:data-[today=true]:bg-transparent
            [&_[data-today=true]>button]:bg-gray-300

            [&_.rdp-day_button]:group-data-[focused=true]/day:rounded-full!
            [&_.rdp-day_button]:group-data-[focused=true]/day:ring-purple-500!
            [&_.rdp-day_button]:group-data-[focused=true]/day:ring-[1px]!
          "
        />
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker

// example
//   const [date, setDate] = useState("");
//       <DatePicker
//       value={date}
//       onChange={setDate}
//       placeholder="Choose date" เปลี่ยน place holder
//     />