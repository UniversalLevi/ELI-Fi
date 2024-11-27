const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

const app = express();
const port = 3000;

// In-memory context storage for each user
const userContext = {}; // Stores context per user

// Use body-parser middleware to handle JSON requests
app.use(bodyParser.json());

// Route to handle POST requests from the frontend
app.get('/ollama', async (req, res) => {
    const userMessage = req.query.message;
    const userId = req.query.userId || 'defaultUser'; // Assuming a userId is sent from the frontend
        // Set necessary headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // Flush headers to establish SSE connection

    // Initialize or retrieve the user's context
    if (!userContext[userId]) {
        userContext[userId] = []; // Create a new context if ~one doesn't exist
    }

    // Append the user's message to their context
    userContext[userId].push({
        role: 'user',
        content: userMessage
    });

    try {
        // Prepare the prompt with the entire conversation context
        const contextMessages = userContext[userId].map(msg => `<|start_header_id|>${msg.role}<|end_header_id|>${msg.content}`).join(' ');

        const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|> 
        You are an AI-powered career advisor designed to help students explore and navigate
        various career pathways based on their academic major, interests, skills, and personal 
        preferences. Your goal is to provide accurate, informative, and practical guidance to 
        students, enabling them to make informed decisions about their future careers. You 
        should ask questions to understand their background, interests, and skills. Use this 
        information to suggest relevant career paths, industries, job roles, and educational 
        resources. Additionally, you should provide tips on required skills, potential salary 
        ranges, work-life balance, and possible career growth for each recommendation. 
        Be encouraging, empathetic, and supportive, always offering constructive advice tailored 
        to each student's unique situation.
        <|eot_id|>${contextMessages}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;

        const response = await axios.post(OLLAMA_API_URL, {
            model: "llama3.1",
            prompt: prompt // Send the conversation history as the prompt
        }, {
            responseType: 'stream'
        });

        let completeResponse = "";
        
        // Listen to data chunks as they arrive
        response.data.on('data', (chunk) => {
            const jsonString = chunk.toString();
            try {
                console.log(jsonString)
                const parsedChunk = JSON.parse(jsonString);
                res.write(`data: ${parsedChunk.response.replace(/\n/g, '<br>')}\n\n`)
                if (parsedChunk.done) {
                    console.log('Final Response:', completeResponse);
                }
            } catch (error) {
                console.error('Error parsing chunk:', error.message);
            }
        });

        // Handle end of stream
        response.data.on('end', () => {
            console.log('Stream completed. Full response:', completeResponse);

            // Append the bot's response to the context
            userContext[userId].push({
                role: 'assistant',
                content: completeResponse
            });

            res.write(`data: END OF STREAM\n\n`)
        });

    } catch (error) {
        console.log('Error in Ollama request:', error);
        res.status(500).send('Error in Ollama request');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Ollama backend running at http://localhost:${port}`);
});
