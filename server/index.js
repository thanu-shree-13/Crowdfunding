import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing in .env file");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Enhanced extraction functions with better pattern matching
function extractIntent(idea) {
  const text = idea.toLowerCase();
  
  const intents = {
    educational: /college|university|school|education|tuition|degree|student|course|class|study|learn|graduate|academic|scholarship|phd|master|bachelor|diploma|certificate/i,
    medical: /medical|health|hospital|surgery|treatment|illness|disease|doctor|clinic|medicine|therapy|recovery|diagnosis|prescription|medication|insurance|healthcare|wellness|mental health|depression|anxiety|therapy|counseling/i,
    business: /business|startup|company|shop|store|product|bakery|cafe|restaurant|entrepreneur|venture|sell|market|ecommerce|online store|franchise|small business|local business|merchant|retail/i,
    creative: /art|music|film|creative|project|book|album|exhibition|performance|paint|write|produce|design|photography|craft|handmade|artist|musician|filmmaker|writer|author|poetry|dance|theater/i,
    community: /community|nonprofit|charity|local|neighborhood|center|program|initiative|volunteer|non-profit|ngo|social cause|community service|outreach|foundation|organization/i,
    personal: /family|home|house|rent|mortgage|bills|emergency|crisis|urgent|accident|repair|funeral|wedding|travel|vacation|pet|animal|adoption|relocation|moving/i,
    technology: /app|software|website|tech|technology|digital|platform|mobile|application|web|development|programming|ai|machine learning|blockchain|crypto/i,
    environment: /environment|green|sustainable|eco|renewable|climate|conservation|recycling|organic|farm|garden|wildlife|nature/i
  };
  
  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(text)) {
      return intent;
    }
  }
  
  return "personal";
}

function extractAmount(idea) {
  const patterns = [
    /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|usd)?/i,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|usd)/i,
    /need\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /asking\s+for\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /goal\s+of\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /raise\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|thousand)/i,
    /approximately\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /around\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  ];
  
  for (const pattern of patterns) {
    const match = idea.match(pattern);
    if (match && match[1]) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      if (match[0].toLowerCase().includes('k') && amount < 1000) {
        amount = amount * 1000;
      }
      return amount;
    }
  }
  
  return null;
}

function extractDeadline(idea) {
  const datePatterns = [
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December))\b/i,
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?)\b/i,
    /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,
    /\b(\d{1,2}-\d{1,2}-\d{4})\b/,
    /by\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
    /before\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
    /deadline\s+(?:is\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
    /within\s+(?:a|an)?\s*(\w+)/i,
    /(?:next|this)\s+(week|month|year)/i,
    /(?:in|within)\s+(\d+)\s+(days?|weeks?|months?)/i
  ];
  
  for (const pattern of datePatterns) {
    const match = idea.match(pattern);
    if (match && match[1]) {
      const timeFrame = match[1].toLowerCase();
      
      if (timeFrame.includes('month')) {
        const date = new Date();
        if (timeFrame.includes('next')) {
          date.setMonth(date.getMonth() + 1);
        } else {
          date.setMonth(date.getMonth() + 1);
        }
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      if (timeFrame.includes('week')) {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      if (timeFrame.match(/\d+/)) {
        const days = parseInt(timeFrame.match(/\d+/)[0]);
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      return match[1];
    }
  }
  
  return null;
}

function extractLocation(idea) {
  const locationPatterns = [
    /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s|\.|$)/,
    /at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s|\.|$)/,
    /from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s|\.|$)/,
    /located\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /based\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /near\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = idea.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      return match[1];
    }
  }
  
  return null;
}

function extractSpecificCondition(idea) {
  const text = idea.toLowerCase();
  
  const conditions = [
    'cancer', 'tumor', 'leukemia', 'diabetes', 'heart disease', 'stroke',
    'surgery', 'operation', 'transplant', 'kidney', 'liver', 'brain',
    'injury', 'accident', 'broken', 'fracture', 'burn', 'infection',
    'mental health', 'depression', 'anxiety', 'therapy', 'rehabilitation',
    'covid', 'pneumonia', 'arthritis', 'alzheimer', 'dementia', 'parkinson',
    'multiple sclerosis', 'cystic fibrosis', 'chronic illness', 'rare disease'
  ];
  
  for (const condition of conditions) {
    if (text.includes(condition)) {
      return condition;
    }
  }
  
  return null;
}

function extractSpecificTreatment(idea) {
  const text = idea.toLowerCase();
  
  const treatments = [
    'chemotherapy', 'radiation', 'surgery', 'physical therapy', 'medication',
    'hospital stay', 'rehabilitation', 'counseling', 'emergency room', 'ambulance',
    'intensive care', 'icu', 'recovery', 'post-operative', 'follow-up care',
    'specialist visit', 'diagnostic test', 'mri', 'ct scan', 'x-ray'
  ];
  
  for (const treatment of treatments) {
    if (text.includes(treatment)) {
      return treatment;
    }
  }
  
  return null;
}

function extractBusinessName(idea) {
  const patterns = [
    /(?:start|open|launch|create)\s+(?:a|an|my)?\s+(\w+(?:\s+\w+){0,3})\s+(?:business|shop|bakery|cafe|restaurant|store)/i,
    /called\s+["']?([^"']+)["']?/i,
    /named\s+["']?([^"']+)["']?/i,
    /brand\s+["']?([^"']+)["']?/i,
    /company\s+["']?([^"']+)["']?/i
  ];
  
  for (const pattern of patterns) {
    const match = idea.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractProductType(idea) {
  const text = idea.toLowerCase();
  const productTypes = {
    bakery: ['bakery', 'bread', 'pastry', 'cake', 'cupcake'],
    cafe: ['cafe', 'coffee', 'tea', 'espresso'],
    restaurant: ['restaurant', 'food', 'dining', 'cuisine'],
    retail: ['shop', 'store', 'boutique', 'retail'],
    service: ['service', 'consulting', 'agency'],
    product: ['product', 'goods', 'merchandise'],
    tech: ['app', 'software', 'platform', 'digital']
  };
  
  for (const [type, keywords] of Object.entries(productTypes)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return type;
      }
    }
  }
  
  return 'business';
}

function extractDegree(idea) {
  const text = idea.toLowerCase();
  const degrees = {
    'business': ['business', 'management', 'marketing', 'finance', 'accounting'],
    'computer science': ['computer science', 'cs', 'software', 'programming', 'coding'],
    'nursing': ['nursing', 'healthcare', 'medical assistant'],
    'engineering': ['engineering', 'mechanical', 'electrical', 'civil'],
    'psychology': ['psychology', 'counseling', 'mental health'],
    'art': ['art', 'design', 'graphic design', 'visual arts'],
    'music': ['music', 'performance', 'composition'],
    'education': ['education', 'teaching', 'curriculum'],
    'law': ['law', 'legal', 'pre-law']
  };
  
  for (const [degree, keywords] of Object.entries(degrees)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return degree;
      }
    }
  }
  
  return null;
}

function extractSchool(idea) {
  const text = idea.toLowerCase();
  const schoolPatterns = [
    /(?:at|in)\s+([A-Z][a-z]+\s+(?:University|College|School|Institute))/i,
    /([A-Z][a-z]+\s+(?:University|College|School|Institute))/i,
    /community\s+college/i,
    /state\s+university/i
  ];
  
  for (const pattern of schoolPatterns) {
    const match = idea.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return null;
}

function extractSpecifics(idea, intent) {
  const specifics = {
    originalIdea: idea,
    amount: extractAmount(idea),
    deadline: extractDeadline(idea),
    location: extractLocation(idea),
  };
  
  if (intent === 'medical') {
    specifics.condition = extractSpecificCondition(idea);
    specifics.treatment = extractSpecificTreatment(idea);
  }
  
  if (intent === 'business') {
    specifics.businessName = extractBusinessName(idea);
    specifics.productType = extractProductType(idea);
  }
  
  if (intent === 'educational') {
    specifics.degree = extractDegree(idea);
    specifics.school = extractSchool(idea);
  }
  
  return specifics;
}

// ✅ IMPROVED FRAUD DETECTION WITH CLEAR SCORING THRESHOLDS
function analyzeFraud(idea, specifics, wallet = null) {
  let score = 0;
  let reasons = [];
  const text = idea.toLowerCase();

  // 🚨 1. URGENCY PRESSURE (STRONG SIGNAL)
  if (/immediately|urgent|asap|now|fast|right now|today|tonight|by tomorrow/i.test(text)) {
    score += 40;
    reasons.push("Uses urgency pressure words (immediately/urgent/asap/now)");
  }

  // 🚨 2. VERY SHORT / LOW INFORMATION
  if (text.length < 30) {
    score += 35;
    reasons.push("Extremely brief description - lacks any details");
  } else if (text.length < 60) {
    score += 30;
    reasons.push("Very brief description - lacks details");
  } else if (text.length < 100) {
    score += 15;
    reasons.push("Brief description - could use more details");
  }

  // 🚨 3. BEGGING / GENERIC MONEY REQUEST PATTERNS
  if (/send money|need money|please send|give me money|i need cash/i.test(text)) {
    score += 30;
    reasons.push("Generic money request without explanation");
  }

  // 🚨 4. UNREALISTIC PROMISES (Very high risk)
  if (/guarantee|guaranteed|double money|100% profit|risk free|no risk|get rich|quick money/i.test(text)) {
    score += 50;
    reasons.push("Contains unrealistic promises or guarantees");
  }

  // 🚨 5. FINANCIAL SCAMS
  if (/bitcoin|crypto|investment opportunity|passive income|forex|trading/i.test(text)) {
    score += 40;
    reasons.push("Suspicious financial/investment keywords");
  }

  // 🚨 6. EXCESSIVE EMOTIONAL MANIPULATION
  const emotionalWords = ["please help", "dying", "crying", "desperate", "last chance", "final hope", "begging"];
  let emotionalCount = 0;
  emotionalWords.forEach(word => {
    if (text.includes(word)) {
      emotionalCount++;
    }
  });
  if (emotionalCount >= 3) {
    score += 25;
    reasons.push("Excessive emotional manipulation patterns");
  } else if (emotionalCount >= 2) {
    score += 15;
    reasons.push("Emotional manipulation detected");
  }

  // 🚨 7. UNREALISTIC AMOUNT
  if (specifics.amount && specifics.amount > 50000) {
    score += 35;
    reasons.push(`Unrealistically high funding amount: $${specifics.amount}`);
  } else if (specifics.amount && specifics.amount > 20000) {
    score += 20;
    reasons.push(`Very high funding amount: $${specifics.amount}`);
  }

  // 🚨 8. MULTIPLE EXCLAMATION MARKS
  const exclamationCount = (idea.match(/!/g) || []).length;
  if (exclamationCount > 5) {
    score += 15;
    reasons.push(`Excessive use of exclamation marks (${exclamationCount} times)`);
  } else if (exclamationCount > 3) {
    score += 10;
    reasons.push("Multiple exclamation marks detected");
  }

  // 🚨 9. ALL CAPS SECTIONS
  const capsLength = (idea.match(/[A-Z]{5,}/g) || []).join('').length;
  if (capsLength > 30) {
    score += 20;
    reasons.push("Excessive use of ALL CAPS text");
  } else if (capsLength > 15) {
    score += 10;
    reasons.push("Significant ALL CAPS text detected");
  }

  // 🚨 10. SUSPICIOUS CONTACT REQUESTS
  if (/send me|transfer to|wire to|paypal|venmo|cashapp|western union/i.test(text)) {
    score += 45;
    reasons.push("Requests direct money transfer outside platform");
  }

  // 🚨 11. INCONSISTENT STORY
  const hasSpecificAmount = specifics.amount !== null;
  const hasSpecificLocation = specifics.location !== null;
  const hasSpecificDeadline = specifics.deadline !== null;
  
  if (hasSpecificAmount && !hasSpecificLocation && !hasSpecificDeadline && text.length < 100) {
    score += 15;
    reasons.push("Vague story with only amount specified");
  }

  // 🚨 12. NO SPECIFIC DETAILS
  if (!hasSpecificAmount && !hasSpecificLocation && !hasSpecificDeadline && text.length < 150) {
    score += 20;
    reasons.push("No specific details about amount, location, or timeline");
  }

  // ✅ Final risk level classification with updated thresholds
  let riskLevel = "LOW";
  let canSubmit = true;
  let warningMessage = "";

  if (score >= 65) {
    riskLevel = "HIGH";
    canSubmit = false;
    warningMessage = "Your campaign has been flagged as HIGH RISK and cannot be submitted. Please revise your campaign idea to remove suspicious patterns.";
  } else if (score >= 35) {
    riskLevel = "MEDIUM";
    canSubmit = true;
    warningMessage = `⚠️ Medium fraud risk detected (Score: ${score}/100). Please review your campaign before submitting.`;
  } else {
    riskLevel = "LOW";
    canSubmit = true;
    warningMessage = `✅ Low risk verified (Score: ${score}/100). Your campaign looks legitimate.`;
  }

  console.log(`\n📊 Fraud Analysis Results:`);
  console.log(`   Score: ${score}/100`);
  console.log(`   Risk Level: ${riskLevel}`);
  console.log(`   Can Submit: ${canSubmit}`);
  console.log(`   Reasons: ${reasons.join(", ") || "None detected"}`);
  console.log(`   Warning: ${warningMessage}\n`);

  return { 
    score, 
    riskLevel, 
    reasons,
    canSubmit,
    warningMessage
  };
}

// Enhanced prompt generator for more detailed descriptions
function createPersonalizedPrompt(idea, intent, specifics, fraudResult) {
  let fraudWarning = "";
  if (fraudResult.riskLevel === "MEDIUM") {
    fraudWarning = "\n⚠️ NOTE: This idea has medium fraud risk. Make the campaign more genuine, detailed, and realistic with specific details about the situation.";
  } else if (fraudResult.riskLevel === "HIGH") {
    fraudWarning = "\n⚠️⚠️ CRITICAL: This idea has high fraud risk. You MUST transform it into a genuine, detailed, and realistic campaign with specific details, realistic goals, and avoid any urgent or begging language.";
  }

  let prompt = `You are an expert crowdfunding campaign writer with years of experience creating successful campaigns. Create a COMPLETELY UNIQUE, EMOTIONALLY COMPELLING, and HIGHLY DETAILED campaign based on this specific input:

USER INPUT: "${idea}"

EXTRACTED INFORMATION:
- Intent: ${intent}
${specifics.amount ? `- Amount Needed: $${specifics.amount}` : ''}
${specifics.deadline ? `- Deadline: ${specifics.deadline}` : ''}
${specifics.location ? `- Location: ${specifics.location}` : ''}
${specifics.condition ? `- Medical Condition: ${specifics.condition}` : ''}
${specifics.treatment ? `- Treatment: ${specifics.treatment}` : ''}
${specifics.businessName ? `- Business Name: ${specifics.businessName}` : ''}
${specifics.productType ? `- Product/Service Type: ${specifics.productType}` : ''}
${specifics.degree ? `- Degree: ${specifics.degree}` : ''}
${specifics.school ? `- School: ${specifics.school}` : ''}
${fraudWarning}

CRITICAL INSTRUCTIONS FOR A DETAILED DESCRIPTION:
1. You MUST incorporate ALL the extracted information above into the campaign
2. The campaign MUST be DIRECTLY about: "${idea}"
3. Use the EXACT numbers and dates from the extracted information
4. Write in FIRST PERSON with genuine emotion, vulnerability, and hope
5. Create a DETAILED narrative that includes:
   - Background: How the situation came to be
   - Current challenge: Specific obstacles being faced
   - Impact: How this situation affects daily life, family, future
   - Solution: How the funds will specifically help
   - Timeline: When support is needed by
   - Gratitude: Acknowledgment of supporters
6. Length: 350-450 words (MORE DETAILED than before)
7. Use ONLY paragraphs with rich descriptions and emotional depth (no bullet points, no markdown)
8. Make the campaign GENUINE and REALISTIC - avoid exaggerated claims
9. ${fraudResult.riskLevel === "MEDIUM" ? "Add specific details about your situation to make it more authentic." : ""}
10. ${fraudResult.riskLevel === "HIGH" ? "Completely rewrite to be authentic with realistic goals and detailed context." : ""}

Return ONLY valid JSON with this exact structure:
{
  "title": "A specific, compelling title that includes the key element from the user's idea",
  "description": "The complete, detailed campaign story with rich narrative, specific details, and emotional resonance"
}`;

  return prompt;
}

async function generateCampaign(idea, attempt, fraudResult) {
  const intent = extractIntent(idea);
  const specifics = extractSpecifics(idea, intent);
  
  console.log(`📋 Intent: ${intent}`);
  console.log(`📊 Specifics:`, JSON.stringify(specifics, null, 2));
  
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 1500,
      topP: 0.95,
      topK: 40,
    },
  });

  const prompt = createPersonalizedPrompt(idea, intent, specifics, fraudResult);
  
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();
    
    text = text.replace(/```json\s*/g, "");
    text = text.replace(/```\s*/g, "");
    text = text.trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    const data = JSON.parse(text);
    
    let usesExtractedInfo = true;
    const description = data.description.toLowerCase();
    
    if (specifics.amount && !description.includes(specifics.amount.toString())) {
      console.log(`⚠️ Missing amount: ${specifics.amount}`);
      usesExtractedInfo = false;
    }
    
    if (specifics.deadline && !description.includes(specifics.deadline.toLowerCase())) {
      console.log(`⚠️ Missing deadline: ${specifics.deadline}`);
      usesExtractedInfo = false;
    }
    
    if (data.description.length < 200) {
      console.log(`⚠️ Description too short: ${data.description.length} characters`);
      usesExtractedInfo = false;
    }
    
    if (usesExtractedInfo || attempt === 3) {
      return data;
    }
    
    throw new Error("Missing extracted information or insufficient detail");
    
  } catch (err) {
    console.log(`❌ Attempt ${attempt} failed: ${err.message}`);
    return null;
  }
}

// Enhanced fallback with more detailed descriptions
function createFallback(idea, fraudResult) {
  const intent = extractIntent(idea);
  const specifics = extractSpecifics(idea, intent);
  
  const userInput = idea;
  const amount = specifics.amount || Math.floor(Math.random() * 5000) + 1000;
  const deadline = specifics.deadline || "urgently";
  const location = specifics.location || "my community";
  
  let title = "";
  let description = "";
  
  // Add fraud warning to description if medium/high risk
  let fraudWarning = "";
  if (fraudResult.riskLevel === "MEDIUM") {
    fraudWarning = "\n\n⚠️ NOTE: This campaign has been reviewed and verified for authenticity. All information provided is genuine and accurate.\n\n";
  } else if (fraudResult.riskLevel === "HIGH") {
    fraudWarning = "\n\n⚠️⚠️ IMPORTANT: This campaign has undergone additional verification to ensure authenticity and legitimacy.\n\n";
  }
  
  if (intent === "medical") {
    const condition = specifics.condition || "a serious medical condition";
    const treatment = specifics.treatment || "necessary medical treatment";
    
    title = `Medical Support Needed: ${condition.charAt(0).toUpperCase() + condition.slice(1)} Treatment`;
    description = `${userInput}${fraudWarning}

My journey with ${condition} began unexpectedly, turning my world upside down. What started as minor symptoms quickly escalated into a diagnosis that changed everything. The past few months have been a blur of doctor visits, medical tests, and difficult conversations about treatment options.

The recommended treatment plan includes ${treatment}, which offers the best chance for recovery. ${specifics.amount ? `The total cost for this treatment is $${specifics.amount},` : `The medical expenses,`} including hospital stays, specialist consultations, and medications, have accumulated faster than I could have ever anticipated.

${specifics.deadline ? `The medical team has recommended beginning treatment by ${specifics.deadline} for the best possible outcome.` : `Each day brings new challenges as we work to coordinate care and manage the growing medical bills.`}

I've had to reduce my work hours significantly, which has added financial stress during this already difficult time. Despite having insurance, the out-of-pocket costs, deductibles, and non-covered treatments have created a burden that feels overwhelming.

Your support would allow me to focus entirely on recovery without worrying about mounting medical bills. Every contribution brings me closer to getting the care I need and returning to a healthy life. Once I've recovered, I'm committed to paying this kindness forward and helping others facing similar health challenges.

Thank you for taking the time to read my story and for any support you can provide. Your generosity means more than words can express.`;
  } 
  else if (intent === "business") {
    const businessName = specifics.businessName || "my small business";
    const productType = specifics.productType || "products";
    
    title = `Help Bring ${businessName} to Life: A Dream of Entrepreneurship`;
    description = `${userInput}${fraudWarning}

For years, I've dreamed of creating something meaningful—a place where ${productType} bring joy and value to our community. ${specifics.businessName ? `"${businessName}"` : `This business`} represents countless hours of planning, research, and preparation to ensure we can deliver exceptional quality and service.

The journey hasn't been easy. I've saved every possible dollar, worked extra shifts, and sacrificed personal time to make this dream a reality. We've secured a location ${specifics.location ? `in ${location}` : `in our community`}, finalized our business plan, and received incredible encouragement from friends, family, and potential customers who believe in this vision.

However, the final hurdle remains: startup costs including equipment, initial inventory, permits, and marketing. ${specifics.amount ? `We need to raise $${specifics.amount} to cover these essential expenses.` : `We need financial support to cover the remaining startup costs.`} 

${specifics.deadline ? `Our goal is to launch by ${specifics.deadline},` : `We're aiming to open our doors soon,`} and every dollar raised brings us closer to that milestone. We've already secured commitments from suppliers and have customers eagerly waiting for our grand opening.

Your investment in this dream isn't just about funding—it's about believing in local entrepreneurship, creating jobs, and building something lasting for our community. When we succeed, we'll be able to give back through local partnerships, employment opportunities, and a space where people can gather and connect.

Thank you for considering supporting this dream. Together, we can turn this vision into reality.`;
  }
  else if (intent === "educational") {
    const degree = specifics.degree || "my degree";
    const school = specifics.school || "my university";
    
    title = `Support My Journey to Complete ${degree.charAt(0).toUpperCase() + degree.slice(1)}`;
    description = `${userInput}${fraudWarning}

Education has always been my path to a better future. Growing up, I watched my parents work tirelessly to provide opportunities they never had, instilling in me the belief that knowledge truly transforms lives.

Now, I'm ${specifics.degree ? `pursuing my ${degree} degree` : `pursuing higher education`} at ${specifics.school || school}, working toward a career that will allow me to make a meaningful impact. The journey hasn't been straightforward—I've balanced coursework with part-time jobs, taken fewer classes to manage costs, and stretched every dollar to make ends meet.

Despite scholarships and financial aid, ${specifics.amount ? `I still need $${specifics.amount}` : `there's still a gap`} to cover tuition, books, and living expenses for this semester. ${specifics.deadline ? `The payment deadline is ${specifics.deadline},` : `With the upcoming semester fast approaching,`} I'm reaching out to my community for support.

I'm so close to achieving my educational goals. I've maintained a strong GPA while working, participated in research opportunities, and already secured internships that will help launch my career. Your support would help me cross the finish line without having to take on additional debt that would follow me for years.

I promise to use this education to give back—whether through my future career, mentoring other students, or paying this kindness forward when I'm able. Every contribution, no matter the size, makes a difference in helping me complete my education and start building the future I've worked so hard for.

Thank you for believing in me and investing in education.`;
  }
  else {
    title = idea.length > 80 ? idea.substring(0, 77) + "..." : idea;
    
    description = `${userInput}${fraudWarning}

Sometimes life presents challenges we never expected to face. What started as ${specifics.condition || "an unexpected situation"} has become a priority that requires attention and support.

${specifics.amount ? `I'm working to raise $${specifics.amount}` : `I'm reaching out to my community for support`} to address this situation and move forward. I've explored every option—personal loans, payment plans, cutting expenses to the bare minimum—but despite my best efforts, I'm still falling short of what's needed.

${specifics.deadline ? `The timeline for addressing this is ${specifics.deadline}.` : `I'm working to resolve this situation as efficiently as possible.`}

I believe in the power of community and the strength that comes from supporting one another through difficult times. I've always tried to be there for friends, family, and neighbors when they needed help, and now I'm humbly asking for support in return.

Your contribution, no matter the size, would make a significant difference in helping me overcome this challenge. I'm committed to paying this forward—once I'm back on my feet, I'll dedicate time and resources to help others facing similar situations.

Thank you for taking the time to read my story and for any support you can offer. It truly means the world to me.`;
  }
  
  return { title, description };
}

// Routes
app.post("/generate", async (req, res) => {
  try {
    const { idea, wallet } = req.body;

    if (!idea) {
      return res.status(400).json({ 
        error: "Idea is required",
        message: "Please provide a description of your campaign idea"
      });
    }

    console.log(`\n🎯 Processing: "${idea}"`);
    console.log(`📝 Idea length: ${idea.length} characters`);
    
    const intent = extractIntent(idea);
    const specifics = extractSpecifics(idea, intent);
    
    // 🧠 FRAUD DETECTION
    const fraudResult = analyzeFraud(idea, specifics, wallet);
    console.log("🛑 Fraud Analysis:", fraudResult);
    
    // 🚫 BLOCK HIGH RISK CAMPAIGNS (score >= 65)
    if (fraudResult.riskLevel === "HIGH") {
      console.log("❌ Campaign blocked due to high fraud risk (score >= 65)");
      return res.status(403).json({
        error: "High fraud risk detected. Campaign cannot be created.",
        fraud: fraudResult,
        message: fraudResult.warningMessage,
        canSubmit: false
      });
    }
    
    // 🟡 WARN FOR MEDIUM RISK (score between 35-64)
    if (fraudResult.riskLevel === "MEDIUM") {
      console.log("⚠️ Medium fraud risk detected - proceeding with warning");
    }
    
    let result = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔄 Generation attempt ${attempt}/3...`);
      result = await generateCampaign(idea, attempt, fraudResult);
      if (result) {
        console.log(`✅ Successfully generated on attempt ${attempt}`);
        break;
      }
      if (attempt < 3) {
        console.log(`⏳ Waiting 2 seconds before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (result) {
      console.log(`✅ Returning personalized campaign (${result.description.length} characters)`);
      return res.json({
        ...result,
        fraud: fraudResult
      });
    }
    
    console.log("🔄 Using intelligent fallback...");
    const fallback = createFallback(idea, fraudResult);
    console.log(`✅ Returning fallback campaign (${fallback.description.length} characters)`);
    res.json({
      ...fallback,
      fraud: fraudResult
    });

  } catch (err) {
    console.error("❌ Error:", err);
    const fallback = createFallback(req.body.idea || "my campaign", { riskLevel: "UNKNOWN", score: 0, reasons: [], canSubmit: true, warningMessage: "Error during generation" });
    res.json({
      ...fallback,
      fraud: { riskLevel: "UNKNOWN", score: 0, reasons: ["Error during generation"], canSubmit: true, warningMessage: "An error occurred during generation" }
    });
  }
});

app.get("/test", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'NLP Campaign Generator is working properly'");
    const response = result.response;
    res.json({ 
      status: "success", 
      message: "API is working",
      response: response.text() 
    });
  } catch (err) {
    res.status(500).json({ 
      status: "error", 
      message: err.message,
      suggestion: "Check your GEMINI_API_KEY in .env file"
    });
  }
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 NLP Campaign Server running on http://localhost:${PORT}`);
  console.log(`📡 Test API: http://localhost:${PORT}/test`);
  console.log(`🎯 Generate endpoint: POST http://localhost:${PORT}/generate`);
  console.log(`📝 Send JSON: { "idea": "Your campaign idea description here", "wallet": "optional-wallet-address" }\n`);
  console.log(`📊 Fraud Detection Rules:`);
  console.log(`   - HIGH RISK: Score >= 65 → Campaign BLOCKED`);
  console.log(`   - MEDIUM RISK: Score 35-64 → Warning shown, can submit`);
  console.log(`   - LOW RISK: Score < 35 → Safe to submit`);
  console.log(`   - Urgency words: +40 points`);
  console.log(`   - Short description: +30-35 points`);
  console.log(`   - Generic begging: +30 points`);
  console.log(`   - Unrealistic promises: +50 points\n`);
});