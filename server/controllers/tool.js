const { SerpAPILoader } = require("@langchain/community/document_loaders/web/serpapi");
const { TavilySearchResults } = require("@langchain/community/tools/tavily_search");

require('dotenv').config();

// const serpapiKey = process.env.SERPAPI_API_KEY;

let tools = [];
// const loader = new SerpAPILoader({apiKey: serpapiKey, engine: "google", hl: "en", gl: "us", num: 2});
// const docs = async () => { 
//     try{
//         await loader.load()
//         tools.push(docs)
//     }
//     catch(e){
//         console.log(e)
//     }
// };

// docs()


const searchTool = new TavilySearchResults();
tools.push(searchTool);

module.exports = {
    tools,
}