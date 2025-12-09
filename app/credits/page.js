// app/credits/page.js
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, Check, Crown, Star } from "lucide-react";
import toast from "react-hot-toast";
import Script from "next/script";

export default function CreditPurchasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [packages, setPackages] = useState([]);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch current credits
      const creditsRes = await fetch("/api/user/credits");
      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        setCurrentCredits(creditsData.available || 0);
      }

      // Fetch credit packages
      const packagesRes = await fetch("/api/checkout/credits");
      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load credit packages");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    if (!razorpayLoaded) {
      toast.error("Payment system is loading. Please try again in a moment.");
      return;
    }

    setPurchasing(true);
    const loadingToast = toast.loading(`Preparing checkout for ${pkg.name}...`);

    try {
      // Create Razorpay order
      const orderRes = await fetch("/api/checkout/credits/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          credits: pkg.credits,
          amount: pkg.price,
        }),
      });

      if (!orderRes.ok) {
        throw new Error("Failed to create order");
      }

      const orderData = await orderRes.json();
      toast.dismiss(loadingToast);

      // Initialize Razorpay
      const options = {
        key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "StudySync Daily",
        description: `${pkg.name} - ${pkg.credits} AI Credits`,
        order_id: orderData.orderId,
        handler: async function (response) {
          const verifyToast = toast.loading("Verifying payment...");
          try {
            const verifyRes = await fetch("/api/checkout/credits/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                credits: pkg.credits,
                amount: pkg.price,
              }),
            });

            const verifyData = await verifyRes.json();
            toast.dismiss(verifyToast);

            if (verifyData.success) {
              toast.success(`🎉 ${pkg.credits} credits added to your account!`);
              fetchData(); // Refresh credits
              
              // Show success modal with confetti effect
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              toast.error("Payment verification failed. Contact support.");
            }
          } catch (verifyError) {
            toast.dismiss(verifyToast);
            console.error("Verification error:", verifyError);
            toast.error("Payment verification error. Please contact support.");
          } finally {
            setPurchasing(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled");
            setPurchasing(false);
          },
        },
        prefill: {
          name: session?.user?.name || "",
          email: session?.user?.email || "",
        },
        theme: {
          color: "#10b981",
        },
        notes: {
          packageId: pkg.id,
          userId: session?.user?.id,
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Purchase error:", error);
      toast.error(error.message || "Failed to start checkout");
      setPurchasing(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>Power Up Your AI Features</span>
            </div>
            
            <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-4">
              Purchase AI Credits
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Unlock powerful AI study tools: Generate notes, create quizzes, and get personalized insights
            </p>

            {/* Current Balance */}
            <div className="mt-8 inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <Zap className="h-6 w-6 text-emerald-600" />
              <div className="text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current Balance
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentCredits} Credits
                </p>
              </div>
            </div>
          </div>

          {/* Credit Packages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, index) => {
              const isPopular = pkg.id === "credits_150";
              const isBestValue = pkg.id === "credits_500";

              return (
                <div
                  key={pkg.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border transition-all duration-300 hover:scale-105 ${
                    isPopular
                      ? "border-emerald-500 ring-4 ring-emerald-400/20"
                      : isBestValue
                      ? "border-purple-500 ring-4 ring-purple-400/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      ⭐ Popular
                    </div>
                  )}

                  {isBestValue && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      👑 Best Value
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl mb-4">
                      <Zap className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {pkg.name}
                    </h3>

                    <div className="mb-4">
                      <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                        {pkg.credits}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Credits
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        ₹{pkg.price}
                      </p>
                      {pkg.savings !== "0%" && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                          Save {pkg.savings}
                        </p>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>AI Notes Generation</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>AI Quiz Creation</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Focus Predictions</span>
                    </li>
                    {isBestValue && (
                      <li className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-semibold">
                        <Crown className="h-4 w-4 flex-shrink-0" />
                        <span>Priority Support</span>
                      </li>
                    )}
                  </ul>

                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasing}
                    className={`w-full py-3 px-6 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isPopular
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl"
                        : isBestValue
                        ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {purchasing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Purchase Now"
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-16 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  How do credits work?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Each AI feature costs a specific number of credits: AI Notes (1 credit), AI Quiz (2 credits). Credits never expire.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Can I upgrade to unlimited?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes! Check our Pro Max and Premium plans for unlimited AI features without worrying about credits.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Are payments secure?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Absolutely! We use Razorpay's industry-leading encryption to ensure your payment information is always protected.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Can I get a refund?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Credits are non-refundable once purchased, but they never expire so you can use them whenever you need.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}