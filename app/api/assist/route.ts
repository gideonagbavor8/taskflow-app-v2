import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
    try {
        // 1. Get the API Key safely from the environment
        const apiKey = process.env.GEMINI_API_KEY
        console.log("AI Route: Received request. API Key exists?", !!apiKey)

        if (!apiKey) {
            console.error("AI Route Error: GEMINI_API_KEY is missing")
            return NextResponse.json(
                { error: 'Missing GEMINI_API_KEY in server environment' },
                { status: 500 }
            )
        }

        // 2. Initialize the Gemini Model
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) // Switched to flash (faster/newer)

        // 3. Parse the user's request
        const body = await req.json()
        const { intent, taskInput } = body
        console.log("AI Route: Processing intent:", intent)

        let prompt = ''

        // 4. Construct the prompt based on what the user wants (intent)
        if (intent === 'enhance') {
            prompt = `
        You are a helpful task assistant. 
        The user wrote this rough task: "${taskInput}".
        
        Please generate a JSON response with:
        - A professional, clear "title"
        - A short, helpful "description" (max 2 sentences)
        - A recommended "priority" (LOW, MEDIUM, or HIGH) based on the urgency/context.
        
        Return ONLY valid JSON.
      `
        } else {
            return NextResponse.json({ error: 'Invalid intent' }, { status: 400 })
        }

        // 5. Ask Gemini
        console.log("AI Route: Sending prompt to Gemini...")
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        console.log("AI Route: Received response from Gemini")

        // 6. Clean and parse the JSON result from AI
        // Sometimes AI adds markdown code blocks (```json), so we clean it.
        const cleanJson = text.replace(/```json|```/g, '').trim()
        const data = JSON.parse(cleanJson)

        return NextResponse.json({ success: true, data })

    } catch (error: any) {
        console.error('AI Route Critical Failure:', error)
        return NextResponse.json(
            { error: 'Failed to process AI request', details: error.message },
            { status: 500 }
        )
    }
}
