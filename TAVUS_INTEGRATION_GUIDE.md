# 🎥 Tavus AI Avatar Integration Guide

This guide will help you set up real-time video conversations with your Tavus AI agent in BlindSpot.

## 📋 Prerequisites

### 1. Tavus Account & API Access
- [ ] Tavus account with API access
- [ ] Valid Tavus API key
- [ ] At least one trained replica/avatar

### 2. Required Information
You'll need these from your Tavus dashboard:
- **API Key**: Your Tavus API authentication key
- **Replica ID**: The ID of your trained AI avatar
- **Persona ID** (optional): Custom persona configuration

## 🔧 Setup Steps

### Step 1: Update Environment Variables

Your `.env` file already has the Tavus API key:
```env
VITE_TAVUS_API_KEY=838399f01abb4afeb023ad60cf20d3be
```

Add your replica ID (get this from your Tavus dashboard):
```env
VITE_TAVUS_REPLICA_ID=your_replica_id_here
```

### Step 2: Verify Your Tavus Setup

1. **Test API Connection**:
   ```bash
   # Test your API key works
   curl -H "x-api-key: 838399f01abb4afeb023ad60cf20d3be" \
        https://tavusapi.com/v2/replicas
   ```

2. **List Your Replicas**:
   Go to AI Companion page → Click "Test Mic" → Check browser console for Tavus connection logs

### Step 3: Configure Your Avatar

In the Tavus dashboard:
1. **Train Your Replica**: Upload video of the person/character you want as your AI companion
2. **Set Persona**: Configure the personality and speaking style
3. **Test Conversations**: Ensure your avatar responds appropriately to mental health topics

## 🎯 What's Already Implemented

### ✅ Core Integration Features:
- **Real-time Video Conversations**: Direct integration with Tavus conversation API
- **Personalized Context**: Passes user's mood, completed courses, and concerns to the avatar
- **Automatic Cleanup**: Properly ends Tavus conversations when user leaves
- **Error Handling**: Graceful fallbacks when Tavus is unavailable
- **Connection Testing**: Built-in API connectivity testing

### ✅ User Experience Features:
- **Video Toggle**: Users can turn video avatar on/off
- **Loading States**: Shows loading while initializing avatar
- **Fallback Avatar**: Static avatar when video is unavailable
- **Responsive Design**: Works on desktop and mobile
- **HTTPS Support**: Proper security for video/audio access

## 🛠️ How It Works

### 1. **Session Initialization**
```typescript
// When user opens AI Companion:
const avatarUrl = await aiCompanionService.initializeTavusAvatar({
  recentMood: user.recentMoodLevel,
  completedCourses: user.completedCourses,
  currentConcerns: extractedFromJournal
});
```

### 2. **Video Display**
```jsx
// The avatar appears in an iframe:
<iframe 
  src={avatarUrl}
  allow="camera; microphone; autoplay"
  title="Sage AI Avatar"
/>
```

### 3. **Conversation Context**
Your Tavus avatar will receive context like:
- "User's recent mood: 6/10. Start by asking how they're feeling now."
- "Completed courses: Stress Management, Mindfulness Basics"
- "Current concerns: work stress, sleep issues"

## 🧪 Testing Your Integration

### Test Checklist:
1. **API Connection**: ✅ Can fetch replicas from Tavus
2. **Conversation Creation**: ✅ Can start new video conversations  
3. **Video Display**: ✅ Avatar appears in the interface
4. **Context Passing**: ✅ Avatar mentions user's mood/history
5. **Cleanup**: ✅ Conversations end properly when user leaves

### Debugging:
- Check browser console for Tavus API responses
- Verify HTTPS is enabled (required for video/audio)
- Test with different browsers (Chrome/Edge recommended)
- Monitor Tavus dashboard for conversation logs

## 📱 Production Deployment

### Before Going Live:
1. **Test Replica Performance**: Ensure your avatar handles mental health conversations appropriately
2. **Set Usage Limits**: Configure max call duration (currently 40 minutes)
3. **Enable Transcription**: Set `enable_transcription: true` for conversation logs
4. **Monitor Costs**: Tavus charges per conversation minute
5. **HTTPS Certificate**: Ensure your domain has valid HTTPS

### Monitoring:
- **Tavus Dashboard**: Monitor conversation usage and costs
- **Browser Console**: Check for API errors or connection issues
- **User Feedback**: Monitor user experience with video vs text chat

## 🔒 Security & Privacy

### Data Handling:
- **User Context**: Only essential mood/course data is passed to Tavus
- **Conversations**: Can be transcribed and stored (configure as needed)
- **API Keys**: Stored securely in environment variables
- **HTTPS Required**: All video/audio access requires secure connection

### Privacy Considerations:
- Users can toggle video off at any time
- Conversations can be ended immediately
- No video is recorded unless specifically configured
- Transcripts follow your privacy policy

## 🚀 Go Live!

Once everything is tested:
1. Deploy your app with HTTPS enabled
2. Update your `.env` with production Tavus credentials
3. Test the full user flow in production
4. Monitor for any API rate limits or errors
5. Enjoy real-time AI avatar conversations! 🎉

## 📞 Support

- **Tavus Support**: Check their documentation and support channels
- **Integration Issues**: Review console logs and network requests
- **Performance**: Monitor conversation quality and response times

---

Your BlindSpot app is now ready for real-time AI avatar conversations with personalized mental health support! 🌟