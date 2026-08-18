# SwiftTrack: Your Shipping Partner

Build a complete, production-ready shipping and package tracking SaaS platform inspired by the functionality and layout shown in the provided reference screenshots and the website https://mydelivio.com.

IMPORTANT:
Do NOT make a simple landing page.
Build a complete functional web application with:

Public package tracking

User registration/login

Customer dashboard

Tracking-code purchasing

Package/tracking-code creation

Package status management

Pricing plans

Payment submission

Admin verification

Customer messaging

Email/status notifications

Admin dashboard

Use the reference screenshots for the overall UX direction, spacing, card structure, typography, navigation style, colors, and simplicity. Do not copy the original company's branding, logo, name, text, or proprietary assets. Create an original brand.

BRAND

Use the brand name:

"SwiftTrack"

Create a simple original orange package/box logo.

Primary brand color:
Orange

Secondary:
Blue for Telegram/support actions

Background:
Very light gray / white

Text:
Dark charcoal / black

Use a clean modern SaaS interface with:

Rounded cards

Thin gray borders

Subtle shadows

Large whitespace

Modern sans-serif typography

Minimal visual clutter

Professional logistics-company appearance

==================================================

PUBLIC HOMEPAGE
==================================================

Create a clean public homepage.

TOP NAVIGATION

Left:
Orange square logo with package icon
"SwiftTrack"

Center/right navigation:

Join Telegram Group
Features
Pricing
Track Package
Login / Dashboard

The "Join Telegram Group" button should be blue with a Telegram icon.

If the user is logged in:
Show:
Dashboard
Log Out

If not logged in:
Show:
Login
Sign Up

NAVIGATION MUST BE RESPONSIVE.

On mobile:
Use a hamburger menu.

==================================================
2. HERO SECTION

Create a simple, powerful shipping hero section.

Headline:

"Track Your Package With Ease"

Supporting text:

"Enter your tracking code to view the latest status and delivery updates for your package."

Large tracking input:

"Enter tracking code"

Example:
STK-839271

Button:

"Track Package"

When submitted, navigate to:

/track/{trackingCode}

Add a subtle package/shipping illustration.

Below the tracking form show:

✓ Real-time status updates
✓ Secure tracking
✓ No account required

==================================================
3. FEATURES SECTION

Title:

"Everything You Need to Track Deliveries"

Create clean feature cards:

Package Tracking
Track your shipment from pickup to delivery.

Real-Time Updates
Receive the latest package status updates.

Public Tracking Links
Share a tracking link with your customers.

Customer Messaging
Communicate with customers about their delivery.

Email Notifications
Automatically notify customers when shipment status changes.

Secure Dashboard
Manage all your tracking codes and packages in one place.

==================================================
4. PRICING PAGE

Create a page:

/pricing

Match the simplicity and structure of the provided pricing screenshot.

Heading:

"Simple, Transparent Pricing"

Subheading:

"Choose a plan that gives you the tracking codes you need."

Create THREE pricing cards.

PLAN 1:

Starter

₦15,000

5 tracking codes

Features:

✓ 5 tracking codes
✓ Basic status updates
✓ Public tracking links
✓ Email support

Button:

"Pay by Bank Transfer"

PLAN 2:

Business

₦25,000

15 tracking codes

Add an orange "Most Popular" badge at the top.

Features:

✓ 15 tracking codes
✓ Customer messaging & email replies
✓ Automated status notifications
✓ Public tracking links
✓ Priority email support

Button:

"Pay by Bank Transfer"

This should be the highlighted plan.

PLAN 3:

Pro

₦50,000

45 tracking codes

Features:

✓ 45 tracking codes
✓ Customer messaging & email replies
✓ Automated status notifications
✓ Public tracking links
✓ Priority email support

Button:

"Pay by Bank Transfer"

Pricing cards should be equal height.

On mobile:
Stack cards vertically.

==================================================
5. PAYMENT FLOW

When the user clicks:

"Pay by Bank Transfer"

Open a payment page/modal.

Display:

Selected Plan
Plan price
Number of tracking codes

Bank Transfer Instructions

Bank Name:
[Admin configured bank]

Account Name:
[Admin configured account name]

Account Number:
[Admin configured account number]

Reference:
Generate a unique payment reference.

Example:

STK-PAY-839271

Add:

"I have completed the transfer"

button.

Then ask the customer to upload payment proof.

Fields:

Payment Reference
Amount
Payment Date
Upload Payment Receipt

Button:

"Submit Payment"

After submission:

Payment Status:
"PENDING ADMIN VERIFICATION"

Do NOT immediately activate the plan.

The admin must verify the payment.

==================================================
6. USER REGISTRATION

Create:

/signup

Fields:

Full Name
Email
Phone Number
Password
Confirm Password

Button:

"Create Account"

After registration:

Redirect to dashboard.

Create:

/login

Fields:

Email
Password

Remember Me

Forgot Password

Login button.

==================================================
7. CUSTOMER DASHBOARD

Create:

/dashboard

The dashboard should closely follow the structure shown in the provided dashboard screenshot.

HEADER:

Left:

SwiftTrack logo

Right:

Join Telegram Group
Dashboard
Help
Log Out

MAIN CONTENT:

Title:

"Dashboard"

Below title:

"Business Plan · 12 codes remaining"

On the right:

"Buy New Plan"

and

"+ New Tracking Code"

buttons.

==================================================
8. DASHBOARD STATISTICS

Create four statistics cards.

CARD 1:

Total Packages

0

Package icon in orange.

CARD 2:

In Transit

0

Arrow/travel icon.

CARD 3:

Delivered

0

Location/check icon in green.

CARD 4:

Codes Remaining

0

Information icon in blue.

Cards should update dynamically from database data.

==================================================
9. TRACKING CODES SECTION

Title:

"Your Tracking Codes"

Display all tracking codes belonging to the logged-in user.

Each tracking-code card/table row should show:

Tracking Code
Package
Customer
Status
Created
Last Updated
Public Tracking Link
Actions

Example:

STK-839271
Electronics Package
John Doe
In Transit
Aug 17, 2026
Track Package

Actions:

View
Edit
Copy Link
Delete

If there are no tracking codes:

Show a large empty-state card.

Icon:
Location pin/package

Text:

"No tracking codes yet. Create your first one!"

Button:

"+ New Tracking Code"

==================================================
10. CREATE TRACKING CODE

When the user clicks:

"+ New Tracking Code"

Open:

/dashboard/tracking/new

Create a professional shipment creation form.

Fields:

Tracking Code

Automatically generate a unique code.

Example:

STK-839271

Sender Information:

Sender Name
Sender Phone
Sender Email
Pickup Address

Recipient Information:

Recipient Name
Recipient Phone
Recipient Email
Delivery Address

Package Information:

Package Name
Package Description
Package Category
Weight
Quantity
Package Value

Shipping Information:

Shipping Method
Estimated Delivery Date
Current Location

Initial Status:

Pending
Picked Up
In Transit
Out for Delivery
Delivered

Additional Information:

Special Instructions

Button:

"Create Tracking Code"

After creation:

Show success message:

"Tracking code created successfully."

==================================================
11. PUBLIC TRACKING PAGE

Create:

/track/{trackingCode}

This page must work WITHOUT requiring login.

Display a clean shipment-tracking interface.

Top:

SwiftTrack logo

Tracking number:

STK-839271

Large status:

"IN TRANSIT"

Show:

Current Location
Nairobi Distribution Center

Destination
Mombasa, Kenya

Estimated Delivery
August 19, 2026

==================================================
12. TRACKING TIMELINE

Create a vertical tracking timeline.

Example:

✓ Shipment Created
August 16 · 08:30

✓ Package Picked Up
August 16 · 10:45

✓ Arrived at Distribution Center
August 16 · 18:20

● In Transit
August 17 · 09:15

○ Out for Delivery

○ Delivered

Use different icons/status colors.

The timeline must be generated dynamically from tracking events stored in the database.

==================================================
13. PACKAGE DETAILS

Show:

Tracking Number
Package Type
Weight
Sender
Recipient
Origin
Destination
Shipping Method
Estimated Delivery
Current Status

Add:

"Share Tracking Link"

button.

Add:

"Copy Tracking Link"

button.

==================================================
14. CUSTOMER MESSAGING

For Business and Pro plans, allow customers/business owners to communicate with their package recipient.

Create a messaging panel.

Messages should include:

Sender
Message
Timestamp
Read/Unread status

Allow:

Send Message
Reply
Email Customer

Starter users should not have access to premium messaging features.

Display an upgrade prompt:

"Customer messaging is available on Business and Pro plans."

Button:

"Upgrade Plan"

==================================================
15. AUTOMATIC STATUS NOTIFICATIONS

Business and Pro plans should support automatic notifications.

When a package status changes:

Pending → Picked Up
Picked Up → In Transit
In Transit → Out for Delivery
Out for Delivery → Delivered

Trigger notification.

Notification channels:

Email
In-app notification

Prepare architecture for:

WhatsApp
SMS

but these can initially be disabled/configurable by admin.

==================================================
16. EMAIL REPLY SYSTEM

For Business and Pro users:

Allow the user to send an email reply to the customer directly from the dashboard.

Create:

Customer Email
Subject
Message

Button:

"Send Email"

Store outgoing communication in database.

==================================================
17. ADMIN DASHBOARD

Create a secure admin-only area:

/admin

Admin dashboard should contain:

Overview
Users
Plans
Payments
Tracking Codes
Packages
Messages
Notifications
Settings

Dashboard statistics:

Total Users
Active Plans
Pending Payments
Total Tracking Codes
Active Shipments
Delivered Packages
Revenue

==================================================
18. PAYMENT ADMINISTRATION

Admin should see:

Payment ID
Customer
Plan
Amount
Reference
Payment Date
Receipt
Status

Statuses:

Pending
Approved
Rejected

Actions:

View Receipt
Approve
Reject

When admin clicks APPROVE:

Automatically:

Activate the customer's selected plan.

Add the purchased tracking-code allowance.

Update subscription status.

Notify customer.

Record payment as approved.

When REJECTED:

Do not activate the plan.

Notify customer that payment needs attention.

==================================================
19. PLAN MANAGEMENT

Admin can create/edit plans.

Fields:

Plan Name
Price
Tracking Code Limit
Features
Status

Example:

Starter
₦15,000
5 codes

Business
₦25,000
15 codes

Pro
₦50,000
45 codes

Allow admin to change pricing without modifying code.

==================================================
20. ADMIN TRACKING MANAGEMENT

Admin can see ALL tracking codes.

Table:

Tracking Code
Owner
Recipient
Status
Current Location
Created
Last Updated

Admin actions:

View
Edit
Update Status
Delete

Admin can manually update:

Current location
Shipment status
Estimated delivery
Tracking event

Every update should create a tracking-event record.

==================================================
21. ADMIN USER MANAGEMENT

Admin can:

View users
Search users
Suspend users
Activate users
Change user plan
View payment history
View tracking codes
View account activity

Roles:

Admin
Customer
Business User

==================================================
22. SUPPORT / TELEGRAM

Add a persistent support button in the bottom-right.

Example:

"Need Support? Send a DM"

Use green WhatsApp-style visual treatment if WhatsApp is used.

Also add:

"Join Telegram Group"

in the main navigation.

The Telegram URL should be configurable from Admin Settings.

==================================================
23. RESPONSIVE DESIGN

The website must work perfectly on:

Desktop
Laptop
Tablet
Mobile

Desktop dashboard:
Full-width layout.

Mobile:
Stack cards vertically.

Tables:
Become horizontally scrollable or convert into mobile cards.

Navigation:
Use mobile hamburger menu.

Buttons:
Large enough for touch.

==================================================
24. DATABASE

Use a real database.

Recommended:

Supabase PostgreSQL

Create tables:

users
profiles
plans
subscriptions
payments
tracking_codes
packages
tracking_events
messages
notifications
support_tickets
admin_settings

Relationships:

User → Subscription
User → Tracking Codes
Tracking Code → Package
Tracking Code → Tracking Events
Tracking Code → Messages
User → Payments

==================================================
25. AUTHENTICATION & SECURITY

Use secure authentication.

Requirements:

Email/password authentication
Password hashing
Session management
Protected dashboard routes
Protected admin routes
Role-based permissions
Database row-level security
Secure payment records
Secure file upload for receipts

Users must NEVER be able to access another user's tracking codes.

Admins can access all records.

==================================================
26. TRACKING CODE LIMITS

This is very important.

If a user has:

5 tracking codes

they can create a maximum of 5 active tracking codes.

When they use all codes:

Show:

"Codes Remaining: 0"

Disable:

"+ New Tracking Code"

Show:

"Buy New Plan"

When an admin approves a new plan:

Increase the user's available tracking-code allowance.

==================================================
27. SUBSCRIPTION STATUS

Possible states:

NO_PLAN
PENDING_PAYMENT
ACTIVE
EXPIRED
SUSPENDED

Dashboard should display the current state.

Example:

"No Plan · 0 codes remaining"

or:

"Business Plan · 12 codes remaining"

==================================================
28. EMPTY STATES

Create polished empty states.

No tracking codes:

"No tracking codes yet. Create your first one!"

No payments:

"No payment history yet."

No messages:

"No messages yet."

No notifications:

"You're all caught up."

==================================================
29. LOADING STATES

Add skeleton loaders for:

Dashboard
Tracking page
Payment history
Tracking codes
Admin tables

Do not show blank screens while data is loading.

==================================================
30. ERROR HANDLING

Create friendly errors.

Invalid tracking code:

"Tracking code not found. Please check the code and try again."

Unauthorized:

"You need to log in to access this page."

Payment error:

"Something went wrong while submitting your payment."

Server error:

"Something went wrong. Please try again."

==================================================
31. UI DETAILS

Follow these visual principles from the screenshots:

White/light gray page background

Black/dark text

Orange primary action color

Blue Telegram button

Green support button

Thin gray borders

Rounded 12–16px cards

Minimal shadows

Large whitespace

Simple iconography

Clean modern font

Strong bold headings

Professional SaaS dashboard appearance

Do not make the interface overly colorful.

The orange accent should be used primarily for:

Primary buttons
Active states
Important icons
Highlighted pricing card
Logo

==================================================
32. WEBSITE ROUTES

Create these routes:

/

/pricing

/track

/track/[trackingCode]

/login

/signup

/forgot-password

/dashboard

/dashboard/tracking

/dashboard/tracking/new

/dashboard/tracking/[id]

/dashboard/payments

/dashboard/messages

/dashboard/notifications

/dashboard/settings

/admin

/admin/users

/admin/plans

/admin/payments

/admin/tracking

/admin/packages

/admin/messages

/admin/notifications

/admin/settings

==================================================
33. DEMO DATA

Populate the application with realistic demo data.

Demo tracking codes:

STK-839271
STK-729154
STK-451826

Example shipment:

Tracking:
STK-839271

Status:
IN TRANSIT

Origin:
Lagos, Nigeria

Current Location:
Abuja Distribution Center

Destination:
Port Harcourt, Nigeria

Estimated Delivery:
August 20, 2026

Create several tracking events for this shipment.

==================================================
34. IMPORTANT FUNCTIONAL RULE

Do not create fake buttons.

Every important button must actually perform an action.

Examples:

Track Package → search database
Login → authenticate
Sign Up → create account
Buy Plan → payment flow
Submit Payment → create pending payment
Approve Payment → activate subscription
New Tracking Code → create shipment/tracking code
Update Status → create tracking event
Copy Link → copy real tracking URL
Share → share actual tracking URL
Logout → terminate session

==================================================
35. FINAL REQUIREMENT

The finished website should feel like a real commercial shipping SaaS product rather than a template.

The core customer journey should be:

Visitor
↓
Enter Tracking Code
↓
View Shipment
↓
Create Account
↓
Choose Pricing Plan
↓
Submit Bank Transfer
↓
Admin Verifies Payment
↓
Tracking Codes Activated
↓
Customer Creates Tracking Codes
↓
Shares Public Tracking Links
↓
Updates Package Status
↓
Customer/Recipient Tracks Package

Build the entire system with a clean, scalable architecture.

Prioritize functionality, simplicity, reliability, responsive design, and a polished professional UI.

Use the provided screenshots as visual references for the dashboard and pricing-page composition, but create an original brand called "SwiftTrack".

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://swift-logistics-saas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/84eb366c-cb02-4a38-b868-1f5a6a285e6b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
