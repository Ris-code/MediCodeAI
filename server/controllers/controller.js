const { ChatGroq } = require("@langchain/groq");
const { HumanMessage } = require("@langchain/core/messages");
const { tools } = require('./tool.js');
const { ChatPromptTemplate, PromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { AgentExecutor, createReactAgent,  createOpenAIFunctionsAgent, ChatConversationalAgent } = require("langchain/agents");
const { convertToOpenAIFunction } = require("@langchain/core/utils/function_calling");
const { formatToOpenAIFunctionMessages } = require("langchain/agents/format_scratchpad");
const { OpenAIFunctionsAgentOutputParser } = require("langchain/agents/openai/output_parser");
const { RunnableSequence } = require("@langchain/core/runnables");
const { pull } = require("langchain/hub");
const prompttemplate = require("./promptTemplate.js") // contains the prompt template tpo guide the llm

require('dotenv').config();


// Methods to be executed on routes 
const chatresponse = async (req, res) => {
    try {
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

                console.log(tools);
                console.log(prompt);

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

        
        const input = "what is anatomy?";
        console.log(`Calling agent executor with query: ${input}`);

        const result = await agent.invoke({
            input,
        });

        console.log(result);
        res.status(200).send(result.output);

    } catch (e) {
        console.error("Error during chatresponse execution: ", e);
        res.status(500).send("An error occurred.");
    }
};
 
// Export of all methods as object 
module.exports = {
    chatresponse,
};
