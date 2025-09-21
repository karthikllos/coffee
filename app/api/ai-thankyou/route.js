import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, amount, message, style } = await request.json();

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.log('⚠️  No Gemini API key found in environment variables');
      console.log('📝 Add GEMINI_API_KEY to your .env.local file');
      console.log('🔄 Using fallback template generation...');
      return NextResponse.json({ 
        thankYouNote: generateFallbackNote(name, amount, message, style) 
      });
    }

    const prompt = createPrompt(name, amount, message, style);
    console.log('🤖 Generating AI thank-you note with Gemini...');

    try {
      // ✅ Correct Gemini API endpoint for 2025
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        }
      );

      // Log response details for debugging
      console.log('📡 Gemini API Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Specific error handling
        if (response.status === 400) {
          console.error('🔑 API Key might be invalid or request format is wrong');
        } else if (response.status === 403) {
          console.error('🚫 API Key might not have permissions or quota exceeded');
        } else if (response.status === 429) {
          console.error('⏱️  Rate limit exceeded, try again later');
        }
        
        throw new Error(`Gemini API failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Gemini API Response received');
      
      const thankYouNote = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!thankYouNote) {
        console.error('❌ No content generated from Gemini response:', data);
        throw new Error('No content generated from Gemini');
      }

      console.log('🎉 AI thank-you note generated successfully!');
      return NextResponse.json({ thankYouNote: thankYouNote.trim() });

    } catch (apiError) {
      console.error('💥 Gemini API call failed:', apiError.message);
      console.log('🔄 Falling back to template generation...');
      
      return NextResponse.json({ 
        thankYouNote: generateFallbackNote(name, amount, message, style) 
      });
    }

  } catch (error) {
    console.error('🔥 Error in ai-thankyou route:', error);
    
    // Ultimate fallback
    const fallbackNote = `Dear ${name || 'Friend'},\n\nThank you so much for your generous support of ₹${amount}! Your kindness means the world to me.\n\nWith heartfelt gratitude! 💖`;
    
    return NextResponse.json({ thankYouNote: fallbackNote });
  }
}

function createPrompt(name, amount, message, style) {
  const donor = name || 'a supporter';
  const messageText = message ? `Their message was: "${message}"` : 'They left no message.';
  
  const styleInstructions = {
    heartfelt: 'Write a warm, personal, and sincere thank-you message. Be genuine and appreciative. Use emojis sparingly.',
    poem: 'Write a creative poem with rhymes about gratitude. Make it uplifting and include some emojis.',
    haiku: 'Write a traditional haiku (exactly 5-7-5 syllable structure) about gratitude. Include nature imagery if possible.',
    funny: 'Write a lighthearted, humorous but appreciative message. Be playful but respectful. Include fun emojis.',
    professional: 'Write a formal but genuine business-style appreciation letter. Be respectful and professional.'
  };

  return `Write a ${style} thank-you note for ${donor} who donated ₹${amount} to support my work. ${messageText}

Style Guidelines: ${styleInstructions[style] || styleInstructions.heartfelt}

Important Requirements:
- Keep it under 150 words
- Be genuine and personal
- Match the requested style exactly
- Include the donor's name if provided
- Reference the donation amount appropriately
- Make it feel special and meaningful

Generate only the thank-you note content, no additional commentary or explanation.`;
}

function generateFallbackNote(name, amount, message, style) {
  const donor = name || 'Friend';
  const messageText = message ? `Your message "${message}" ` : '';
  
  const templates = {
    heartfelt: `Dear ${donor},

Your generosity has truly brightened my day! ☀️ Thank you for supporting my work with ₹${amount}. ${messageText}means the world to me. Your kindness fuels my passion to keep creating!

With heartfelt gratitude,
💖 Your grateful creator`,

    poem: `🌸 A Poem for ${donor} 🌸

In a world of endless scrolling screens,
You stopped to share in someone's dreams.
₹${amount} you chose to give,
A gift that helps my passion live.

${message ? `"${message}" - your words so kind,` : 'Your kindness shows a generous mind,'}
A treasure rare, so hard to find.
Thank you, friend, for being you,
For making dreams and wishes true! ✨

With endless gratitude,
Your poet friend 💝`,

    haiku: `🍃 A Haiku for You 🍃

Generous soul shares
Support flows like gentle streams  
Gratitude blooms bright 🌸

${messageText ? `Your message touched my heart:\n"${message}"\n\n` : ''}With deep appreciation,
Your grateful creator 🎨`,

    funny: `🚨 SUPERHERO ALERT! 🚨

Name: ${donor}
Superpower: Extreme Generosity
Last Spotted: Making someone's day with ₹${amount}
Threat Level: MAXIMUM AWESOMENESS 💪

${messageText ? `Intercepted message: "${message}" (Definitely a friendly agent!) ` : ''}

Thank you for being absolutely incredible! I'm pretty sure you have a secret cape hidden somewhere! 🦸‍♀️

Your biggest fan and grateful creator! 🌟`,

    professional: `Dear ${donor},

I would like to express my sincere gratitude for your generous contribution of ₹${amount}. Your support directly enables me to continue creating valuable content and pursuing meaningful projects.

${messageText ? `I particularly appreciated your message: "${message}" ` : ''}Your investment in my work is instrumental in helping me maintain quality and consistency.

I am truly grateful for supporters like you who believe in the value of creative work and are willing to contribute to its continuation.

With sincere appreciation,
Your dedicated creator

P.S. While this note may be professional in tone, please know that my gratitude is 100% genuine! 😊`
  };

  return templates[style] || templates.heartfelt;
}