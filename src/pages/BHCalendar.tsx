
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const BHCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
  
  // Sample highlighted dates - would come from Supabase in a real implementation
  const highlightedDates = [
    new Date(2025, 4, 10),
    new Date(2025, 4, 15),
    new Date(2025, 4, 20),
  ];

  // When a date is selected, show events for that day
  const handleDateSelect = (date?: Date) => {
    setDate(date);
    // In a real app, you would fetch events for the selected date
    setSelectedEvents([]);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Visit Calendar</h1>
        <Button asChild>
          <a href="/bh/new-visit">
            <Plus className="mr-2 h-4 w-4" /> Schedule Visit
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  highlighted: highlightedDates,
                }}
                modifiersClassNames={{
                  highlighted: "bg-primary text-primary-foreground",
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">
                {date ? date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Select a date'}
              </h2>
              
              {selectedEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No visits scheduled for this day</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <a href="/bh/new-visit">Schedule a Visit</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Events would go here */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BHCalendar;
