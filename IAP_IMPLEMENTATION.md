# In-App Purchase (IAP) Implementation Guide

## Overview
The Checkout screen has been enhanced to support In-App Purchases using `react-native-iap`. This implementation provides a complete IAP flow for subscription-based purchases.

## Key Features Implemented

### 1. IAP Initialization
- Automatic connection to App Store/Play Store
- Product fetching from store
- Purchase listener setup
- Error handling

### 2. User Interface
- Plan selection with visual feedback
- Payment method display (Apple Pay/Google Pay, Credit Card)
- Real-time IAP status indicators
- Secure checkout flow
- Subscription terms and conditions

### 3. Purchase Flow
- Product selection and validation
- Secure purchase processing
- Receipt validation
- Transaction completion handling
- Success/error feedback

## Required Configuration

### 1. Product IDs Setup
Update the `PRODUCT_IDS` array in `src/screens/Checkout/index.js` with your actual product identifiers:

```javascript
const PRODUCT_IDS = [
  'com.yourapp.stabilise',  // 3 Months
  'com.yourapp.progress',   // 6 Months  
  'com.yourapp.thrive',     // 12 Months
];
```

### 2. Image Assets
Add the following images to your assets folder:
- `applepay.png` - Apple Pay logo
- `creditcard.png` - Credit Card icon

Path: `src/assets/images/`

### 3. Store Configuration

#### iOS (App Store Connect)
1. Create subscription products in App Store Connect
2. Set up shared secret for receipt validation
3. Update the shared secret in the code:
```javascript
validateReceiptIos({ 
  'receipt-data': purchase.transactionReceipt,
  password: 'YOUR_APPLE_SHARED_SECRET' 
}, __DEV__)
```

#### Android (Google Play Console)
1. Create subscription products in Google Play Console
2. Set up Google Service Account for receipt validation
3. Update the service account credentials:
```javascript
validateReceiptAndroid({
  packageName: 'com.yourapp',
  productId: purchase.productId,
  purchaseToken: purchase.purchaseToken,
  subscription: false
}, 'YOUR_GOOGLE_SERVICE_ACCOUNT')
```

### 4. Backend Integration (Recommended)
For production, implement server-side receipt validation:
- Create API endpoints to validate receipts
- Store purchase information in your database
- Handle subscription status updates

## Code Structure

### Main Components
- `initIAP()` - Initializes IAP connection and listeners
- `handleCheckout()` - Processes purchase requests
- `handleSuccessfulPurchase()` - Handles post-purchase flow
- `handlePlanSelect()` - Manages plan selection

### Event Listeners
- `purchaseUpdatedListener` - Handles successful purchases
- `purchaseErrorListener` - Handles purchase failures

## Testing

### iOS Testing
1. Use Sandbox tester accounts
2. Test in TestFlight or development builds
3. Verify receipt validation in sandbox environment

### Android Testing
1. Use License testers in Google Play Console
2. Test with internal/alpha/beta tracks
3. Verify subscription management

## Security Considerations

1. **Always validate receipts server-side** for production
2. **Never trust client-side purchase validation**
3. **Implement proper error handling**
4. **Store purchase tokens securely**
5. **Handle subscription renewals and cancellations**

## Common Issues

### 1. Products Not Loading
- Verify product IDs match store configuration
- Check app bundle ID matches store listing
- Ensure products are approved and available

### 2. Purchase Failures
- Test with proper sandbox accounts
- Check network connectivity
- Verify store configuration

### 3. Receipt Validation Errors
- Confirm shared secrets/service accounts are correct
- Check date/time synchronization
- Verify app version matches receipt

## Next Steps

1. Configure your store products with correct identifiers
2. Add the required image assets
3. Set up receipt validation credentials
4. Test thoroughly in sandbox environments
5. Implement server-side validation for production
6. Add analytics for purchase tracking

## Dependencies
The implementation uses `react-native-iap` which should already be installed in your project. If not, install it:

```bash
npm install react-native-iap
# or
yarn add react-native-iap
```

For iOS, also run:
```bash
cd ios && pod install
```

## Support
For issues with the IAP implementation, refer to:
- [react-native-iap documentation](https://react-native-iap.dooboolab.com/)
- Apple App Store Connect documentation
- Google Play Console documentation