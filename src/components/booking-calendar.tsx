"use client"

import React from 'react'

import { Calendar } from './ui/calendar'

interface BookingCalendarProps {
  onDateConfirmed?: (date: Date) => void; // Callback for when a date is selected
}

function BookingCalendar({ onDateConfirmed }: BookingCalendarProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
    const currentYear = new Date().getFullYear();
    const firstDayOfCurrentYear = new Date(currentYear, 0, 1);

    const handleDateSelect = (date: Date | undefined) => {
      setSelectedDate(date);
      if (date && onDateConfirmed) {
        onDateConfirmed(date); // Notify parent component
      }
    }

  return (
    <div className='w-full flex justify-center'>
    <Calendar
    mode='single'
    selected={selectedDate}
    onSelect={handleDateSelect}
    numberOfMonths={1}
    defaultMonth={selectedDate || new Date()}
    startMonth={firstDayOfCurrentYear}
    showOutsideDays
    weekStartsOn={1}
    fixedWeeks
    className=''
    disabled={(day) => {
        const now = new Date();
        const cutoffHour = 14;
        const cutoffMinute = 30;

        // Disable dates strictly before the current day (ignores time component)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (day < startOfToday) {
          return true;
        }

        // Disable current day after 14:30
        if (day.getFullYear() === now.getFullYear() &&
            day.getMonth() === now.getMonth() &&
            day.getDate() === now.getDate() &&
            (now.getHours() > cutoffHour || (now.getHours() === cutoffHour && now.getMinutes() > cutoffMinute))) {
          return true;
        }
        return false;
      }}
    />
    </div>
  )
}

export { BookingCalendar }
