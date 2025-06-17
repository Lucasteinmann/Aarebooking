"use client"

import React from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from './ui/button'
import { BookingCalendar } from './booking-calendar'
import { cn } from '@/lib/utils'
import { MinusIcon, PlusIcon, ClockIcon, Loader2 } from 'lucide-react'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { createClient } from '@/lib/supabase/client'
import { parsePhoneNumberFromString } from 'libphonenumber-js' // For phone number validation
import GooglePlaceAutocompleteElement from "./GooglePlaceAutocompleteElement";

// --- Define Booking Item Structure and Initial State ---
interface BookingItem {
  id: string; // This will store the boat_id from the 'boats' table
  name: string;
  count: number; // User's current selection for this booking
  price: number;
  originalTotalInventory: number;
  currentAvailableForDate: number;
}

// Base definitions of items.
const baseItemDefinitions: Pick<BookingItem, 'id' | 'name' | 'price'>[] = [
  { id: 'small-raft', name: 'Small Raft', price: 140 },
  { id: 'medium-raft', name: 'Medium Raft', price: 200 },
  { id: 'large-raft', name: 'Large Raft', price: 250 },
  { id: 'sup', name: 'SUP', price: 50 },
  { id: 'kanu', name: 'Kanu', price: 90 },
];

// Generate time slots from 10:00 to 14:30 in 30-minute intervals
const timeSlots: string[] = [];
for (let hour = 10; hour <= 14; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    if (hour === 14 && minute > 30) continue; // Stop at 14:30
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    timeSlots.push(time);
  }
}
if (!timeSlots.includes("14:30")) timeSlots.push("14:30");

// --- End Booking Item ---

function BookDialog() {
  // Helper to get a clean date string (yyyy-mm-dd) in local time
  const toDateOnly = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const supabase = createClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogStep, setDialogStep] = React.useState<'selection' | 'detailsEntry'>('selection');

  const [bookingItems, setBookingItems] = React.useState<BookingItem[]>([]);
  const [detailsDate, setDetailsDate] = React.useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = React.useState<string | undefined>(timeSlots[0]);
  const [isLoadingAvailability, setIsLoadingAvailability] = React.useState(false);
  const [availabilityError, setAvailabilityError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [bookingSummary, setBookingSummary] = React.useState<{
    date: Date | undefined;
    time: string | undefined;
    items: BookingItem[]; // items here will have 'id' corresponding to boat_id
    totalCost: number;
  } | null>(null);

  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerEmail, setCustomerEmail] = React.useState('');
  const [customerConfirmEmail, setCustomerConfirmEmail] = React.useState('');
  const [customerAddress, setCustomerAddress] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleDateSelectedFromCalendar = (date: Date) => {
    setDetailsDate(date);
    setAvailabilityError(null);
  };

  const handleChangeDate = () => {
    if (bookingSummary) {
      setDetailsDate(bookingSummary.date);
      setSelectedTime(bookingSummary.time);
      // Temporarily set bookingItems from summary. useEffect will fetch fresh availability.
      setBookingItems(bookingSummary.items.map(item => ({
        ...item,
        originalTotalInventory: item.originalTotalInventory || 0,
        currentAvailableForDate: item.currentAvailableForDate || 0
      })));
    } else {
      setDetailsDate(undefined);
      setSelectedTime(timeSlots[0]);
      setBookingItems([]);
    }
    setDialogStep('selection');
    setFormError(null);
  };

  const handleProceedToDetails = () => {
    const currentTotalCost = bookingItems.reduce((sum, item) => sum + item.count * item.price, 0);
    if (!detailsDate || !selectedTime || currentTotalCost === 0) {
      alert("Please select a date, time, and at least one item.");
      return;
    }
    setBookingSummary({
      date: detailsDate,
      time: selectedTime,
      items: bookingItems.filter(item => item.count > 0),
      totalCost: currentTotalCost,
    });
    setDialogStep('detailsEntry');
    setFormError(null);
  };

  const handleFinalConfirmBooking = async () => {
    setFormError(null);

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (customerEmail !== customerConfirmEmail) {
      setFormError("Emails do not match.");
      return;
    }

    // Validate Phone Number
    const phoneNumber = parsePhoneNumberFromString(customerPhone); // Tries to infer country if '+' is present
    if (!customerPhone || !phoneNumber || !phoneNumber.isValid()) {
      setFormError("Please enter a valid phone number (e.g., +41 79 123 45 67).");
      return;
    }

    // Validate other required fields
    if (!customerName || !customerAddress) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (!bookingSummary) {
      setFormError("Booking summary is missing. Please go back and select items.");
      return;
    }

    const bookingEntries = bookingSummary.items.map(item => ({
      booking_date: toDateOnly(bookingSummary.date!), // Use the consistent helper
      booking_time: bookingSummary.time,
      item_id: item.id, // This 'id' comes from BookingItem, which should be boat_id
      quantity: item.count,
      customer_name: customerName,      
      customer_phone: phoneNumber.format('E.164'), // Store in standardized E.164 format
      customer_email: customerEmail,
      customer_address: customerAddress,
      line_item_total_cost: item.price * item.count
    }));

    try {
      setIsLoadingAvailability(true);
      const { error } = await supabase.from('bookings').insert(bookingEntries);
      if (error) throw error;

      setDetailsDate(undefined);
      setBookingItems([]);
      setSelectedTime(timeSlots[0]);
      setAvailabilityError(null);
      setIsDialogOpen(false);
      setDialogStep('selection');
      setBookingSummary(null);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerConfirmEmail('');
      setCustomerAddress('');
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Error confirming booking:", error);
      setFormError(error.message || "Could not confirm booking. Please try again.");
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const handleItemQuantityChange = (itemId: string, change: number) => {
    setBookingItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, count: Math.min(item.currentAvailableForDate, Math.max(0, item.count + change)) }
          : item
      )
    );
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setDetailsDate(undefined);
      setBookingItems([]);
      setSelectedTime(timeSlots[0]);
      setAvailabilityError(null);
      setDialogStep('selection');
      setBookingSummary(null);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerConfirmEmail('');
      setCustomerAddress('');
      setFormError(null);
    }
  }

  const totalCost = React.useMemo(() => {
    return bookingItems.reduce((sum, item) => sum + item.count * item.price, 0);
  }, [bookingItems]);

  React.useEffect(() => {
    if (!detailsDate || dialogStep !== 'selection') {
      if (dialogStep !== 'detailsEntry') {
        setBookingItems([]);
      }
      return;
    }

    const fetchAvailability = async () => {
      setIsLoadingAvailability(true);
      setAvailabilityError(null);
      const dateString = toDateOnly(detailsDate); // Use the consistent helper
      console.log(`[AVAILABILITY] Fetching for date: ${dateString}, RefreshKey: ${refreshKey}`);

      try {
        const { data: itemMasterList, error: itemMasterError } = await supabase
          .from('boats')
          .select('boat_id, name, price, total_inventory'); // Use boat_id

        if (itemMasterError) throw itemMasterError;
        if (!itemMasterList) throw new Error("Could not fetch item master data.");
        console.log("[AVAILABILITY] Fetched itemMasterList:", JSON.stringify(itemMasterList, null, 2));

        const { data: dailyBookingsData, error: dailyBookingsError } = await supabase
          .from('bookings')
          .select('item_id, quantity') // This is bookings.item_id
          .eq('booking_date', dateString);

        if (dailyBookingsError) throw dailyBookingsError;
        console.log(`[AVAILABILITY] Fetched dailyBookingsData for ${dateString}:`, JSON.stringify(dailyBookingsData, null, 2));

        const aggregatedBookedQuantities: Record<string, number> = {};
        (dailyBookingsData || []).forEach(booking => {
          if (booking.item_id) { // booking.item_id from bookings table
            console.log(`[AVAILABILITY] Processing booking from dailyBookingsData: item_id=${booking.item_id}, quantity=${booking.quantity}`);
            aggregatedBookedQuantities[booking.item_id] =
              (aggregatedBookedQuantities[booking.item_id] || 0) + (booking.quantity || 0);
          }
        });
        console.log("[AVAILABILITY] Aggregated Booked Quantities:", JSON.stringify(aggregatedBookedQuantities, null, 2));

        const availableItems = itemMasterList.map(masterItem => {
          // masterItem.boat_id from boats table
          const totalBooked = masterItem.boat_id ? (aggregatedBookedQuantities[masterItem.boat_id] || 0) : 0;
          const actualStockForDate = Math.max(0, (masterItem.total_inventory || 0) - totalBooked);
          console.log(`[AVAILABILITY] Item: ${masterItem.name} (boat_id: ${masterItem.boat_id}) - Total Inventory: ${masterItem.total_inventory || 0}, Booked on this date: ${totalBooked}, Calculated Actual Stock: ${actualStockForDate}`);
          
          let countForThisItem = 0;
          if (bookingSummary && bookingSummary.date?.getTime() === detailsDate.getTime()) {
            const summaryItem = bookingSummary.items.find(si => si.id === masterItem.boat_id); // Compare summary.id with boat_id
            countForThisItem = summaryItem?.count || 0;
          }
          
          return {
            id: masterItem.boat_id, // Set BookingItem.id to boat_id
            name: masterItem.name,
            price: masterItem.price,
            originalTotalInventory: masterItem.total_inventory || 0,
            count: countForThisItem,
            currentAvailableForDate: actualStockForDate,
          };
        });
        console.log("[AVAILABILITY] Processed availableItems to set in state:", JSON.stringify(availableItems, null, 2));
        setBookingItems(availableItems);
      } catch (error: any) {
        console.error("Error fetching availability:", error);
        setAvailabilityError(error.message || "Failed to load item availability.");
        setBookingItems([]);
      } finally {
        setIsLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [detailsDate, dialogStep, supabase, bookingSummary, refreshKey]);

  const getAvailabilityColor = (currentItem: BookingItem) => {
    if (currentItem.currentAvailableForDate <= 0 || currentItem.originalTotalInventory <= 0) {
      return 'bg-destructive/40 text-destructive';
    }
    const percentageLeft = (currentItem.currentAvailableForDate / currentItem.originalTotalInventory) * 100;
    if (percentageLeft <= 25) return 'bg-destructive/40 text-destructive';
    if (percentageLeft <= 50) return 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300';
    return 'bg-green-600/20 text-green-700 dark:bg-green-500/20 dark:text-green-300';
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>Book Now</Button>
        </DialogTrigger>
        <DialogContent className={cn(
          "max-w-[calc(100%-2rem)]",
          dialogStep === 'selection' ? "sm:max-w-3xl md:max-w-4xl" : "sm:max-w-xl",
          "flex flex-col max-h-[calc(100vh-4rem)]"
        )}>
          <DialogHeader>
            <DialogTitle>
              {dialogStep === 'selection' && (detailsDate ? "Confirm Your Booking Items" : "Choose a Date")}
              {dialogStep === 'detailsEntry' && "Enter Your Details"}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-4">
            {dialogStep === 'selection' && (
              <div className="flex flex-col md:flex-row gap-6">
                <div className={cn(
                  "flex-shrink-0",
                  detailsDate ? "md:w-auto" : "w-full"
                )}>
                  <BookingCalendar onDateConfirmed={handleDateSelectedFromCalendar} />
                </div>

                {detailsDate && (
                  <div className="flex-1 flex flex-col justify-between border-l-0 md:border-l md:pl-6 pt-4 md:pt-0">
                    <div>
                      <p className="text-sm font-medium">You have selected:</p>
                      <p className="text-lg mt-1 mb-4">
                        {detailsDate.toLocaleDateString(undefined, {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                      <div className="mt-4 mb-6">
                        <Label htmlFor="booking-time" className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                          <ClockIcon className="size-4 mr-2" />
                          Select Time:
                        </Label>
                        <select
                          id="booking-time"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="w-full p-2 border rounded-md bg-background text-sm focus:ring-ring focus:border-ring"
                        >
                          {timeSlots.map(slot => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={cn(
                        "min-h-[200px]",
                        "max-h-72",
                        "overflow-y-auto",
                        "pr-2"
                      )}>
                        {isLoadingAvailability && (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading availability...</span>
                          </div>
                        )}
                        {availabilityError && !isLoadingAvailability && (
                          <p className="text-sm text-destructive text-center py-4">{availabilityError}</p>
                        )}
                        {!isLoadingAvailability && !availabilityError && bookingItems.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Select items:</h4>
                            {bookingItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                <div>
                                  <span className="text-sm font-medium block">{item.name} (CHF {item.price.toFixed(2)})</span>
                                  <span
                                    className={cn(
                                      "text-xs px-2 py-0.5 rounded-md inline-block mt-1",
                                      getAvailabilityColor(item)
                                    )}
                                  >
                                    {item.currentAvailableForDate > 0 ? `Available: ${item.currentAvailableForDate}` : 'Unavailable'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => handleItemQuantityChange(item.id, -1)}
                                    disabled={item.count === 0 || item.currentAvailableForDate === 0}
                                  >
                                    <MinusIcon className="size-4" />
                                  </Button>
                                  <span className="text-sm font-medium w-6 text-center">{item.count}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => handleItemQuantityChange(item.id, 1)}
                                    disabled={item.count >= item.currentAvailableForDate || item.currentAvailableForDate === 0}
                                  >
                                    <PlusIcon className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                         {!isLoadingAvailability && !availabilityError && bookingItems.length === 0 && detailsDate && (
                           <p className="text-sm text-muted-foreground text-center py-4">No items available for this date.</p>
                        )}
                      </div>
                      {!isLoadingAvailability && !availabilityError && bookingItems.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                          <p className="text-lg font-semibold text-right">Total: CHF {totalCost.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                    <DialogFooter className="mt-auto pt-4 sticky bottom-0 bg-background pb-0">
                      <Button onClick={handleProceedToDetails} disabled={isLoadingAvailability || !!availabilityError || totalCost === 0}>
                        Go to Details
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </div>
            )}

            {dialogStep === 'detailsEntry' && bookingSummary && (
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted/50">
                  <h3 className="text-md font-semibold mb-2">Booking Summary</h3>
                  <p className="text-sm"><strong>Date:</strong> {bookingSummary.date?.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-sm"><strong>Time:</strong> {bookingSummary.time}</p>
                  <p className="text-sm font-medium mt-2">Items:</p>
                  <ul className="list-disc list-inside text-sm ml-4">
                    {bookingSummary.items.map(item => (
                      <li key={item.id}>{item.name} x {item.count} (CHF {(item.price * item.count).toFixed(2)})</li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-md font-semibold">Total: CHF {bookingSummary.totalCost.toFixed(2)}</p>
                    <Button variant="outline" size="sm" onClick={handleChangeDate}>
                      Edit Booking
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-semibold mb-3 mt-6">Your Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="customer-name" className="mb-1">Full Name *</Label>
                      <Input
                        id="customer-name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Aareboots"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-phone-number" className="mb-1">Phone Number *</Label>
                      <Input id="customer-phone-number" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+41 79 123 45 67" required />
                    </div>
                    <div>
                      <Label htmlFor="customer-email" className="mb-1">Email *</Label>
                      <Input id="customer-email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div>
                      <Label htmlFor="customer-confirm-email" className="mb-1">Confirm Email *</Label>
                      <Input id="customer-confirm-email" type="email" value={customerConfirmEmail} onChange={(e) => setCustomerConfirmEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div>
                      <Label htmlFor="customer-address" className="mb-1">
                        Address (Street, City, Country) *
                      </Label>
                      <GooglePlaceAutocompleteElement
                        id="customer-address"
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        onPlaceSelected={(placeData) => { // placeData is { formattedAddress?: string; name?: string } | null
                          if (placeData && placeData.formattedAddress) {
                            setCustomerAddress(placeData.formattedAddress);
                          } else if (placeData && placeData.name) {
                            // Fallback if formatted_address is not available
                            setCustomerAddress(placeData.name);
                          }
                        }}
                        onChange={(e) => setCustomerAddress(e.target.value)} // For manual input
                        value={customerAddress} // Controlled component
                        options={{
                          types: ['address'],
                          // Optional: Restrict to a specific country, e.g., Switzerland
                          // componentRestrictions: { country: "ch" },
                        }}
                        placeholder="Main Street 1, 3000 Bern"
                      />
                    </div>
                  </div>
                  {formError && <p className="text-sm text-destructive mt-3">{formError}</p>}
                </div>
                <DialogFooter className="pt-4 sticky bottom-0 bg-background pb-0">
                  <Button variant="outline" onClick={handleChangeDate}>Back to Edit</Button>
                  <Button onClick={handleFinalConfirmBooking} disabled={isLoadingAvailability}>
                    Confirm & Book Now
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { BookDialog }
