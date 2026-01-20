<!-- Firebase Storage Rules Deployment Guide -->

# Firebase Storage Rules - Deployment Guide

Step-by-step instructions for deploying the Storage security rules to your Firebase project.

## Files Involved

- **firestore.rules** - Contains both Firestore and Storage rules
  - Firestore rules: `service cloud.firestore { ... }`
  - Storage rules: `service firebase.storage { ... }`

## Deployment Steps

### Option 1: Firebase Console (Recommended for Getting Started)

#### Deploy Firestore Rules

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your project

2. **Navigate to Firestore Rules**
   - Left sidebar: Firestore Database
   - Click "Rules" tab
   - You should see existing rules

3. **Copy Firestore Rules**
   - Open `firestore.rules` file
   - Copy everything from `rules_version = '2';` to the closing `}` of the Firestore block
   - Stop before `// ============ FIREBASE STORAGE RULES`

4. **Paste into Console**
   - In Firebase Console Rules editor, select all (Ctrl+A)
   - Paste the Firestore rules
   - Click "Publish"

5. **Verify Deployment**
   - Rules should show green "Active" status
   - Check timestamp shows recent update

#### Deploy Storage Rules

1. **Navigate to Storage Rules**
   - Left sidebar: Storage
   - Click "Rules" tab
   - You should see existing storage rules

2. **Copy Storage Rules**
   - Open `firestore.rules` file
   - Find `// ============ FIREBASE STORAGE RULES` section
   - Copy everything from `service firebase.storage {` to the closing `}`

3. **Paste into Console**
   - In Firebase Console Storage Rules editor, select all (Ctrl+A)
   - Paste the Storage rules
   - Click "Publish"

4. **Verify Deployment**
   - Rules should show green "Active" status
   - Check timestamp shows recent update

### Option 2: Firebase CLI (Advanced)

#### Prerequisites

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project (if not already done)
firebase init
```

#### Deployment

```bash
# Deploy both Firestore and Storage rules
firebase deploy --only firestore:rules,storage

# Or deploy separately
firebase deploy --only firestore:rules    # Just Firestore
firebase deploy --only storage            # Just Storage
```

#### Verify Deployment

```bash
# Get current rules
firebase rules:list

# View deployment history
firebase functions:list  # Shows recent deployments
```

## Rules Structure

### Firestore Rules Location in File

```
firestore.rules
├─ Line 1: rules_version = '2';
├─ Lines 19-195: service cloud.firestore { ... }
│  ├─ Listings collection rules
│  ├─ Users collection rules
│  ├─ Images collection rules
│  └─ Messages collection rules
└─ (End with closing })
```

### Storage Rules Location in File

```
firestore.rules
├─ Lines 197-227: service firebase.storage { ... }
│  ├─ Helper functions
│  │  ├─ isAuthenticated()
│  │  ├─ isListingOwner(listingId)
│  │  └─ isAdmin()
│  ├─ /listings/{listingId}/{imageId} rules
│  │  ├─ allow read
│  │  ├─ allow create
│  │  ├─ allow update
│  │  └─ allow delete
│  └─ /{allPaths=**} catch-all deny
└─ (End with closing })
```

## What Gets Deployed

### Firestore Rules

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    // Listings collection
    match /listings/{listingId} { ... }
    
    // Users collection
    match /users/{uid} { ... }
    
    // Images collection
    match /images/{imageId} { ... }
    
    // Messages collection
    match /messages/{messageId} { ... }
  }
}
```

### Storage Rules

```javascript
service firebase.storage {
  match /b/{bucket}/o {
    // Listing images
    match /listings/{listingId}/{imageId} { ... }
    
    // Catch-all deny
    match /{allPaths=**} { ... }
  }
}
```

## Testing After Deployment

### Test Firestore Access

```javascript
// Test read
const doc = await getDoc(doc(db, 'listings', 'apt-123'));
// Should work for active listings

// Test create
const newListing = await addDoc(collection(db, 'listings'), {
  title: 'Test Listing',
  listedBy: { id: 'user-123' }
});
// Should work if authenticated
```

### Test Storage Access

```javascript
// Test read (should always work)
const url = await getDownloadURL(
  ref(storage, 'listings/apt-123/image.jpg')
);

// Test upload (should work only if own listing)
await uploadBytes(
  ref(storage, 'listings/apt-123/new-image.jpg'),
  file
);
// Should work if user owns apt-123

// Test delete (should work only if own listing)
await deleteObject(
  ref(storage, 'listings/apt-123/image.jpg')
);
// Should work if user owns apt-123
```

## Troubleshooting

### Rules Publish Failed

**Error:** "Syntax error in rules"

**Solution:**
- Check you copied complete Firestore OR complete Storage block
- Make sure closing `}` is included
- Don't mix Firestore and Storage blocks
- Validate JSON syntax

### Test Fails After Deployment

**Error:** "Permission denied"

**Solution:**
1. Verify rule changes were published (check timestamp)
2. Clear browser cache and restart app
3. Check user is authenticated
4. Verify ownership in Firestore/Storage path

### Storage Rules Not Appearing

**Error:** "Rules not found in Storage tab"

**Solution:**
- Make sure you're in the Storage tab (not Firestore)
- Deploy to correct bucket
- Check project selection

## Verification Checklist

After deployment, verify:

- [ ] Firestore rules show "Active" status
- [ ] Storage rules show "Active" status
- [ ] Both have recent timestamps
- [ ] Anonymous users can read listings
- [ ] Authenticated owners can upload images
- [ ] Non-owners cannot upload to others' listings
- [ ] Anonymous users cannot create listings
- [ ] Admin users can manage any content

## Rollback

If something goes wrong:

### Via Firebase Console

1. Go to Rules tab
2. Find "Rules history" or recent versions
3. Click on previous version
4. Click "Restore"
5. Confirm action

### Via Firebase CLI

```bash
# List recent versions
firebase rules:list

# Restore specific version (use version number from list)
firebase rules:restore <version-number>
```

## Performance Monitoring

### Storage Rules Impact

Monitor these metrics in Firebase Console:

1. **Storage read requests** - Firestore lookups
   - Each upload triggers ownership check
   - Adds +1 read per upload
   
2. **Storage write requests** - Actual uploads
   - Count of successful uploads
   - Failed uploads (permission denied)

3. **Storage bandwidth**
   - Download traffic (image downloads)
   - Upload traffic (user uploads)

### Cost Implications

With Storage rules using Firestore lookups:

```
Cost per 100K operations:
- Firestore reads: $0.06
- Storage uploads: $0.05 per GB

Example (1000 uploads/month):
- Firestore reads: 1000 reads = $0.0006 (negligible)
- Storage uploads: ~500 MB = $0.025
- Total: ~$0.03/month
```

Future optimization: Use Firebase custom claims to avoid Firestore lookups.

## Rule Updates

To update rules in future:

1. Edit `firestore.rules` file locally
2. Test with Firebase Emulator (if available)
3. Deploy using Console or CLI
4. Verify with test cases
5. Monitor metrics in Console

## Related Documentation

- [FIREBASE_STORAGE_RULES.md](FIREBASE_STORAGE_RULES.md) - Complete rules documentation
- [FIREBASE_STORAGE_GUIDE.md](FIREBASE_STORAGE_GUIDE.md) - Storage integration guide
- [firestore.rules](firestore.rules) - The actual rules file
- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)

## Support

For issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [FIREBASE_STORAGE_RULES.md](FIREBASE_STORAGE_RULES.md)
3. Check Firebase Console error logs
4. Test with Firebase Emulator locally
