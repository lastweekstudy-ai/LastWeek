/**
 * TTS Test Suite
 * Run this in browser console to test TTS functionality
 */

import { speak, speakLong, VOICES, STYLES, checkQuota, getMonthlyUsage } from './index.js';
import { speakConversation } from './ttsMulti.js';

/**
 * Test 1: Basic TTS
 */
export async function testBasicTTS(userId = 'test-user') {
  console.log('🧪 Test 1: Basic TTS');
  
  try {
    await speak("Hello, this is a test of the Gemini TTS system!", {
      voice: VOICES.KORE,
      userId,
      onStart: () => console.log('✅ Audio started'),
      onEnd: () => console.log('✅ Audio finished'),
      onError: (err) => console.error('❌ Error:', err),
    });
    
    console.log('✅ Test 1 passed');
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }
}

/**
 * Test 2: Cache Test (should be instant on 2nd call)
 */
export async function testCache(userId = 'test-user') {
  console.log('🧪 Test 2: Cache Test');
  
  const testText = "Testing cache functionality";
  
  try {
    // First call - should take 2-5 seconds
    console.log('First call (generating audio)...');
    const start1 = Date.now();
    await speak(testText, { voice: VOICES.KORE, userId });
    const time1 = Date.now() - start1;
    console.log(`✅ First call: ${time1}ms`);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Second call - should be instant (< 100ms)
    console.log('Second call (from cache)...');
    const start2 = Date.now();
    await speak(testText, { voice: VOICES.KORE, userId });
    const time2 = Date.now() - start2;
    console.log(`✅ Second call: ${time2}ms`);
    
    if (time2 < time1 / 10) {
      console.log('✅ Test 2 passed - Cache is working!');
    } else {
      console.warn('⚠️ Cache might not be working properly');
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }
}

/**
 * Test 3: Different Voices
 */
export async function testVoices(userId = 'test-user') {
  console.log('🧪 Test 3: Different Voices');
  
  const voices = [
    { name: 'Puck', voice: VOICES.PUCK, text: 'I am Puck, energetic and youthful!' },
    { name: 'Charon', voice: VOICES.CHARON, text: 'I am Charon, deep and authoritative.' },
    { name: 'Kore', voice: VOICES.KORE, text: 'I am Kore, warm and friendly.' },
    { name: 'Fenrir', voice: VOICES.FENRIR, text: 'I am Fenrir, strong and confident.' },
    { name: 'Aoede', voice: VOICES.AOEDE, text: 'I am Aoede, melodic and expressive.' },
  ];
  
  try {
    for (const { name, voice, text } of voices) {
      console.log(`Speaking with ${name}...`);
      await speak(text, { voice, userId });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('✅ Test 3 passed');
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }
}

/**
 * Test 4: Speaking Styles
 */
export async function testStyles(userId = 'test-user') {
  console.log('🧪 Test 4: Speaking Styles');
  
  const styles = [
    { name: 'Cheerful', style: STYLES.CHEERFUL },
    { name: 'Serious', style: STYLES.SERIOUS },
    { name: 'Excited', style: STYLES.EXCITED },
    { name: 'Calm', style: STYLES.CALM },
  ];
  
  try {
    for (const { name, style } of styles) {
      console.log(`Speaking ${name.toLowerCase()}...`);
      await speak("This is a test of different speaking styles.", {
        voice: VOICES.KORE,
        style,
        userId,
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('✅ Test 4 passed');
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
  }
}

/**
 * Test 5: Long Text
 */
export async function testLongText(userId = 'test-user') {
  console.log('🧪 Test 5: Long Text');
  
  const longText = `
    This is a test of the long text functionality.
    The system should automatically chunk this into sentences.
    Each sentence will be spoken sequentially.
    This is useful for articles, lessons, or any long-form content.
    The chunking happens automatically, so you don't need to worry about it.
  `;
  
  try {
    await speakLong(longText, {
      voice: VOICES.FENRIR,
      userId,
      onStart: () => console.log('✅ Started speaking long text'),
      onEnd: () => console.log('✅ Finished speaking long text'),
    });
    console.log('✅ Test 5 passed');
  } catch (error) {
    console.error('❌ Test 5 failed:', error);
  }
}

/**
 * Test 6: Multi-Speaker Conversation
 */
export async function testMultiSpeaker(userId = 'test-user') {
  console.log('🧪 Test 6: Multi-Speaker Conversation');
  
  const speakers = [
    { name: 'Teacher', voice: VOICES.KORE },
    { name: 'Student', voice: VOICES.PUCK },
  ];
  
  const script = [
    { speaker: 'Teacher', line: 'Hello! How are you today?' },
    { speaker: 'Student', line: 'I am doing great, thank you!' },
    { speaker: 'Teacher', line: 'Wonderful! Let\'s begin our lesson.' },
    { speaker: 'Student', line: 'I am ready to learn!' },
  ];
  
  try {
    await speakConversation(speakers, script, {
      userId,
      onStart: () => console.log('✅ Conversation started'),
      onEnd: () => console.log('✅ Conversation finished'),
    });
    console.log('✅ Test 6 passed');
  } catch (error) {
    console.error('❌ Test 6 failed:', error);
  }
}

/**
 * Test 7: Quota Management
 */
export async function testQuota(userId = 'test-user') {
  console.log('🧪 Test 7: Quota Management');
  
  try {
    // Check current usage
    const used = await getMonthlyUsage(userId);
    console.log(`Current usage: ${used} characters`);
    
    // Check if we can use 500 more characters
    const quota = await checkQuota(userId, 500);
    console.log('Quota check:', quota);
    console.log(`  Allowed: ${quota.allowed}`);
    console.log(`  Used: ${quota.used}`);
    console.log(`  Limit: ${quota.limit}`);
    console.log(`  Remaining: ${quota.remaining}`);
    
    if (quota.allowed) {
      console.log('✅ Test 7 passed - Quota available');
    } else {
      console.log('⚠️ Test 7 - Quota limit reached');
    }
  } catch (error) {
    console.error('❌ Test 7 failed:', error);
  }
}

/**
 * Test 8: Playback Controls
 */
export async function testPlaybackControls(userId = 'test-user') {
  console.log('🧪 Test 8: Playback Controls');
  
  try {
    const { pauseAudio, resumeAudio, stopAudio, setVolume, setPlaybackRate } = await import('./ttsPlayer.js');
    
    // Start speaking
    console.log('Starting audio...');
    speak("This is a test of playback controls. We will pause, resume, and stop.", {
      voice: VOICES.KORE,
      userId,
    });
    
    // Wait a bit, then pause
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Pausing...');
    pauseAudio();
    
    // Wait, then resume
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Resuming...');
    resumeAudio();
    
    // Wait, then stop
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Stopping...');
    stopAudio();
    
    console.log('✅ Test 8 passed');
  } catch (error) {
    console.error('❌ Test 8 failed:', error);
  }
}

/**
 * Run all tests
 */
export async function runAllTests(userId = 'test-user') {
  console.log('🚀 Running all TTS tests...\n');
  
  await testBasicTTS(userId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testCache(userId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testVoices(userId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testStyles(userId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testLongText(userId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testMultiSpeaker(userId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testQuota(userId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testPlaybackControls(userId);
  
  console.log('\n🎉 All tests complete!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testTTS = {
    basic: testBasicTTS,
    cache: testCache,
    voices: testVoices,
    styles: testStyles,
    longText: testLongText,
    multiSpeaker: testMultiSpeaker,
    quota: testQuota,
    playback: testPlaybackControls,
    all: runAllTests,
  };
  
  console.log('✅ TTS tests loaded!');
  console.log('Run tests with:');
  console.log('  testTTS.basic()       - Test basic TTS');
  console.log('  testTTS.cache()       - Test caching');
  console.log('  testTTS.voices()      - Test all voices');
  console.log('  testTTS.styles()      - Test speaking styles');
  console.log('  testTTS.longText()    - Test long text');
  console.log('  testTTS.multiSpeaker() - Test conversations');
  console.log('  testTTS.quota()       - Test quota management');
  console.log('  testTTS.playback()    - Test playback controls');
  console.log('  testTTS.all()         - Run all tests');
}
