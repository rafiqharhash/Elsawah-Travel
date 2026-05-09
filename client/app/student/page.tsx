"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { subscribeToBooking, unsubscribeFromBooking } from "@/services/socket";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLang } from "@/app/providers";
import { useStudent } from "@/contexts/StudentContext";
import { Upload, CheckCircle2, Clock, XCircle, X, LogOut, FileText, Plus, User } from "lucide-react";
import { Footer } from "@/components/ui/footer";

// ── Pricing & locations ───────────────────────────────────────────────────────
const LOCATIONS = [
  { en: "Kafr Eksheikh", ar: "كفر الشيخ", price: 210 },
  { en: "Desouk", ar: "دسوق", price: 190 },
  { en: "Damanhour", ar: "دمنهور", price: 190 },
  { en: "Abu Hummus", ar: "أبو حمص", price: 170 },
  { en: "Kafr Eldawwar", ar: "كفر الدوار", price: 170 },
];

const DROPOFFS = [
  { en: "AIU Campus", ar: "الجامعة" },
  { en: "Iskan Motamayez (AIU Dorms)", ar: "اسكان متميز (سكن الجامعة)" },
  { en: "Sakan Masr (Oppo)", ar: "سكن مصر (أمام أوبو)" },
  { en: "Porto Golf (Entrance)", ar: "بورتو جولف (البوابة)" },
];

const getPrice = (locName: string) => LOCATIONS.find(l => l.en === locName)?.price || 0;

// ── Validation Schema ─────────────────────────────────────────────────────────
const bookingSchema = z.object({
  studentName: z.string().min(2, "Name required"),
  studentPhone: z.string().min(10, "Valid phone required"),
  pickupLocation: z.string().min(1, "Please select a pickup location"),
  pickupAddress: z.string().min(3, "Please enter an exact pickup address"),
  dropoffLocation: z.string().min(1, "Please select a drop-off location"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function StudentPortal() {
  const { t, isRTL } = useLang();
  const { student, logout, isLoading } = useStudent();
  const [activeTab, setActiveTab] = useState<"book" | "history">("book");

  // Booking Wizard State
  const [step, setStep] = useState(1);
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'Confirmed' | 'Cancelled' | null>(null);
  const [seatCount, setSeatCount] = useState(1);

  // Payment screenshot
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // My Bookings State
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      studentName: student?.name || "",
      studentPhone: student?.phone || "",
      pickupLocation: "",
      pickupAddress: "",
      dropoffLocation: "",
    },
  });

  const selectedPickup = form.watch("pickupLocation");
  const price = getPrice(selectedPickup);

  // Pre-fill profile info when student loads
  useEffect(() => {
    if (student) {
      form.setValue("studentName", student.name);
      form.setValue("studentPhone", student.phone);
    }
  }, [student, form]);

  // Fetch available trips
  useEffect(() => {
    if (activeTab !== "book" || step !== 1) return;
    const fetchTrips = async () => {
      try {
        const res = await api.get("/trips?status=Scheduled,Active");
        setAvailableTrips(res.data.data);
      } catch (err) {
        setLoadError(true);
      }
    };
    fetchTrips();
  }, [activeTab, step]);

  // Fetch My Bookings
  useEffect(() => {
    if (activeTab !== "history") return;
    const fetchBookings = async () => {
      setIsLoadingBookings(true);
      try {
        const res = await api.get("/students/my-bookings");
        setMyBookings(res.data.data);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setIsLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submitBooking = async () => {
    if (!screenshotFile || !selectedTrip) return;
    const values = form.getValues();
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("studentName", values.studentName);
      fd.append("studentPhone", values.studentPhone);
      fd.append("pickupLocation", values.pickupLocation);
      fd.append("pickupAddress", values.pickupAddress);
      fd.append("dropoffLocation", values.dropoffLocation);
      fd.append("tripId", selectedTrip._id);
      fd.append("seatCount", String(seatCount));
      fd.append("paymentScreenshot", screenshotFile);
      if (student?._id) {
        fd.append("studentId", student._id);
      }

      const res = await api.post("/bookings", fd);
      setBookingResult(res.data.data);
      setStep(4);
    } catch (err: any) {
      alert(err.response?.data?.message || "Booking failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    if (bookingResult?._id) unsubscribeFromBooking(bookingResult._id);
    setStep(1);
    setSelectedTrip(null);
    setBookingResult(null);
    setBookingStatus(null);
    setSeatCount(1);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    form.setValue("pickupLocation", "");
    form.setValue("pickupAddress", "");
    form.setValue("dropoffLocation", "");
  };

  // Socket subscription for step 4
  useEffect(() => {
    if (step !== 4 || !bookingResult?._id) return;
    setBookingStatus(null);
    subscribeToBooking(bookingResult._id, (data) => {
      setBookingStatus(data.status);
    });
    return () => {
      unsubscribeFromBooking(bookingResult._id);
    };
  }, [step, bookingResult?._id]);

  useEffect(() => {
    if (!isLoading && !student) {
      window.location.href = "/student/login";
    }
  }, [isLoading, student]);

  if (isLoading || !student) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {student.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.studentNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <button onClick={logout} className="w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col pt-8">
        {/* Tabs */}
        <div className="flex bg-white/5 border border-border p-1 rounded-xl mb-8 max-w-xs mx-auto w-full relative z-10">
          <button
            onClick={() => { setActiveTab("book"); resetFlow(); }}
            className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2", activeTab === "book" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground")}
          >
            <Plus size={16} /> Book Ride
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2", activeTab === "history" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground")}
          >
            <FileText size={16} /> My Bookings
          </button>
        </div>

        <div className="relative z-10 flex-1 flex flex-col pb-24 max-w-md mx-auto w-full">
          {activeTab === "book" && (
            <div className="glass-card p-6 w-full relative overflow-hidden">
              <AnimatePresence mode="wait">
                {/* ── Step 1: Trip Selection ── */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                    <div>
                      <h2 className="text-lg font-bold">{t("step1Title")}</h2>
                      <p className="text-sm text-muted-foreground">Available routes for today</p>
                    </div>

                    {/* Quick location picker - updates departure times in the list live */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground block">{t("pickupLocation")}</label>
                      <select
                        value={selectedPickup}
                        onChange={e => form.setValue("pickupLocation", e.target.value)}
                        className="sys-select"
                      >
                        <option value="">— Select your area to see times —</option>
                        {LOCATIONS.map(l => (
                          <option key={l.en} value={l.en}>{l.en}</option>
                        ))}
                      </select>
                    </div>

                    {loadError ? (
                      <p className="text-destructive text-sm text-center py-4">Failed to load trips.</p>
                    ) : availableTrips.length === 0 ? (
                      <div className="text-center py-10 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-muted-foreground text-sm">No trips available at the moment.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availableTrips.map((trip) => {
                          const isFull = trip.totalBooked >= trip.totalCapacity;
                          const customTime = trip.locationTimes?.find((lt: any) => lt.location === selectedPickup)?.time;
                          const displayTime = customTime || trip.departureTime;
                          return (
                            <button
                              key={trip._id}
                              disabled={isFull}
                              onClick={() => { setSelectedTrip(trip); setStep(2); }}
                              className={cn("w-full text-left p-4 rounded-xl border transition-all",
                                isFull ? "opacity-50 grayscale cursor-not-allowed border-white/5 bg-white/5" : "hover:border-primary/50 hover:bg-white/5 bg-white/5 border-white/10"
                              )}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">{trip.route}</span>
                                <span className="text-primary font-mono bg-primary/10 px-2 py-1 rounded text-sm">{displayTime}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>{isFull ? t("full") : `${trip.totalCapacity - trip.totalBooked} ${t("seatsLeft")}`}</span>
                                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div className={cn("h-full", trip.occupancyPercentage > 90 ? "bg-destructive" : "bg-primary")} style={{ width: `${trip.occupancyPercentage}%` }} />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Step 2: Passenger Details ── */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                    <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">← {t("back")}</button>
                    <div>
                      <h2 className="text-lg font-bold">{t("step2Title")}</h2>
                      <p className="text-sm text-muted-foreground">Confirm your pickup and drop-off</p>
                    </div>
                    <form onSubmit={form.handleSubmit(() => setStep(3))} className="space-y-4">
                      {/* Trip summary info */}
                      {selectedTrip && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{selectedTrip.route}</span>
                          <span className="font-mono text-primary font-bold">
                            {selectedPickup
                              ? (selectedTrip.locationTimes?.find((lt: any) => lt.location === selectedPickup)?.time || selectedTrip.departureTime)
                              : selectedTrip.departureTime}
                          </span>
                        </div>
                      )}
                      {/* Using read-only fields for student info since it's from context */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">{t("studentName")}</label>
                        <Input value={student.name} disabled className="bg-white/5 opacity-70" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">{t("phoneNumber")}</label>
                        <Input value={student.phone} disabled className="bg-white/5 opacity-70" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground block">{t("pickupLocation")}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {LOCATIONS.map((loc) => (
                            <button
                              key={loc.en} type="button"
                              onClick={() => form.setValue("pickupLocation", loc.en, { shouldValidate: true })}
                              className={cn("p-2 text-sm rounded-lg border text-center transition-all", selectedPickup === loc.en ? "border-primary bg-primary/10 text-primary font-medium" : "border-white/10 bg-white/5 hover:border-white/20")}
                            >
                              <span className="block">{isRTL ? loc.ar : loc.en}</span>
                            </button>
                          ))}
                        </div>
                        {form.formState.errors.pickupLocation && <p className="text-destructive text-xs">{form.formState.errors.pickupLocation.message}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">{t("pickupAddress")}</label>
                        <Input
                          placeholder={t("pickupAddressPlaceholder")}
                          {...form.register("pickupAddress")}
                          className="bg-white/5 border-white/10"
                        />
                        {form.formState.errors.pickupAddress && <p className="text-destructive text-xs">{form.formState.errors.pickupAddress.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground block">Drop-off Location / منطقة النزول</label>
                        <div className="grid grid-cols-1 gap-2">
                          {DROPOFFS.map((loc) => (
                            <button
                              key={loc.en} type="button"
                              onClick={() => form.setValue("dropoffLocation", loc.en, { shouldValidate: true })}
                              className={cn("p-2 text-sm rounded-lg border flex justify-between items-center transition-all px-3", form.watch("dropoffLocation") === loc.en ? "border-primary bg-primary/10 text-primary font-medium" : "border-white/10 bg-white/5 hover:border-white/20")}
                            >
                              <span>{loc.en}</span>
                              <span className="text-xs opacity-60">{loc.ar}</span>
                            </button>
                          ))}
                        </div>
                        {form.formState.errors.dropoffLocation && <p className="text-destructive text-xs">{form.formState.errors.dropoffLocation.message}</p>}
                      </div>

                      {selectedPickup && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground block">Number of Seats</label>
                          <div className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-white/5">
                            <button type="button" onClick={() => setSeatCount(c => Math.max(1, c - 1))} className="w-9 h-9 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg font-bold" disabled={seatCount <= 1}>−</button>
                            <div className="flex-1 text-center">
                              <p className="text-2xl font-black">{seatCount}</p>
                              <p className="text-xs text-muted-foreground">{seatCount === 1 ? "seat" : "seats"}</p>
                            </div>
                            <button type="button" onClick={() => setSeatCount(c => Math.min(6, Math.max(1, (selectedTrip?.totalCapacity ?? 6) - (selectedTrip?.totalBooked ?? 0)), c + 1))} className="w-9 h-9 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg font-bold" disabled={seatCount >= Math.min(6, (selectedTrip?.totalCapacity ?? 6) - (selectedTrip?.totalBooked ?? 0))}>+</button>
                          </div>
                          {seatCount > 1 && (
                            <div className="flex justify-between items-center px-1 text-sm">
                              <span className="text-muted-foreground">{seatCount} × {price} EGP</span>
                              <span className="font-bold text-primary text-lg">{seatCount * price} EGP total</span>
                            </div>
                          )}
                        </div>
                      )}

                      <Button type="submit" className="w-full mt-4">Continue to Payment →</Button>
                    </form>
                  </motion.div>
                )}

                {/* ── Step 3: Payment ── */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                    <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">← {t("back")}</button>
                    
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-1">
                      {seatCount > 1 ? (
                        <>
                          <p className="text-xs text-muted-foreground">{seatCount} seats × {price} EGP each · <strong>{selectedPickup}</strong></p>
                          <p className="text-4xl font-black text-primary">{seatCount * price} <span className="text-xl font-semibold">EGP</span></p>
                          <p className="text-xs text-muted-foreground">total amount due</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground mb-1">Amount due for <strong>{selectedPickup}</strong></p>
                          <p className="text-4xl font-black text-primary">{price} <span className="text-xl font-semibold">EGP</span></p>
                        </>
                      )}
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 text-sm">
                      <p className="font-semibold text-foreground">Payment Instructions</p>
                      <p className="text-muted-foreground">Transfer <strong className="text-foreground">{seatCount * price} EGP</strong> via Instapay / Vodafone Cash to:</p>
                      <div className="font-mono bg-white/5 border border-white/10 rounded px-3 py-2 text-primary text-center text-lg font-bold tracking-widest">
                        01XX-XXX-XXXX
                      </div>
                      <p className="text-muted-foreground text-xs">Then take a screenshot of the transaction confirmation and upload it below.</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-2">Payment Screenshot *</label>
                      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                      {screenshotPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 group aspect-video bg-black/20">
                          <img src={screenshotPreview} alt="Preview" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="bg-destructive/90 text-white p-2 rounded-full hover:scale-110 transition-transform">
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-10 border-2 border-dashed border-white/20 rounded-xl hover:border-primary/50 hover:bg-white/5 transition-all flex flex-col items-center gap-2 group">
                          <Upload size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Tap to upload screenshot</span>
                        </button>
                      )}
                    </div>

                    <Button onClick={submitBooking} disabled={!screenshotFile || isSubmitting} className="w-full py-6 text-lg relative overflow-hidden group">
                      {isSubmitting ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <>{t("bookTrip")} <CheckCircle2 className="ml-2" size={18} /></>}
                    </Button>
                  </motion.div>
                )}

                {/* ── Step 4: Success / Live Status ── */}
                {step === 4 && bookingResult && (
                  <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-5">
                    <AnimatePresence mode="wait">
                      {bookingStatus === "Confirmed" ? (
                        <motion.div key="icon-c" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 280 }} className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mx-auto">
                          <CheckCircle2 size={30} className="text-emerald-400" />
                        </motion.div>
                      ) : bookingStatus === "Cancelled" ? (
                        <motion.div key="icon-x" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 280 }} className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center mx-auto">
                          <XCircle size={30} className="text-red-400" />
                        </motion.div>
                      ) : (
                        <motion.div key="icon-p" className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto">
                          <Clock size={28} className="text-amber-400 animate-pulse" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {bookingStatus === "Confirmed" ? (
                        <motion.div key="t-c" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                          <h2 className="text-2xl font-bold text-emerald-400">Booking Confirmed! 🎉</h2>
                          <p className="text-muted-foreground text-sm mt-1">Your payment was verified. Your seat is secured.</p>
                        </motion.div>
                      ) : bookingStatus === "Cancelled" ? (
                        <motion.div key="t-x" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                          <h2 className="text-2xl font-bold text-red-400">Booking Rejected</h2>
                          <p className="text-muted-foreground text-sm mt-1">Payment could not be verified. Your seat has been released.</p>
                        </motion.div>
                      ) : (
                        <motion.div key="t-p">
                          <h2 className="text-2xl font-bold text-amber-400">Under Review</h2>
                          <p className="text-muted-foreground text-sm mt-1">Your seat is reserved and pending payment verification.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-2.5 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono text-primary font-bold">{bookingResult.referenceId}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Seats ({bookingResult.seatCount})</span><span className="font-bold font-mono text-primary">{(bookingResult.seatNumbers as number[]).join(", ")}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Pickup Area</span><span>{bookingResult.pickupLocation}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Exact Address</span><span className="text-xs text-right max-w-[55%]">{bookingResult.pickupAddress}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Drop-off</span><span className="text-xs text-right max-w-[55%]">{bookingResult.dropoffLocation}</span></div>
                      <div className="flex justify-between text-xs text-muted-foreground"><span>{bookingResult.seatCount} × {bookingResult.pricePerSeat} EGP</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-emerald-400">{bookingResult.amount} EGP</span></div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <AnimatePresence mode="wait">
                          {bookingStatus === "Confirmed" ? (
                            <motion.span key="b-c" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={10} /> Confirmed</motion.span>
                          ) : bookingStatus === "Cancelled" ? (
                            <motion.span key="b-x" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><XCircle size={10} /> Cancelled</motion.span>
                          ) : (
                            <motion.span key="b-p" className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20"><Clock size={10} /> Pending Approval</motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <Button variant="outline" onClick={resetFlow} className="w-full mt-4 bg-transparent">Book Another Ride</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold px-2">Booking History</h2>
              {isLoadingBookings ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : myBookings.length === 0 ? (
                <div className="glass-card p-10 text-center text-muted-foreground">
                  <FileText size={32} className="mx-auto mb-3 opacity-50" />
                  <p>You haven't booked any rides yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myBookings.map((b) => (
                    <div key={b._id} className="glass-card p-4 text-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{b.tripId?.route || "Unknown Route"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()} · {b.tripId?.departureTime || "--"}</p>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium border",
                          b.status === "Confirmed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          b.status === "Cancelled" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          "bg-amber-400/10 text-amber-400 border-amber-400/20"
                        )}>
                          {b.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-white/5 rounded-lg p-3 border border-white/5">
                        <div><p className="text-xs text-muted-foreground">Reference</p><p className="font-mono text-primary font-bold">{b.referenceId}</p></div>
                        <div className="col-span-2"><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold">{b.amount} EGP</p></div>
                        <div className="col-span-2"><p className="text-xs text-muted-foreground">Pickup Location</p><p>{b.pickupLocation} - {b.pickupAddress}</p></div>
                        <div><p className="text-xs text-muted-foreground">Seats ({b.seatCount})</p><p className="font-mono">{b.seatNumbers?.join(", ") || b.seatNumber}</p></div>
                        <div><p className="text-xs text-muted-foreground">Vehicle</p><p>{b.vehicleId?.vehicleNumber || "Pending"}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
