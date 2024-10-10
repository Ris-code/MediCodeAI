// Import statements
import { ChatGroq } from "@langchain/groq";
import tools from './tool.js';
import { ChatPromptTemplate, PromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AgentExecutor } from "langchain/agents";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
import { formatToOpenAIFunctionMessages } from "langchain/agents/format_scratchpad";
import { OpenAIFunctionsAgentOutputParser } from "langchain/agents/openai/output_parser";
import { RunnableSequence } from "@langchain/core/runnables";
import { Client } from "@gradio/client";
import gTTS from 'gtts';
import { prompttemplate, prompttemplateans } from "./promptTemplate.js"; // Imported the prompt template
import dotenv from 'dotenv';
dotenv.config();

// Methods to be executed on routes 
const chatresponse = async (req, res) => {
    try {
        console.log(req.body)
        const topic = req.body.topic;
        const message = req.body.message;
        const difficulty = req.body.difficulty;
        // define the large language model
        const llm = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY, 
        });

        // Wait for tools to load before continuing
        if (tools.length === 0) {
            return res.status(500).send("Tools not loaded yet. Please try again later.");
        }

        // bind tools to the agent        
        const modelWithFunctions = llm.bind({
            functions: tools.map((tool) => convertToOpenAIFunction(tool)),
        });

        // Define the agent
        const agent_function = async () => {
            try {
                const prompt = ChatPromptTemplate.fromMessages([
                    ["system", prompttemplate],
                    ["human", "{input}"],
                    new MessagesPlaceholder("agent_scratchpad"),
                  ])

                // console.log(tools);
                // console.log(prompt);

                const runnableAgent = RunnableSequence.from([
                    {
                      input: (i) => i.input,
                      agent_scratchpad: (i) =>
                        formatToOpenAIFunctionMessages(i.steps),
                    },
                    prompt,
                    modelWithFunctions,
                    new OpenAIFunctionsAgentOutputParser(),
                  ]);
                  
                  const executor = AgentExecutor.fromAgentAndTools({
                    agent: runnableAgent,
                    tools,
                  });

                  return executor;
            } catch (e) {
                console.log("Error in agent_function:", e);
                throw e;
            }
        };
        const agent = await agent_function();

        
        const input = `Topics: ${topic}, Concept: ${message}, Difficulty: ${difficulty}`;
        console.log(`Calling agent executor with query: ${input}`);

        const result = await agent.invoke({
            input,
        });

        console.log(result);
    
        // res.status(200).send(result.output);
        res.json({result: result.output});
        // text2speech(result.output);

    } catch (e) {
        console.error("Error during chatresponse execution: ", e);
        res.status(500).send("An error occurred.");
    }
};


const test = async (req, res) => {
    const client = await Client.connect("mrfakename/MeloTTS");
    const result = await client.predict("/synthesize", { 		
            text: "Hello!!", 		
            speaker: "EN-US", 		
            speed: 0.1, 		
            language: "EN", 
    });

    console.log(result.data);
};


const text2speech = async (req, res) => {
    const { text } = req.body;
    const gtts = new gTTS(text, 'en');
  
    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
  
    // Pipe the audio stream directly to the response
    gtts.stream().pipe(res);
};

const llm_answer = async (question, user_answer) => {
    try {
        const input = "question: " + question + " user_answer: " + user_answer;
        // console.log(input)

        const llm = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY, 
        });

        // Wait for tools to load before continuing
        if (tools.length === 0) {
            return res.status(500).send("Tools not loaded yet. Please try again later.");
        }

        // bind tools to the agent        
        const modelWithFunctions = llm.bind({
            functions: tools.map((tool) => convertToOpenAIFunction(tool)),
        });

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", prompttemplateans],
            ["human",  `question: ${question} user_answer: ${user_answer}`],
            new MessagesPlaceholder("agent_scratchpad"),
          ])

        // console.log(tools);
        // console.log(prompt);

        const runnableAgent = RunnableSequence.from([
            {
              input: (i) => i.input,
              agent_scratchpad: (i) =>
                formatToOpenAIFunctionMessages(i.steps),
            },
            prompt,
            modelWithFunctions,
            new OpenAIFunctionsAgentOutputParser(),
          ]);
          
          const executor = AgentExecutor.fromAgentAndTools({
            agent: runnableAgent,
            tools,
          });

          const result = await executor.invoke({
            input,
          });

          return result.output;
    } catch (e) {
        console.error("Error during llm_answer execution: ", e);
        res.status(500).send("An error occurred.");
    }
};

const evaluate_answer = async (req, res) => {
    try {
        // console.log("response", req.body);
        const { question, user_answer } = req.body;
        const evaluation_metric = await llm_answer(question, user_answer);

        // Evaluate the answer
        res.status(200).send(evaluation_metric);
    } catch (e) {
        console.error("Error during evaluate_answer execution: ", e);
        res.status(500).send("An error occurred.");
    }
};
// Export of all methods as object 
export {
    chatresponse,
    test,
    evaluate_answer,
    text2speech,
};
