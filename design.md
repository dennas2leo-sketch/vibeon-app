# VibeOn - Design & Interface Specification

## Brand Identity

**Color Palette:**
- **Primary Black**: #0A0A0A (Dark backgrounds, text)
- **Accent Pink**: #FF006E (Buttons, highlights, likes)
- **Accent Gold**: #FFB703 (Secondary highlights, premium features)
- **White**: #FFFFFF (Text on dark backgrounds)
- **Dark Gray**: #1A1A1A (Secondary backgrounds)

**Typography:**
- Headlines: Bold, 20-28px
- Body: Regular, 14-16px
- Captions: Medium, 12-13px

---

## Screen List

1. **Splash/Loading Screen** - App initialization
2. **Login Screen** - Email/password login
3. **Sign Up Screen** - User registration (name, DOB, email, password)
4. **Email Verification Screen** - 6-digit code verification
5. **Profile Setup Screen** - First-time profile photo + bio
6. **Feed Screen** - Stories, posts, likes, comments
7. **Notifications Screen** - Real-time notifications
8. **Messages Screen** - Direct messaging with users
9. **Profile Screen** - User profile, followers, posts, settings
10. **Post Detail Screen** - Full post view with comments
11. **Edit Profile Screen** - Update bio, profile photo, settings

---

## Primary Content & Functionality

### 1. Login Screen
- Email input field
- Password input field
- "Forgot Password?" link
- "Login" button (pink)
- "Don't have an account? Sign Up" link

### 2. Sign Up Screen
- Full Name input
- Date of Birth picker
- Email input
- Password input
- Confirm Password input
- "Next" button (gold)
- "Already have an account? Login" link

### 3. Email Verification Screen
- Message: "Enter the 6-digit code sent to your email"
- 6 input fields for code digits
- "Verify" button (pink)
- "Resend Code" button (text)

### 4. Profile Setup Screen (First Time)
- Profile photo upload (camera or gallery)
- Bio text input (max 150 characters)
- "Continue" button (gold)

### 5. Feed Screen (Main Tab)
- **Stories Section** (horizontal scroll):
  - User's story (+)
  - Friends' stories with gold ring borders
- **Posts Section** (vertical scroll):
  - Post header: profile pic, username, timestamp
  - Post image(s) with carousel
  - Engagement bar: likes count, comments, shares
  - Like button (heart), comment button, share button, bookmark button
  - Comments preview (2-3 top comments)
  - Caption text with username

### 6. Notifications Screen
- Real-time list of:
  - Likes on posts
  - Comments on posts
  - New followers
  - Messages
- Each notification shows: profile pic, action, timestamp
- Swipe to dismiss or mark as read

### 7. Messages Screen
- List of active conversations
- Each conversation shows: profile pic, username, last message, timestamp
- Search bar at top
- Tap to open chat
- Real-time message delivery

### 8. Profile Screen
- Profile header:
  - Profile photo (large, circular)
  - Username
  - Bio
  - Follower/Following counts
  - Edit Profile button (if own profile)
- Tabs: Posts | Saved | Tagged
- Grid of user's posts

### 9. Edit Profile Screen
- Profile photo (tap to change)
- Username (editable)
- Bio (editable, max 150 chars)
- Email (read-only)
- Logout button
- Delete Account button

---

## Key User Flows

### Flow 1: User Registration & First Login
1. User opens app → Splash screen
2. User taps "Sign Up"
3. Fills name, DOB, email, password → Taps "Next"
4. Receives verification email
5. Enters 6-digit code → Taps "Verify"
6. Redirected to Profile Setup (photo + bio)
7. Taps "Continue" → Enters Feed

### Flow 2: Create & Share Post
1. User in Feed → Taps "+" button (bottom nav or top)
2. Selects photo from camera or gallery
3. Adds caption
4. Taps "Share"
5. Post appears in Feed (real-time)
6. Followers see post in their Feed

### Flow 3: Like & Comment on Post
1. User sees post in Feed
2. Taps heart icon → Post liked (pink heart, count increases)
3. Taps comment icon → Opens comment sheet
4. Types comment → Taps "Post"
5. Comment appears in real-time
6. Post author receives notification

### Flow 4: Send Direct Message
1. User taps Messages tab
2. Taps "+" or existing conversation
3. Types message → Taps "Send"
4. Message appears in real-time (both sides)
5. Recipient receives notification

### Flow 5: Follow User
1. User views another user's profile
2. Taps "Follow" button
3. Button changes to "Following" (gold)
4. User appears in follower list
5. Target user receives notification

---

## Navigation Structure (Tab Bar)

**Bottom Tab Bar (Always Visible):**
1. **Home** (house icon) - Feed with stories & posts
2. **Search** (magnifying glass) - Discover users & posts
3. **Create** (plus icon) - New post
4. **Notifications** (bell icon) - Activity notifications
5. **Messages** (chat bubble) - Direct messages
6. **Profile** (person icon) - User profile

---

## Real-Time Features

- **Live Feed Updates**: Posts appear instantly when users post
- **Live Notifications**: Likes, comments, follows appear in real-time
- **Live Messaging**: Messages sync instantly between users
- **Live Follower Counts**: Follower/following counts update in real-time
- **Live Story Views**: Story view counts update in real-time

---

## Data Structure (Firestore/Backend)

### Collections:
- **users** - User profiles (name, bio, profile_pic, followers, following, email)
- **posts** - Posts (userId, image, caption, likes, comments, timestamp)
- **comments** - Comments (postId, userId, text, timestamp)
- **messages** - Direct messages (senderId, recipientId, text, timestamp)
- **notifications** - Notifications (userId, type, relatedUserId, timestamp)
- **stories** - Stories (userId, image, timestamp, expiresAt)

---

## Accessibility & Compatibility

- **Portrait orientation only** (9:16 aspect ratio)
- **One-handed usage**: All interactive elements within thumb reach
- **iOS 14+** and **Android 8+** support
- **Haptic feedback** on button taps
- **Dark mode optimized** (black & pink scheme works perfectly)
- **Camera & Gallery access** for photo uploads
- **Push notifications** enabled for real-time alerts

---

## Design Principles

1. **Minimalist & Bold**: Clean layout with pink/gold accents on black
2. **Real-Time First**: Every action reflects instantly
3. **User-Centric**: Focus on content and connections
4. **Accessible**: Large touch targets, clear feedback
5. **Performance**: Smooth scrolling, fast image loading
6. **Authentic Users Only**: No bots, verification required
