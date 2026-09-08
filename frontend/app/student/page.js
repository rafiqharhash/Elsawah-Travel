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
import { Upload, CheckCircle2, Clock, XCircle, X, LogOut, FileText, Plus, User, BookOpen, Bus, MapPin, Navigation } from "lucide-react";
import { Footer } from "@/components/ui/footer";

// ── Types ─────────────────────────────────────────────────────────────────────
import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";
// ── Validation Schema ─────────────────────────────────────────────────────────
const bookingSchema = z.object({
  studentName: z.string().min(2, "Name required"),
  studentPhone: z.string().min(10, "Valid phone required"),
  pickupLocation: z.string().min(1, "Please select a pickup location"),
  pickupAddress: z.string().min(3, "Please enter an exact pickup address"),
  dropoffLocation: z.string().min(1, "Please select a drop-off location")
});
export default function StudentPortal() {
  const {
    t,
    isRTL
  } = useLang();
  const {
    student,
    logout,
    isLoading
  } = useStudent();
  const [activeTab, setActiveTab] = useState("book");

  // Dynamic locations from API
  const [pickupLocations, setPickupLocations] = useState([]);
  const [dropoffLocations, setDropoffLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Sheet modal
  const [sheetBooking, setSheetBooking] = useState(null);

  // Booking Wizard State
  const [step, setStep] = useState(1);
  const [availableTrips, setAvailableTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [seatCount, setSeatCount] = useState(1);

  // Payment screenshot
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const fileInputRef = useRef(null);

  // My Bookings State
  const [myBookings, setMyBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      studentName: student?.name || "",
      studentPhone: student?.phone || "",
      pickupLocation: "",
      pickupAddress: "",
      dropoffLocation: ""
    }
  });
  const selectedPickup = form.watch("pickupLocation");
  const price = pickupLocations.find(l => l.name === selectedPickup)?.fare ?? 0;

  // Pre-fill profile info when student loads
  useEffect(() => {
    if (student) {
      form.setValue("studentName", student.name);
      form.setValue("studentPhone", student.phone);
    }
  }, [student, form]);

  // Fetch locations from API on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get("/locations");
        const all = res.data.data;
        setPickupLocations(all.filter(l => l.type === "pickup"));
        setDropoffLocations(all.filter(l => l.type === "dropoff"));
      } catch (err) {
        console.error("Failed to fetch locations", err);
      } finally {
        setLocationsLoading(false);
      }
    };
    fetchLocations();
  }, []);

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
  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = ev => setScreenshotPreview(ev.target?.result);
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
    } catch (err) {
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
    subscribeToBooking(bookingResult._id, data => {
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
    return /*#__PURE__*/_jsxDEV("div", {
      className: "min-h-screen flex items-center justify-center bg-background",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
      }, void 0, false)
    }, void 0, false);
  }
  return /*#__PURE__*/_jsxDEV("div", {
    className: "min-h-screen bg-background relative flex flex-col",
    children: [/*#__PURE__*/_jsxDEV("div", {
      className: "absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 pointer-events-none"
    }, void 0, false), /*#__PURE__*/_jsxDEV("header", {
      className: "sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border shadow-sm",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "max-w-4xl mx-auto px-4 h-16 flex items-center justify-between",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center gap-3",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold",
            children: student.name.charAt(0)
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("p", {
              className: "text-sm font-semibold",
              children: student.name
            }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
              className: "text-xs text-muted-foreground",
              children: student.studentNumber
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center gap-3",
          children: [/*#__PURE__*/_jsxDEV(LanguageToggle, {}, void 0, false), /*#__PURE__*/_jsxDEV(ThemeToggle, {}, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: logout,
            className: "w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors",
            children: /*#__PURE__*/_jsxDEV(LogOut, {
              size: 16
            }, void 0, false)
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), /*#__PURE__*/_jsxDEV("main", {
      className: "flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col pt-8",
      children: [/*#__PURE__*/_jsxDEV("div", {
        className: "flex bg-white/5 border border-border p-1 rounded-xl mb-8 max-w-xs mx-auto w-full relative z-10",
        children: [/*#__PURE__*/_jsxDEV("button", {
          onClick: () => {
            setActiveTab("book");
            resetFlow();
          },
          className: cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2", activeTab === "book" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"),
          children: [/*#__PURE__*/_jsxDEV(Plus, {
            size: 16
          }, void 0, false), " ", t("bookTrip")]
        }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
          onClick: () => setActiveTab("history"),
          className: cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2", activeTab === "history" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"),
          children: [/*#__PURE__*/_jsxDEV(FileText, {
            size: 16
          }, void 0, false), " ", t("bookingHistory")]
        }, void 0, true)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
        className: "relative z-10 flex-1 flex flex-col pb-24 max-w-md mx-auto w-full",
        children: [activeTab === "book" && /*#__PURE__*/_jsxDEV("div", {
          className: "glass-card p-6 w-full relative overflow-hidden",
          children: /*#__PURE__*/_jsxDEV(AnimatePresence, {
            mode: "wait",
            children: [step === 1 && /*#__PURE__*/_jsxDEV(motion.div, {
              initial: {
                opacity: 0,
                x: -20
              },
              animate: {
                opacity: 1,
                x: 0
              },
              exit: {
                opacity: 0,
                x: 20
              },
              className: "space-y-4",
              children: [/*#__PURE__*/_jsxDEV("div", {
                children: [/*#__PURE__*/_jsxDEV("h2", {
                  className: "text-lg font-bold",
                  children: t("step1Title")
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-sm text-muted-foreground",
                  children: t("availableRoutes")
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "space-y-1",
                children: [/*#__PURE__*/_jsxDEV("label", {
                  className: "text-xs font-medium text-muted-foreground block",
                  children: t("pickupLocation")
                }, void 0, false), locationsLoading ? /*#__PURE__*/_jsxDEV("div", {
                  className: "h-10 rounded-lg bg-white/5 border border-white/10 animate-pulse"
                }, void 0, false) : /*#__PURE__*/_jsxDEV("select", {
                  value: selectedPickup,
                  onChange: e => form.setValue("pickupLocation", e.target.value),
                  className: "sys-select",
                  children: [/*#__PURE__*/_jsxDEV("option", {
                    value: "",
                    children: t("selectAreaTimes")
                  }, void 0, false), pickupLocations.map(l => /*#__PURE__*/_jsxDEV("option", {
                    value: l.name,
                    children: l.name
                  }, l._id, false))]
                }, void 0, true)]
              }, void 0, true), loadError ? /*#__PURE__*/_jsxDEV("p", {
                className: "text-destructive text-sm text-center py-4",
                children: t("failedToLoadTrips")
              }, void 0, false) : availableTrips.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
                className: "text-center py-10 bg-white/5 rounded-xl border border-white/10",
                children: /*#__PURE__*/_jsxDEV("p", {
                  className: "text-muted-foreground text-sm",
                  children: t("noTripsAvail")
                }, void 0, false)
              }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
                className: "space-y-3",
                children: availableTrips.map(trip => {
                  const isFull = trip.totalBooked >= trip.totalCapacity;
                  const customTime = trip.locationTimes?.find(lt => lt.location === selectedPickup)?.time;
                  const displayTime = customTime || trip.departureTime;
                  return /*#__PURE__*/_jsxDEV("button", {
                    disabled: isFull,
                    onClick: () => {
                      setSelectedTrip(trip);
                      setStep(2);
                    },
                    className: cn("w-full text-left p-4 rounded-xl border transition-all", isFull ? "opacity-50 grayscale cursor-not-allowed border-white/5 bg-white/5" : "hover:border-primary/50 hover:bg-white/5 bg-white/5 border-white/10"),
                    children: [/*#__PURE__*/_jsxDEV("div", {
                      className: "flex justify-between items-center mb-2",
                      children: [/*#__PURE__*/_jsxDEV("span", {
                        className: "font-semibold",
                        children: trip.route
                      }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                        className: "text-primary font-mono bg-primary/10 px-2 py-1 rounded text-sm",
                        children: displayTime
                      }, void 0, false)]
                    }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                      className: "flex justify-between items-center text-sm text-muted-foreground",
                      children: [/*#__PURE__*/_jsxDEV("span", {
                        children: isFull ? t("full") : `${trip.totalCapacity - trip.totalBooked} ${t("seatsLeft")}`
                      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                        className: "w-24 h-2 bg-white/10 rounded-full overflow-hidden",
                        children: /*#__PURE__*/_jsxDEV("div", {
                          className: cn("h-full", trip.occupancyPercentage > 90 ? "bg-destructive" : "bg-primary"),
                          style: {
                            width: `${trip.occupancyPercentage}%`
                          }
                        }, void 0, false)
                      }, void 0, false)]
                    }, void 0, true)]
                  }, trip._id, true);
                })
              }, void 0, false)]
            }, "s1", true), step === 2 && /*#__PURE__*/_jsxDEV(motion.div, {
              initial: {
                opacity: 0,
                x: -20
              },
              animate: {
                opacity: 1,
                x: 0
              },
              exit: {
                opacity: 0,
                x: 20
              },
              className: "space-y-5",
              children: [/*#__PURE__*/_jsxDEV("button", {
                onClick: () => setStep(1),
                className: "flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground",
                children: ["← ", t("back")]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                children: [/*#__PURE__*/_jsxDEV("h2", {
                  className: "text-lg font-bold",
                  children: t("step2Title")
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-sm text-muted-foreground",
                  children: t("confirmPickupDropoff")
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("form", {
                onSubmit: form.handleSubmit(() => setStep(3)),
                className: "space-y-4",
                children: [selectedTrip && /*#__PURE__*/_jsxDEV("div", {
                  className: "rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between text-sm",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    className: "font-medium text-foreground",
                    children: selectedTrip.route
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    className: "font-mono text-primary font-bold",
                    children: selectedPickup ? selectedTrip.locationTimes?.find(lt => lt.location === selectedPickup)?.time || selectedTrip.departureTime : selectedTrip.departureTime
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "space-y-1",
                  children: [/*#__PURE__*/_jsxDEV("label", {
                    className: "text-xs font-medium text-muted-foreground",
                    children: t("studentName")
                  }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
                    value: student.name,
                    disabled: true,
                    className: "bg-white/5 opacity-70"
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "space-y-1",
                  children: [/*#__PURE__*/_jsxDEV("label", {
                    className: "text-xs font-medium text-muted-foreground",
                    children: t("phoneNumber")
                  }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
                    value: student.phone,
                    disabled: true,
                    className: "bg-white/5 opacity-70"
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "space-y-2",
                  children: [/*#__PURE__*/_jsxDEV("label", {
                    className: "text-xs font-medium text-muted-foreground block",
                    children: t("pickupLocation")
                  }, void 0, false), locationsLoading ? /*#__PURE__*/_jsxDEV("div", {
                    className: "grid grid-cols-1 sm:grid-cols-2 gap-2",
                    children: [1, 2, 3, 4].map(i => /*#__PURE__*/_jsxDEV("div", {
                      className: "h-12 rounded-lg bg-white/5 border border-white/10 animate-pulse"
                    }, i, false))
                  }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
                    className: "grid grid-cols-1 sm:grid-cols-2 gap-2",
                    children: pickupLocations.map(loc => /*#__PURE__*/_jsxDEV("button", {
                      type: "button",
                      onClick: () => form.setValue("pickupLocation", loc.name, {
                        shouldValidate: true
                      }),
                      className: cn("p-2 text-sm rounded-lg border text-center transition-all", selectedPickup === loc.name ? "border-primary bg-primary/10 text-primary font-medium" : "border-white/10 bg-white/5 hover:border-white/20"),
                      children: [/*#__PURE__*/_jsxDEV("span", {
                        className: "block",
                        children: isRTL && loc.arabicName ? loc.arabicName : loc.name
                      }, void 0, false), loc.fare > 0 && /*#__PURE__*/_jsxDEV("span", {
                        className: "block text-xs mt-0.5 font-mono text-muted-foreground",
                        children: [loc.fare, " EGP"]
                      }, void 0, true)]
                    }, loc._id, true))
                  }, void 0, false), form.formState.errors.pickupLocation && /*#__PURE__*/_jsxDEV("p", {
                    className: "text-destructive text-xs",
                    children: form.formState.errors.pickupLocation.message
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "space-y-1",
                  children: [/*#__PURE__*/_jsxDEV("label", {
                    className: "text-xs font-medium text-muted-foreground",
                    children: t("pickupAddress")
                  }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
                    placeholder: t("pickupAddressPlaceholder"),
                    ...form.register("pickupAddress"),
                    className: "bg-white/5 border-white/10"
                  }, void 0, false), form.formState.errors.pickupAddress && /*#__PURE__*/_jsxDEV("p", {
                    className: "text-destructive text-xs",
                    children: form.formState.errors.pickupAddress.message
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "space-y-2",
                  children: [/*#__PURE__*/_jsxDEV("label", {
                    className: "text-xs font-medium text-muted-foreground block",
                    children: t("dropoffLocation")
                  }, void 0, false), locationsLoading ? /*#__PURE__*/_jsxDEV("div", {
                    className: "space-y-2",
                    children: [1, 2].map(i => /*#__PURE__*/_jsxDEV("div", {
                      className: "h-11 rounded-lg bg-white/5 border border-white/10 animate-pulse"
                    }, i, false))
                  }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
                    className: "grid grid-cols-1 gap-2",
                    children: dropoffLocations.map(loc => /*#__PURE__*/_jsxDEV("button", {
                      type: "button",
                      onClick: () => form.setValue("dropoffLocation", loc.name, {
                        shouldValidate: true
                      }),
                      className: cn("p-2 text-sm rounded-lg border flex justify-between items-center transition-all px-3", form.watch("dropoffLocation") === loc.name ? "border-primary bg-primary/10 text-primary font-medium" : "border-white/10 bg-white/5 hover:border-white/20"),
                      children: [/*#__PURE__*/_jsxDEV("span", {
                        children: loc.name
                      }, void 0, false), loc.arabicName && /*#__PURE__*/_jsxDEV("span", {
                        className: "text-xs opacity-60",
                        children: loc.arabicName
                      }, void 0, false)]
                    }, loc._id, true))
                  }, void 0, false), form.formState.errors.dropoffLocation && /*#__PURE__*/_jsxDEV("p", {
                    className: "text-destructive text-xs",
                    children: form.formState.errors.dropoffLocation.message
                  }, void 0, false)]
                }, void 0, true), selectedPickup && /*#__PURE__*/_jsxDEV("div", {
                  className: "space-y-2",
                  children: [/*#__PURE__*/_jsxDEV("label", {
                    className: "text-xs font-medium text-muted-foreground block",
                    children: t("numSeats")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                    className: "flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-white/5",
                    children: [/*#__PURE__*/_jsxDEV("button", {
                      type: "button",
                      onClick: () => setSeatCount(c => Math.max(1, c - 1)),
                      className: "w-9 h-9 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg font-bold",
                      disabled: seatCount <= 1,
                      children: "−"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                      className: "flex-1 text-center",
                      children: [/*#__PURE__*/_jsxDEV("p", {
                        className: "text-2xl font-black",
                        children: seatCount
                      }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                        className: "text-xs text-muted-foreground",
                        children: seatCount === 1 ? t("seat") : t("seats")
                      }, void 0, false)]
                    }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
                      type: "button",
                      onClick: () => setSeatCount(c => Math.min(6, Math.max(1, (selectedTrip?.totalCapacity ?? 6) - (selectedTrip?.totalBooked ?? 0)), c + 1)),
                      className: "w-9 h-9 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg font-bold",
                      disabled: seatCount >= Math.min(6, (selectedTrip?.totalCapacity ?? 6) - (selectedTrip?.totalBooked ?? 0)),
                      children: "+"
                    }, void 0, false)]
                  }, void 0, true), seatCount > 1 && /*#__PURE__*/_jsxDEV("div", {
                    className: "flex justify-between items-center px-1 text-sm",
                    children: [/*#__PURE__*/_jsxDEV("span", {
                      className: "text-muted-foreground",
                      children: [seatCount, " × ", price, " EGP"]
                    }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
                      className: "font-bold text-primary text-lg",
                      children: [seatCount * price, " ", t("egpTotal")]
                    }, void 0, true)]
                  }, void 0, true)]
                }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
                  type: "submit",
                  className: "w-full mt-4",
                  children: t("continueToPayment")
                }, void 0, false)]
              }, void 0, true)]
            }, "s2", true), step === 3 && /*#__PURE__*/_jsxDEV(motion.div, {
              initial: {
                opacity: 0,
                x: -20
              },
              animate: {
                opacity: 1,
                x: 0
              },
              exit: {
                opacity: 0,
                x: 20
              },
              className: "space-y-5",
              children: [/*#__PURE__*/_jsxDEV("button", {
                onClick: () => setStep(2),
                className: "flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground",
                children: ["← ", t("back")]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-1",
                children: seatCount > 1 ? /*#__PURE__*/_jsxDEV(_Fragment, {
                  children: [/*#__PURE__*/_jsxDEV("p", {
                    className: "text-xs text-muted-foreground",
                    children: [seatCount, " ", t("seats"), " × ", price, " ", t("egpEach"), " · ", /*#__PURE__*/_jsxDEV("strong", {
                      children: selectedPickup
                    }, void 0, false)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-4xl font-black text-primary",
                    children: [seatCount * price, " ", /*#__PURE__*/_jsxDEV("span", {
                      className: "text-xl font-semibold",
                      children: "EGP"
                    }, void 0, false)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-xs text-muted-foreground",
                    children: t("totalAmountDue")
                  }, void 0, false)]
                }, void 0, true) : /*#__PURE__*/_jsxDEV(_Fragment, {
                  children: [/*#__PURE__*/_jsxDEV("p", {
                    className: "text-sm text-muted-foreground mb-1",
                    children: [t("amountDueFor"), " ", /*#__PURE__*/_jsxDEV("strong", {
                      children: selectedPickup
                    }, void 0, false)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-4xl font-black text-primary",
                    children: [price, " ", /*#__PURE__*/_jsxDEV("span", {
                      className: "text-xl font-semibold",
                      children: "EGP"
                    }, void 0, false)]
                  }, void 0, true)]
                }, void 0, true)
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                className: "rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 text-sm",
                children: [/*#__PURE__*/_jsxDEV("p", {
                  className: "font-semibold text-foreground",
                  children: t("paymentInstructions")
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-muted-foreground",
                  children: [t("transfer"), " ", /*#__PURE__*/_jsxDEV("strong", {
                    className: "text-foreground",
                    children: [seatCount * price, " EGP"]
                  }, void 0, true), " ", t("viaInstapay")]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "font-mono bg-white/5 border border-white/10 rounded px-3 py-2 text-primary text-center text-lg font-bold tracking-widest",
                  children: "01XX-XXX-XXXX"
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-muted-foreground text-xs",
                  children: t("takeScreenshot")
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                children: [/*#__PURE__*/_jsxDEV("label", {
                  className: "text-xs font-medium text-muted-foreground block mb-2",
                  children: t("paymentScreenshot")
                }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
                  ref: fileInputRef,
                  type: "file",
                  accept: "image/*,.pdf",
                  className: "hidden",
                  onChange: handleFileChange
                }, void 0, false), screenshotPreview ? /*#__PURE__*/_jsxDEV("div", {
                  className: "relative rounded-xl overflow-hidden border border-white/10 group aspect-video bg-black/20",
                  children: [/*#__PURE__*/_jsxDEV("img", {
                    src: screenshotPreview,
                    alt: "Preview",
                    className: "w-full h-full object-contain"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                    className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
                    children: /*#__PURE__*/_jsxDEV("button", {
                      onClick: () => {
                        setScreenshotFile(null);
                        setScreenshotPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      },
                      className: "bg-destructive/90 text-white p-2 rounded-full hover:scale-110 transition-transform",
                      children: /*#__PURE__*/_jsxDEV(X, {
                        size: 20
                      }, void 0, false)
                    }, void 0, false)
                  }, void 0, false)]
                }, void 0, true) : /*#__PURE__*/_jsxDEV("button", {
                  onClick: () => fileInputRef.current?.click(),
                  className: "w-full py-10 border-2 border-dashed border-white/20 rounded-xl hover:border-primary/50 hover:bg-white/5 transition-all flex flex-col items-center gap-2 group",
                  children: [/*#__PURE__*/_jsxDEV(Upload, {
                    size: 24,
                    className: "text-muted-foreground group-hover:text-primary transition-colors"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    className: "text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors",
                    children: t("tapToUpload")
                  }, void 0, false)]
                }, void 0, true)]
              }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
                onClick: submitBooking,
                disabled: !screenshotFile || isSubmitting,
                className: "w-full py-6 text-lg relative overflow-hidden group",
                children: isSubmitting ? /*#__PURE__*/_jsxDEV("span", {
                  className: "w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
                }, void 0, false) : /*#__PURE__*/_jsxDEV(_Fragment, {
                  children: [t("bookTrip"), " ", /*#__PURE__*/_jsxDEV(CheckCircle2, {
                    className: "ml-2",
                    size: 18
                  }, void 0, false)]
                }, void 0, true)
              }, void 0, false)]
            }, "s3", true), step === 4 && bookingResult && /*#__PURE__*/_jsxDEV(motion.div, {
              initial: {
                opacity: 0,
                scale: 0.95
              },
              animate: {
                opacity: 1,
                scale: 1
              },
              className: "text-center py-6 space-y-5",
              children: [/*#__PURE__*/_jsxDEV(AnimatePresence, {
                mode: "wait",
                children: bookingStatus === "Confirmed" ? /*#__PURE__*/_jsxDEV(motion.div, {
                  initial: {
                    scale: 0.5,
                    opacity: 0
                  },
                  animate: {
                    scale: 1,
                    opacity: 1
                  },
                  transition: {
                    type: "spring",
                    stiffness: 280
                  },
                  className: "w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mx-auto",
                  children: /*#__PURE__*/_jsxDEV(CheckCircle2, {
                    size: 30,
                    className: "text-emerald-400"
                  }, void 0, false)
                }, "icon-c", false) : bookingStatus === "Cancelled" ? /*#__PURE__*/_jsxDEV(motion.div, {
                  initial: {
                    scale: 0.5,
                    opacity: 0
                  },
                  animate: {
                    scale: 1,
                    opacity: 1
                  },
                  transition: {
                    type: "spring",
                    stiffness: 280
                  },
                  className: "w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center mx-auto",
                  children: /*#__PURE__*/_jsxDEV(XCircle, {
                    size: 30,
                    className: "text-red-400"
                  }, void 0, false)
                }, "icon-x", false) : /*#__PURE__*/_jsxDEV(motion.div, {
                  className: "w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto",
                  children: /*#__PURE__*/_jsxDEV(Clock, {
                    size: 28,
                    className: "text-amber-400 animate-pulse"
                  }, void 0, false)
                }, "icon-p", false)
              }, void 0, false), /*#__PURE__*/_jsxDEV(AnimatePresence, {
                mode: "wait",
                children: bookingStatus === "Confirmed" ? /*#__PURE__*/_jsxDEV(motion.div, {
                  initial: {
                    opacity: 0,
                    y: 8
                  },
                  animate: {
                    opacity: 1,
                    y: 0
                  },
                  children: [/*#__PURE__*/_jsxDEV("h2", {
                    className: "text-2xl font-bold text-emerald-400",
                    children: t("bookingConfirmedTitle")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-muted-foreground text-sm mt-1",
                    children: t("paymentVerifiedMsg")
                  }, void 0, false)]
                }, "t-c", true) : bookingStatus === "Cancelled" ? /*#__PURE__*/_jsxDEV(motion.div, {
                  initial: {
                    opacity: 0,
                    y: 8
                  },
                  animate: {
                    opacity: 1,
                    y: 0
                  },
                  children: [/*#__PURE__*/_jsxDEV("h2", {
                    className: "text-2xl font-bold text-red-400",
                    children: t("bookingRejectedTitle")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-muted-foreground text-sm mt-1",
                    children: t("paymentFailedMsg")
                  }, void 0, false)]
                }, "t-x", true) : /*#__PURE__*/_jsxDEV(motion.div, {
                  children: [/*#__PURE__*/_jsxDEV("h2", {
                    className: "text-2xl font-bold text-amber-400",
                    children: t("underReviewTitle")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-muted-foreground text-sm mt-1",
                    children: t("underReviewMsg")
                  }, void 0, false)]
                }, "t-p", true)
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                className: "bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-2.5 text-sm",
                children: [/*#__PURE__*/_jsxDEV("div", {
                  className: "flex justify-between",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    className: "text-muted-foreground",
                    children: t("reference")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    className: "font-mono text-primary font-bold",
                    children: bookingResult.referenceId
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "flex justify-between",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    className: "text-muted-foreground",
                    children: [t("seats"), " (", bookingResult.seatCount, ")"]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
                    className: "font-bold font-mono text-primary",
                    children: bookingResult.seatNumbers.join(", ")
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "flex justify-between",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    className: "text-muted-foreground",
                    children: t("pickupArea")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    children: bookingResult.pickupLocation
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "flex justify-between",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    className: "text-muted-foreground",
                    children: t("exactAddress")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    className: "text-xs text-right max-w-[55%]",
                    children: bookingResult.pickupAddress
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "flex justify-between",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    className: "text-muted-foreground",
                    children: t("dropoffLocation")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    className: "text-xs text-right max-w-[55%]",
                    children: bookingResult.dropoffLocation
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "flex justify-between text-xs text-muted-foreground",
                  children: /*#__PURE__*/_jsxDEV("span", {
                    children: [bookingResult.seatCount, " × ", bookingResult.pricePerSeat, " EGP"]
                  }, void 0, true)
                }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                  className: "flex justify-between",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    className: "text-muted-foreground",
                    children: t("total")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    className: "font-bold text-emerald-400",
                    children: [bookingResult.amount, " EGP"]
                  }, void 0, true)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "flex justify-between items-center",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    className: "text-muted-foreground",
                    children: t("status")
                  }, void 0, false), /*#__PURE__*/_jsxDEV(AnimatePresence, {
                    mode: "wait",
                    children: bookingStatus === "Confirmed" ? /*#__PURE__*/_jsxDEV(motion.span, {
                      initial: {
                        opacity: 0,
                        scale: 0.8
                      },
                      animate: {
                        opacity: 1,
                        scale: 1
                      },
                      className: "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                      children: [/*#__PURE__*/_jsxDEV(CheckCircle2, {
                        size: 10
                      }, void 0, false), " ", t("completedStatus")]
                    }, "b-c", true) : bookingStatus === "Cancelled" ? /*#__PURE__*/_jsxDEV(motion.span, {
                      initial: {
                        opacity: 0,
                        scale: 0.8
                      },
                      animate: {
                        opacity: 1,
                        scale: 1
                      },
                      className: "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20",
                      children: [/*#__PURE__*/_jsxDEV(XCircle, {
                        size: 10
                      }, void 0, false), " ", t("cancelledStatus")]
                    }, "b-x", true) : /*#__PURE__*/_jsxDEV(motion.span, {
                      className: "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20",
                      children: [/*#__PURE__*/_jsxDEV(Clock, {
                        size: 10
                      }, void 0, false), " ", t("pendingApproval")]
                    }, "b-p", true)
                  }, void 0, false)]
                }, void 0, true)]
              }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
                variant: "outline",
                onClick: resetFlow,
                className: "w-full mt-4 bg-transparent",
                children: t("bookAnotherRide")
              }, void 0, false)]
            }, "s4", true)]
          }, void 0, true)
        }, void 0, false), activeTab === "history" && /*#__PURE__*/_jsxDEV("div", {
          className: "space-y-4",
          children: [/*#__PURE__*/_jsxDEV("h2", {
            className: "text-lg font-bold px-2",
            children: t("bookingHistory")
          }, void 0, false), isLoadingBookings ? /*#__PURE__*/_jsxDEV("div", {
            className: "flex justify-center py-10",
            children: /*#__PURE__*/_jsxDEV("div", {
              className: "w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"
            }, void 0, false)
          }, void 0, false) : myBookings.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
            className: "glass-card p-10 text-center text-muted-foreground",
            children: [/*#__PURE__*/_jsxDEV(FileText, {
              size: 32,
              className: "mx-auto mb-3 opacity-50"
            }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
              children: t("noRidesYet")
            }, void 0, false)]
          }, void 0, true) : /*#__PURE__*/_jsxDEV("div", {
            className: "space-y-3",
            children: myBookings.map(b => /*#__PURE__*/_jsxDEV("div", {
              className: "glass-card p-4 text-sm flex flex-col gap-3",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "flex justify-between items-start",
                children: [/*#__PURE__*/_jsxDEV("div", {
                  children: [/*#__PURE__*/_jsxDEV("p", {
                    className: "font-bold",
                    children: b.tripId?.route || t("unknownRoute")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-xs text-muted-foreground",
                    children: [new Date(b.createdAt).toLocaleDateString(), " · ", b.tripId?.departureTime || "--"]
                  }, void 0, true)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "flex flex-col items-end gap-1.5",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    className: cn("px-2 py-1 rounded text-xs font-medium border", b.status === "Confirmed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : b.status === "Cancelled" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-400/10 text-amber-400 border-amber-400/20"),
                    children: b.status === "Confirmed" ? t("completedStatus") : b.status === "Cancelled" ? t("cancelledStatus") : t("pendingApproval")
                  }, void 0, false), b.status === "Confirmed" && b.tripId?.isPublished && /*#__PURE__*/_jsxDEV("button", {
                    onClick: () => setSheetBooking(b),
                    className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all",
                    children: [/*#__PURE__*/_jsxDEV(BookOpen, {
                      size: 11
                    }, void 0, false), " ", t("seeSheet")]
                  }, void 0, true)]
                }, void 0, true)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/5 rounded-lg p-3 border border-white/5",
                children: [/*#__PURE__*/_jsxDEV("div", {
                  children: [/*#__PURE__*/_jsxDEV("p", {
                    className: "text-xs text-muted-foreground",
                    children: t("reference")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "font-mono text-primary font-bold",
                    children: b.referenceId
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "sm:col-span-2",
                  children: [/*#__PURE__*/_jsxDEV("p", {
                    className: "text-xs text-muted-foreground",
                    children: t("total")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "font-semibold",
                    children: [b.amount, " EGP"]
                  }, void 0, true)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "sm:col-span-2",
                  children: [/*#__PURE__*/_jsxDEV("p", {
                    className: "text-xs text-muted-foreground",
                    children: t("pickupLocation")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    children: [b.pickupLocation, " - ", b.pickupAddress]
                  }, void 0, true)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  children: [/*#__PURE__*/_jsxDEV("p", {
                    className: "text-xs text-muted-foreground",
                    children: [t("seats"), " (", b.seatCount, ")"]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
                    className: "font-mono",
                    children: b.seatNumbers?.join(", ") || b.seatNumber
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  children: [/*#__PURE__*/_jsxDEV("p", {
                    className: "text-xs text-muted-foreground",
                    children: t("vehicleAssignment")
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    children: b.vehicleId?.vehicleNumber || t("pendingApproval")
                  }, void 0, false)]
                }, void 0, true)]
              }, void 0, true)]
            }, b._id, true))
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Footer, {}, void 0, false), /*#__PURE__*/_jsxDEV(AnimatePresence, {
      children: sheetBooking && /*#__PURE__*/_jsxDEV(motion.div, {
        initial: {
          opacity: 0
        },
        animate: {
          opacity: 1
        },
        exit: {
          opacity: 0
        },
        className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4",
        onClick: () => setSheetBooking(null),
        children: /*#__PURE__*/_jsxDEV(motion.div, {
          initial: {
            opacity: 0,
            y: 60,
            scale: 0.96
          },
          animate: {
            opacity: 1,
            y: 0,
            scale: 1
          },
          exit: {
            opacity: 0,
            y: 60,
            scale: 0.96
          },
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 28
          },
          className: "w-full max-w-sm bg-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]",
          onClick: e => e.stopPropagation(),
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "bg-gradient-to-r from-primary/20 to-emerald-500/10 border-b border-white/10 px-5 py-4 flex items-center justify-between",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "flex items-center gap-3",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center",
                children: /*#__PURE__*/_jsxDEV(BookOpen, {
                  size: 16,
                  className: "text-primary"
                }, void 0, false)
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                children: [/*#__PURE__*/_jsxDEV("p", {
                  className: "font-bold text-sm",
                  children: sheetBooking.tripId?.route
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-xs text-muted-foreground",
                  children: [sheetBooking.tripId?.date ? new Date(sheetBooking.tripId.date).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short"
                  }) : "", " · ", sheetBooking.tripId?.departureTime]
                }, void 0, true)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
              onClick: () => setSheetBooking(null),
              className: "text-muted-foreground hover:text-foreground p-1 rounded hover:bg-white/10 transition-colors",
              children: /*#__PURE__*/_jsxDEV(X, {
                size: 18
              }, void 0, false)
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "p-5 space-y-4 overflow-y-auto",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "rounded-xl border border-primary/30 bg-primary/5 p-4 text-center",
              children: [/*#__PURE__*/_jsxDEV("p", {
                className: "text-xs text-muted-foreground mb-1",
                children: (sheetBooking.seatNumbers?.length || 0) > 1 ? t("yourAssignedSeats") : t("yourAssignedSeat")
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                className: "flex gap-2 justify-center flex-wrap",
                children: (sheetBooking.seatNumbers || [sheetBooking.seatNumber]).map(sn => /*#__PURE__*/_jsxDEV("span", {
                  className: "w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center shadow-lg",
                  children: sn
                }, sn, false))
              }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                className: "text-xs text-muted-foreground mt-2 font-mono",
                children: sheetBooking.referenceId
              }, void 0, false)]
            }, void 0, true), sheetBooking.vehicleId && /*#__PURE__*/_jsxDEV("div", {
              className: "rounded-xl border border-white/10 bg-white/5 p-4 space-y-2",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1",
                children: [/*#__PURE__*/_jsxDEV(Bus, {
                  size: 13
                }, void 0, false), " ", t("vehicleAssignment")]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "flex justify-between items-center",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-muted-foreground text-sm",
                  children: t("busNumber")
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "font-mono font-black text-primary text-lg",
                  children: sheetBooking.vehicleId.vehicleNumber
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "flex justify-between items-center",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-muted-foreground text-sm",
                  children: t("driver")
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "font-semibold",
                  children: sheetBooking.vehicleId.driverName
                }, void 0, false)]
              }, void 0, true), sheetBooking.vehicleId.driverPhone && /*#__PURE__*/_jsxDEV("div", {
                className: "flex justify-between items-center",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-muted-foreground text-sm",
                  children: t("driverPhone")
                }, void 0, false), /*#__PURE__*/_jsxDEV("a", {
                  href: `tel:${sheetBooking.vehicleId.driverPhone}`,
                  className: "font-mono text-primary hover:underline",
                  children: sheetBooking.vehicleId.driverPhone
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "rounded-xl border border-white/10 bg-white/5 p-4 space-y-2",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1",
                children: [/*#__PURE__*/_jsxDEV(Navigation, {
                  size: 13
                }, void 0, false), " ", t("journeyDetails")]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "flex justify-between items-start",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-muted-foreground text-sm",
                  children: t("pickupArea")
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "font-semibold text-right max-w-[55%]",
                  children: sheetBooking.pickupLocation
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "flex justify-between items-start",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-muted-foreground text-sm",
                  children: t("exactAddress")
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-xs text-right max-w-[55%]",
                  children: sheetBooking.pickupAddress
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "flex justify-between items-start",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-muted-foreground text-sm",
                  children: t("dropoffLocation")
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-xs text-right max-w-[55%]",
                  children: sheetBooking.dropoffLocation
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "flex justify-between items-center px-1",
              children: [/*#__PURE__*/_jsxDEV("span", {
                className: "text-muted-foreground text-sm",
                children: [sheetBooking.seatCount, " ", sheetBooking.seatCount > 1 ? t("seats") : t("seat"), " × ", sheetBooking.pricePerSeat, " EGP"]
              }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
                className: "font-bold text-emerald-400 text-lg",
                children: [sheetBooking.amount, " EGP"]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
              onClick: () => setSheetBooking(null),
              className: "w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors",
              children: t("close")
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true)
      }, "sheet-backdrop", false)
    }, void 0, false)]
  }, void 0, true);
}