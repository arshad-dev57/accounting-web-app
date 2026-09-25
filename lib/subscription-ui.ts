/**
 * Customer-facing subscription purchase UI gate.
 * Flip SUBSCRIPTION_PURCHASE_UI_ENABLED in subscription-pricing when payment is ready.
 * Trial eligibility and backend subscription activation are independent of this flag.
 */
export {
  SUBSCRIPTION_PURCHASE_UI_ENABLED,
  TRIAL_DAYS,
} from './subscription-pricing';
