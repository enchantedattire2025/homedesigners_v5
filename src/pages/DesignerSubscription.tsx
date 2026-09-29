import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Check,
  Clock,
  AlertCircle,
  Zap,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_period: string;
  features: string[];
  max_projects: number;
  max_quotes: number;
  priority_support: boolean;
  sort_order: number;
}

interface DesignerSubscription {
  id: string;
  status: string;
  trial_start_date: string;
  trial_end_date: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  auto_renew: boolean;
  subscription_plan: SubscriptionPlan;
}

interface UsageStats {
  projects_created: number;
  quotes_generated: number;
  max_projects: number;
  max_quotes: number;
}

const DesignerSubscription: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] =
    useState<DesignerSubscription | null>(null);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // ----------------------------------------
      // GET DESIGNER
      // ----------------------------------------
      const { data: designerData, error: designerError } =
        await supabase
          .from('designers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

      if (designerError) {
        throw designerError;
      }

      if (!designerData) {
        navigate('/designer-registration');
        return;
      }

      // ----------------------------------------
      // GET CURRENT SUBSCRIPTION
      // ----------------------------------------
      const { data: subData, error: subError } =
        await supabase
          .from('designer_subscriptions')
          .select(`
            *,
            subscription_plan:subscription_plans(*)
          `)
          .eq('designer_id', designerData.id)
          .maybeSingle();

      if (subError) {
        throw subError;
      }

      if (subData) {
        setSubscription({
          ...subData,
          subscription_plan:
            subData.subscription_plan as SubscriptionPlan
        });
      }

      // ----------------------------------------
      // GET ONLY PROFESSIONAL PLAN
      // ----------------------------------------
      const { data: plansData, error: plansError } =
        await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .eq('name', 'Professional')
          .order('sort_order');

      if (plansError) {
        throw plansError;
      }

      if (plansData) {
        const professionalPlans: SubscriptionPlan[] =
          plansData.map((plan) => ({
            ...plan,

            // Professional plan configuration
            name: 'Professional',
            price: 1,
            billing_period: 'quarterly',

            // 60 quotes per quarter
            max_quotes: 60,

            features: [
              'Up to 15 concurrent projects',
              '60 quotes per quarter',
              'Premium portfolio showcase',
              'Priority email support',
              'Analytics dashboard'
            ]
          }));

        setPlans(professionalPlans);
      }

      // ----------------------------------------
      // QUARTER USAGE
      // ----------------------------------------
      const currentDate = new Date();

      const currentMonth = currentDate.getMonth();

      const quarterStartMonth =
        Math.floor(currentMonth / 3) * 3;

      const quarterStart = new Date(
        currentDate.getFullYear(),
        quarterStartMonth,
        1
      );

      const { data: usageData, error: usageError } =
        await supabase
          .from('subscription_usage_tracking')
          .select('*')
          .eq(
            'designer_subscription_id',
            subData?.id
          )
          .gte(
            'period_start',
            quarterStart.toISOString()
          )
          .maybeSingle();

      if (usageError) {
        console.error(
          'Error loading subscription usage:',
          usageError
        );
      }

      if (usageData && subData?.subscription_plan) {
        setUsage({
          projects_created:
            usageData.projects_created || 0,

          quotes_generated:
            usageData.quotes_generated || 0,

          max_projects:
            subData.subscription_plan.max_projects || 15,

          // Strictly 60 quotes per quarter
          max_quotes: 60
        });
      } else if (subData?.subscription_plan) {
        setUsage({
          projects_created: 0,
          quotes_generated: 0,
          max_projects:
            subData.subscription_plan.max_projects || 15,
          max_quotes: 60
        });
      }
    } catch (error) {
      console.error(
        'Error loading subscription:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // TRIAL DAYS
  // ----------------------------------------
  const getRemainingTrialDays = () => {
    if (
      !subscription ||
      subscription.status !== 'trial'
    ) {
      return 0;
    }

    const now = new Date();

    const endDate = new Date(
      subscription.trial_end_date
    );

    const diffTime =
      endDate.getTime() - now.getTime();

    const diffDays = Math.ceil(
      diffTime /
        (1000 * 60 * 60 * 24)
    );

    return Math.max(0, diffDays);
  };

  // ----------------------------------------
  // SELECT PROFESSIONAL PLAN
  // ----------------------------------------
  const handleUpgrade = (
    plan: SubscriptionPlan
  ) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  // ----------------------------------------
  // STATUS BADGE
  // ----------------------------------------
  const getStatusBadge = (
    status: string
  ) => {
    const badges = {
      trial: {
        text: 'Free Trial',
        color:
          'bg-blue-100 text-blue-800',
        icon: Clock
      },

      active: {
        text: 'Active',
        color:
          'bg-green-100 text-green-800',
        icon: Check
      },

      expired: {
        text: 'Expired',
        color:
          'bg-red-100 text-red-800',
        icon: AlertCircle
      },

      cancelled: {
        text: 'Cancelled',
        color:
          'bg-gray-100 text-gray-800',
        icon: AlertCircle
      },

      suspended: {
        text: 'Suspended',
        color:
          'bg-yellow-100 text-yellow-800',
        icon: AlertCircle
      }
    };

    const badge =
      badges[
        status as keyof typeof badges
      ] || badges.expired;

    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
      >
        <Icon className="w-4 h-4 mr-1" />

        {badge.text}
      </span>
    );
  };

  // ----------------------------------------
  // PROFESSIONAL ICON
  // ----------------------------------------
  const getPlanIcon = (
    planName: string
  ) => {
    if (planName === 'Professional') {
      return Zap;
    }

    return Shield;
  };

  // ----------------------------------------
  // LOADING
  // ----------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>

          <p className="mt-4 text-gray-600">
            Loading subscription details...
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-7xl mx-auto">

        {/* ----------------------------------------
            PAGE HEADER
        ----------------------------------------- */}
        <div className="text-center mb-12">

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription Management
          </h1>

          <p className="text-xl text-gray-600">
            Choose the plan that fits your business needs
          </p>

        </div>


        {/* ----------------------------------------
            CURRENT PLAN
        ----------------------------------------- */}
        {subscription && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">

            <div className="flex items-center justify-between flex-wrap gap-4">

              <div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Current Plan
                </h2>

                <p className="text-gray-600">
                  {subscription.subscription_plan.name}
                </p>

              </div>

              <div className="flex items-center gap-4">

                {getStatusBadge(
                  subscription.status
                )}

                {subscription.status === 'trial' && (
                  <div className="text-right">

                    <p className="text-sm text-gray-500">
                      Trial ends in
                    </p>

                    <p className="text-2xl font-bold text-blue-600">
                      {getRemainingTrialDays()} days
                    </p>

                  </div>
                )}

              </div>

            </div>


            {/* ----------------------------------------
                USAGE
            ----------------------------------------- */}
            {usage && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* PROJECTS */}
                <div className="bg-gray-50 rounded-lg p-4">

                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Projects this quarter
                  </h3>

                  <div className="flex items-end justify-between">

                    <span className="text-3xl font-bold text-gray-900">
                      {usage.projects_created}
                    </span>

                    <span className="text-sm text-gray-500">
                      of {usage.max_projects}
                    </span>

                  </div>

                  <div className="mt-2 bg-gray-200 rounded-full h-2">

                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          usage.max_projects > 0
                            ? (usage.projects_created /
                                usage.max_projects) *
                                100
                            : 0,
                          100
                        )}%`
                      }}
                    />

                  </div>

                </div>


                {/* QUOTES */}
                <div className="bg-gray-50 rounded-lg p-4">

                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Quotes this quarter
                  </h3>

                  <div className="flex items-end justify-between">

                    <span className="text-3xl font-bold text-gray-900">
                      {usage.quotes_generated}
                    </span>

                    <span className="text-sm text-gray-500">
                      of {usage.max_quotes}
                    </span>

                  </div>

                  <div className="mt-2 bg-gray-200 rounded-full h-2">

                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          usage.max_quotes > 0
                            ? (usage.quotes_generated /
                                usage.max_quotes) *
                                100
                            : 0,
                          100
                        )}%`
                      }}
                    />

                  </div>

                </div>

              </div>
            )}

          </div>
        )}


        {/* ----------------------------------------
            PROFESSIONAL PLAN ONLY
        ----------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {plans.map((plan) => {

            const Icon =
              getPlanIcon(plan.name);

            const isCurrentPlan =
              subscription?.subscription_plan.id ===
              plan.id;

            return (
              <div
                key={plan.id}
                className="md:col-start-2 bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ring-2 ring-blue-600"
              >

                {/* PROFESSIONAL HEADER */}
                <div className="bg-blue-600 text-white text-center py-2 font-semibold">
                  Professional
                </div>

                <div className="p-6">

                  <div className="flex items-center justify-between mb-4">

                    <Icon className="w-10 h-10 text-blue-600" />

                    {isCurrentPlan && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                        Current
                      </span>
                    )}

                  </div>


                  {/* PLAN NAME */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Professional
                  </h3>


                  {/* DESCRIPTION */}
                  <p className="text-gray-600 mb-4">
                    For established designers with growing business
                  </p>


                  {/* PRICE */}
                  <div className="mb-6">

                    <span className="text-4xl font-bold text-gray-900">
                      ₹1
                    </span>

                    <span className="text-gray-600">
                      /quarter
                    </span>

                  </div>


                  {/* FEATURES */}
                  <ul className="space-y-3 mb-6">

                    <li className="flex items-start">

                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />

                      <span className="text-gray-700">
                        Up to 15 concurrent projects
                      </span>

                    </li>

                    <li className="flex items-start">

                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />

                      <span className="text-gray-700">
                        60 quotes per quarter
                      </span>

                    </li>

                    <li className="flex items-start">

                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />

                      <span className="text-gray-700">
                        Premium portfolio showcase
                      </span>

                    </li>

                    <li className="flex items-start">

                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />

                      <span className="text-gray-700">
                        Priority email support
                      </span>

                    </li>

                    <li className="flex items-start">

                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />

                      <span className="text-gray-700">
                        Analytics dashboard
                      </span>

                    </li>

                  </ul>


                  {/* BUTTON */}
                  <button
                    onClick={() =>
                      handleUpgrade(plan)
                    }
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : 'Start Subscription'}
                  </button>

                </div>

              </div>
            );
          })}

        </div>


        {/* ----------------------------------------
            PAYMENT MODAL
        ----------------------------------------- */}
        {showPaymentModal &&
          selectedPlan && (
            <PaymentModal
              plan={selectedPlan}
              subscription={subscription}
              onClose={() =>
                setShowPaymentModal(false)
              }
              onSuccess={() => {
                setShowPaymentModal(false);
                loadSubscriptionData();
              }}
            />
          )}

      </div>

    </div>
  );
};


// ======================================================
// PAYMENT MODAL
// ======================================================

interface PaymentModalProps {
  plan: SubscriptionPlan;
  subscription: DesignerSubscription | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<
  PaymentModalProps
> = ({
  plan,
  subscription,
  onClose,
  onSuccess
}) => {

  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] =
    useState<string>('card');

  const [processing, setProcessing] =
    useState(false);


  // ----------------------------------------
  // ADD 3 MONTHS
  // ----------------------------------------
  const addThreeMonths = (
    startDate: Date
  ) => {
    const endDate = new Date(startDate);

    endDate.setMonth(
      endDate.getMonth() + 3
    );

    return endDate;
  };


  // ----------------------------------------
  // PAYMENT
  // ----------------------------------------
  const handlePayment = async () => {

    if (!user || !subscription) {
      return;
    }

    setProcessing(true);

    try {

      const paymentStart =
        new Date();

      const paymentEnd =
        addThreeMonths(paymentStart);


      // ----------------------------------------
      // PAYMENT DATA
      // ----------------------------------------
      const paymentData = {

        designer_subscription_id:
          subscription.id,

        // STRICTLY ₹1
        amount: 1,

        currency: 'INR',

        payment_method:
          paymentMethod,

        payment_gateway:
          'razorpay',

        transaction_id:
          `TXN_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,

        payment_status:
          'completed',

        payment_date:
          new Date().toISOString(),

        billing_period_start:
          paymentStart.toISOString(),

        billing_period_end:
          paymentEnd.toISOString(),

        metadata: {
          plan_name:
            'Professional',

          billing_period:
            'quarterly',

          amount:
            1,

          max_quotes:
            60,

          payment_method:
            paymentMethod
        }
      };


      // ----------------------------------------
      // SAVE PAYMENT
      // ----------------------------------------
      const {
        error: paymentError
      } = await supabase
        .from('subscription_payments')
        .insert([paymentData]);

      if (paymentError) {
        throw paymentError;
      }


      // ----------------------------------------
      // UPDATE SUBSCRIPTION
      // ----------------------------------------
      const {
        error: subError
      } = await supabase
        .from('designer_subscriptions')
        .update({

          subscription_plan_id:
            plan.id,

          status:
            'active',

          subscription_start_date:
            paymentStart.toISOString(),

          subscription_end_date:
            paymentEnd.toISOString(),

          updated_at:
            new Date().toISOString()

        })
        .eq(
          'id',
          subscription.id
        );

      if (subError) {
        throw subError;
      }


      alert(
        'Payment successful! Your Professional subscription has been activated for 3 months.'
      );

      onSuccess();

    } catch (error) {

      console.error(
        'Payment error:',
        error
      );

      alert(
        'Payment failed. Please try again.'
      );

    } finally {

      setProcessing(false);

    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">

          <h2 className="text-2xl font-bold text-gray-900">
            Complete Payment
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>

        </div>


        {/* PLAN */}
        <div className="mb-6">

          <div className="bg-gray-50 rounded-lg p-4">

            <h3 className="font-semibold text-gray-900 mb-2">
              Professional Plan
            </h3>

            <div className="flex items-end justify-between">

              <span className="text-3xl font-bold text-gray-900">
                ₹1
              </span>

              <span className="text-gray-600">
                /quarter
              </span>

            </div>

          </div>

        </div>


        {/* PAYMENT METHOD */}
        <div className="mb-6">

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>

          <div className="space-y-2">

            {[
              {
                value: 'card',
                label: 'Credit/Debit Card'
              },
              {
                value: 'upi',
                label: 'UPI'
              },
              {
                value: 'netbanking',
                label: 'Net Banking'
              },
              {
                value: 'wallet',
                label: 'Wallet'
              }
            ].map((method) => (

              <label
                key={method.value}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >

                <input
                  type="radio"
                  name="payment-method"
                  value={method.value}
                  checked={
                    paymentMethod ===
                    method.value
                  }
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value
                    )
                  }
                  className="mr-3"
                />

                <span className="text-gray-900">
                  {method.label}
                </span>

              </label>

            ))}

          </div>

        </div>


        {/* DEMO PAYMENT NOTE */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">

          <p className="text-sm text-blue-800">

            <strong>Note:</strong>{' '}
            

          </p>

        </div>


        {/* BUTTONS */}
        <div className="flex gap-3">

          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={processing}
          >
            Cancel
          </button>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
          >

            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>

                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />

                Pay ₹1
              </>
            )}

          </button>

        </div>

      </div>

    </div>
  );
};

export default DesignerSubscription;