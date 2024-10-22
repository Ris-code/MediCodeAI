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
import fs from 'fs';
import path from 'path';
import { prompttemplate, prompttemplateans } from "./promptTemplate.js"; // Imported the prompt template
import dotenv from 'dotenv';
dotenv.config();
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { JsonOutputParser } from "@langchain/core/output_parsers";
import multer from 'multer';
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { pull } from "langchain/hub";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
console.log(__filename)
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      // Store files in 'public/uploads' directory
      cb(null, 'public/');
  },
  filename: function (req, file, cb) {
      // Create unique filename with timestamp
      // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      // cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      cb(null, "uploaded_file.pdf");
  }
});

// Create upload middleware
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
      // Accept only PDF files
      if (file.mimetype === 'application/pdf') {
          cb(null, true);
      } else {
          cb(new Error('Only PDF files are allowed!'), false);
      }
  }
});

const retriever = async (topic, message) => {
  // const loader = new CheerioWebBaseLoader(
  //     "http://localhost:5000/uploads/uploaded_file.pdf"
  // );
   // Check if file exists
   const pdfPath = 'public/uploaded_file.pdf';
  //  if (!fs.existsSync(pdfPath)) {
  //      throw new Error('PDF file not found');
  //  }

   // Use PDFLoader instead of CheerioWebBaseLoader
   const loader = new PDFLoader(pdfPath, {
       splitPages: false // Set to true if you want to split by pages
   });
   
   const docs = await loader.load();
   
   // Check if documents were loaded
   if (!docs || docs.length === 0) {
       throw new Error('No content extracted from PDF');
   }

   console.log('Document loaded successfully:', docs[0].pageContent.substring(0, 100)); // Log first 100 chars

  // const docs = await loader.load();
  // console.log(docs);
  const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
  });
  const splitDocs = await splitter.splitDocuments(docs);
  // const embeddings = new OpenAIEmbeddings({
  //     openAIApiKey: process.env.OPENAI_API_KEY,
  // });
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACEHUB_API_KEY, // In Node.js defaults to process.env.HUGGINGFACEHUB_API_KEY
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      embeddings
  );
  const retriever = vectorStore.asRetriever();

  const retrieverTool = tool(
    async ({ input }, config) => {
      const docs = await retriever.invoke(input, config);
      return docs.map((doc) => doc.pageContent).join("\n\n");
    },
    {
      name: "user_asked_message",
      description:
        `Search for the required ${topic} and ${message} asked by the user`,
      schema: z.object({
        input: z.string(),
      }),
    }
  );
  return retrieverTool;
}
// Modify your chatresponse function to handle file upload
const chatresponse = async (req, res) => {
  try {
      // Upload the PDF file
      upload.single('file')(req, res, async function (err) {
          if (err) {
              console.error('Error uploading file:', err);
              return res.status(400).send('Error uploading PDF. Only PDFs are allowed.');
          }

          console.log(req.body);
          const topic = req.body.topic;
          const message = req.body.message;
          const difficulty = req.body.difficulty;
          const pdfFile = req.file;  // Access uploaded PDF file

          // Check if file is uploaded
          if (!pdfFile) {
              console.log("No PDF file uploaded");
          }

          // console.log(`PDF File uploaded successfully: ${pdfFile.filename}`);

          // Use your existing logic after the file is uploaded
          const llm = new ChatGroq({
              apiKey: process.env.GROQ_API_KEY,
          });

          if (tools.length === 0) {
              return res.status(500).send("Tools not loaded yet. Please try again later.");
          }

          const modelWithFunctions = llm.bind({
              functions: tools.map((tool) => convertToOpenAIFunction(tool)),
          });

          const agent_function = async () => {
              try {
                  const prompt = ChatPromptTemplate.fromMessages([
                      ["system", prompttemplate],
                      ["human", "{input}"],
                      new MessagesPlaceholder("agent_scratchpad"),
                  ]);
                  
                  if(pdfFile) {
                    const retrieverTool = await retriever(topic, message)
                    tools.push(retrieverTool)
                  }

                  const runnableAgent = RunnableSequence.from([
                      {
                          input: (i) => i.input,
                          agent_scratchpad: (i) => formatToOpenAIFunctionMessages(i.steps),
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

          await text2speech(result.output);
          console.log("done");

          res.json({ result: result.output });
      });
  } catch (e) {
      console.error("Error during chatresponse execution: ", e);
      res.status(500).send("An error occurred.");
  }
};


const test = async (req, res) => {
    res.status(200).send("Hello World");
};


const text2speech = async (text) => {
    const gtts = new gTTS(text, 'en');
    console.log(__dirname)
    // Define the path where the MP3 will be saved
    const mp3FilePath = path.join(__dirname, '..', 'public', 'voice.mp3'); // Change 'output.mp3' to your desired file name

    // Save the audio to the specified path
    gtts.save(mp3FilePath, (err) => {
        if (err) {
            console.error('Error saving audio file:', err);
        }
        console.log(`Audio saved to ${mp3FilePath}`);
    });
};


const llm_answer = async (question, user_answer) => {
    try {
        // const input = "question: " + question + " user_answer: " + user_answer;
        // // console.log(input)

        const model = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY, 
        });

        // // Wait for tools to load before continuing
        // if (tools.length === 0) {
        //     return res.status(500).send("Tools not loaded yet. Please try again later.");
        // }

        // // bind tools to the agent        
        // const modelWithFunctions = llm.bind({
        //     functions: tools.map((tool) => convertToOpenAIFunction(tool)),
        // });

        // const prompt = ChatPromptTemplate.fromMessages([
        //     ["system", prompttemplateans],
        //     ["human",  `question: ${question} user_answer: ${user_answer}`],
        //     new MessagesPlaceholder("agent_scratchpad"),
        //   ])

        // // console.log(tools);
        // // console.log(prompt);

        // const runnableAgent = RunnableSequence.from([
        //     {
        //       input: (i) => i.input,
        //       agent_scratchpad: (i) =>
        //         formatToOpenAIFunctionMessages(i.steps),
        //     },
        //     prompt,
        //     modelWithFunctions,
        //     new OpenAIFunctionsAgentOutputParser(),
        //   ]);
          
        //   const executor = AgentExecutor.fromAgentAndTools({
        //     agent: runnableAgent,
        //     tools,
        //   });

        //   const result = await executor.invoke({
        //     input,
        //   });

        //   return result.output;

        const query = `Evaluate the user's clinical case answer.
                        Question: ${question} user_answer: ${user_answer}`;
        const formatInstructions = `
        Respond with a valid JSON object, containing:
        {
        "quantitative_scores": {
            "clinical_accuracy": number,
            "comprehensiveness": number,
            "clinical_reasoning": number,
            "overall_score": number
        },
        "qualitative_analysis": {
            "strengths": [],
            "areas_for_improvement": [],
            "critical_discrepancies": [
            {
                "discrepancy": string,
                "significance": string
            }
            ]
        },
        "performance_metrics": {
            "grade": string,
            "knowledge_application": string,
            "critical_thinking": string,
            "patient_safety": string
        },
        "educational_feedback": {
            "incorrect_responses": [
            {
                "question": string,
                "feedback": string
            }
            ],
            "recommended_resources": [],
            "clinical_pearls": []
        }
        }`;

        // Set up the JSON parser
        const parser = new JsonOutputParser();

        // Create the prompt template
        const prompt = ChatPromptTemplate.fromTemplate(`
        Answer the user query using the format below:
        {format_instructions}

        {query}
        `);

        const partialedPrompt = await prompt.partial({
            format_instructions: formatInstructions,
          });
      
          // Pipe the prompt through the model and parse the response
        const chain = partialedPrompt.pipe(model).pipe(parser);
      
          // Invoke the chain with the query
        const evaluationResult = await chain.invoke({ query });
      
        console.log("Parsed Evaluation Result:", evaluationResult);
        return evaluationResult;

    } catch (e) {
        console.error("Error during llm_answer execution: ", e);
        res.status(500).send("An error occurred.");
    }
};

const llm_answer_new = async (question, user_answer) => {
    try {
      const model = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
      });
  
      const query = `Evaluate the user's clinical case answer.
                    Question: ${question} user_answer: ${user_answer}`;
  
      const formatInstructions = `
      Respond with a valid JSON object, containing:
      {
        "quantitative_scores": {
          "clinical_accuracy": number,
          "comprehensiveness": number,
          "clinical_reasoning": number,
          "overall_score": number
        },
        "qualitative_analysis": {
          "strengths": [],
          "areas_for_improvement": [],
          "critical_discrepancies": [
            {
              "discrepancy": string,
              "significance": string
            }
          ]
        },
        "performance_metrics": {
          "grade": string,
          "knowledge_application": string,
          "critical_thinking": string,
          "patient_safety": string
        },
        "educational_feedback": {
          "incorrect_responses": [
            {
              "question": string,
              "feedback": string
            }
          ],
          "recommended_resources": [],
          "clinical_pearls": []
        }
      }`;
  
      // Set up the JSON parser
      const parser = new JsonOutputParser();
  
      // Create the prompt template
      const prompt = ChatPromptTemplate.fromTemplate(`
        Answer the user query using the format below:
        {format_instructions}
        {query}
      `);
  
      const partialedPrompt = await prompt.partial({
        format_instructions: formatInstructions,
      });
  
      // Pipe the prompt through the model and parse the response
      const chain = partialedPrompt.pipe(model).pipe(parser);
  
      // Invoke the chain with the query
      const evaluationResult = await chain.invoke({ query });
  
      console.log(evaluationResult);
      return evaluationResult;
    } catch (e) {
      console.error("Error during llm_answer execution: ", e);
      throw new Error("Failed to process the LLM response.");
    }
  };
  
  const evaluate_answer = async (req, res) => {
    try {
      console.log("response", req.body);
      const { question, user_answer } = req.body;
      const evaluation_metric = await llm_answer_new(question, user_answer);
  
    //   console.log("Evaluation metric:", evaluation_metric);
      console.log(typeof evaluation_metric);
      res.json({data: evaluation_metric});
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
