// Import statements
import { ChatGroq } from "@langchain/groq";
import tools from './tool.js';
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AgentExecutor } from "langchain/agents";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
import { formatToOpenAIFunctionMessages } from "langchain/agents/format_scratchpad";
import { OpenAIFunctionsAgentOutputParser } from "langchain/agents/openai/output_parser";
import { RunnableSequence } from "@langchain/core/runnables";
import gTTS from 'gtts';
import fs from 'fs';
import path from 'path';
import { prompttemplate } from "./promptTemplate.js"; // Imported the prompt template
import dotenv from 'dotenv';
dotenv.config();
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { JsonOutputParser } from "@langchain/core/output_parsers";
import multer from 'multer';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
console.log(__filename)
const __dirname = dirname(__filename);

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Function to check if the file exists in S3
const checkFileExistsInS3 = async (fileName) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
    });
    await s3.send(command);
    return true; // File exists
  } catch (err) {
    if (err.name === 'NotFound') {
      return false; // File does not exist
    }
    console.error('Error checking if file exists:', err);
    throw err;
  }
};

// Function to delete a file from S3
const deleteFileFromS3 = async (fileName) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
    });
    await s3.send(command);
    console.log(`File ${fileName} deleted from S3.`);
  } catch (err) {
    console.error('Error deleting file from S3:', err);
    throw err;
  }
};

// Function to upload a file to S3
const uploadToS3 = async (fileContent, fileName, fileType) => {
  try {
    // Check if the file already exists
    const fileExists = await checkFileExistsInS3(fileName);

    if (fileExists) {
      console.log(`File ${fileName} already exists. Deleting...`);
      await deleteFileFromS3(fileName);
    }

    // Upload the new file
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME, // Set your S3 bucket name in the .env file
      Key: fileName, // Name of the file to be saved in the S3 bucket
      Body: fileContent, // File content buffer
      ContentType: fileType, // MIME type (e.g., application/pdf)
      ACL: 'public-read', // Optional: Make the file publicly accessible
    });

    const data = await s3.send(command);
    console.log(`File uploaded successfully. S3 data:`, data);
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`; // Public URL of the uploaded file
  } catch (err) {
    console.error("Error uploading file to S3:", err);
    throw err;
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      // Store files in 'public/uploads' directory
    const uploadPath = process.env.VERCEL ? '/tmp' : 'public/';
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
      // Create unique filename with timestamp
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
  const pdfPath = process.env.VERCEL ? '/tmp/uploaded_file.pdf' : 'public/uploaded_file.pdf';

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

      const topic = req.body.topic;
      const message = req.body.message;
      const difficulty = req.body.difficulty;
      const pdfFile = req.file;  // Access uploaded PDF file

      // Check if file is uploaded
      if (pdfFile) {
        const retrieverTool = await retriever(topic, message);
        tools.push(retrieverTool);
      } else {
        console.log("No PDF file uploaded");
      }

      // Existing logic for handling LLM operations continues here...
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
      const result = await agent.invoke({ input });
      console.log(result);

      // Call text-to-speech conversion
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
  const mp3FilePath = process.env.VERCEL ? '/tmp/voice.mp3' : path.join(__dirname, '..', 'public', 'voice.mp3'); // Change 'output.mp3' to your desired file name

  // Save the audio locally before upload
  gtts.save(mp3FilePath, async (err) => {
    if (err) {
      console.error('Error saving audio file:', err);
      return;
    }
    console.log(`Audio saved to ${mp3FilePath}`);

    // Upload the audio file to S3
    const mp3FileBuffer = fs.readFileSync(mp3FilePath);
    const audioFileName = 'voice.mp3';
    
    try {
      const audioFileUrl = await uploadToS3(mp3FileBuffer, audioFileName, 'audio/mpeg');
      console.log(`Audio uploaded successfully. URL: ${audioFileUrl}`);
    } catch (err) {
      console.error('Error uploading audio to S3:', err);
    }
  });
};


const llm_answer = async (question, user_answer) => {
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
