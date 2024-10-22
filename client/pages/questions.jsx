import React, { useState, useRef, useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Type, Play, Pause, RotateCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Toggle } from "@/components/ui/toggle";
import Spinner from '@/components/spinner';
import Form from '@/components/form';
import AudioPlayer from '@/components/audio';
import EvaluationOutput from '@/components/evaluate';

const URL = "https://medi-code-ai.vercel.app"
// const URL = "https://localhost:5000"

export default function MedicalQALayout() {
  const [inputMethod, setInputMethod] = useState('text');
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [form, setForm] = useState(true);
  const [result, setResult] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [color, setColor] = useState("gray");
  const audioRef = useRef(null);
  const [spinner, setSpinner] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
        const recognitionInstance = new webkitSpeechRecognition();
        recognitionInstance.continuous = false; // Set to true for continuous recognition
        recognitionInstance.interimResults = false; // Set to true to receive interim results
        recognitionInstance.lang = 'en-US'; // Set the language

        // Event Handlers
        recognitionInstance.onresult = (event) => {
            const recognizedText = event.results[0][0].transcript;
            setVoiceText(voiceText + ' ' + recognizedText);
            console.log('Recognized Text:', recognizedText);
            setTranscript(recognizedText);
        };
        
        recognitionInstance.onerror = (event) => {
            console.error('Speech recognition error detected: ', event.error);
        };

        recognitionInstance.onend = () => {
            console.log('Speech recognition service disconnected');
            // setIsListening(false);
        };

        setRecognition(recognitionInstance);
    } else {
        alert("Sorry, your browser doesn't support speech recognition.");
    }
  }, []);

  // Function to play or pause the audio
  const handleAudioPlayPause = () => {
    console.log(audioRef.current)
    if (audioRef.current) {
      if (isPlaying) {
        console.log("pause")
        setColor("blue");
        audioRef.current.pause();
      } else {
        console.log("play")

        console.log("Audio Source:", audioRef.current.src);
        console.log("Current Time:", audioRef.current.currentTime);
        console.log("Duration:", audioRef.current.duration);

        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Function to check if audio is ready
  const handleCanPlay = () => {
    console.log("Audio is ready to play");
    console.log()
  };

  // Function to handle audio loading error
  const handleAudioError = () => {
    console.error("Error loading audio");
  };

  const VoiceAssistant = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src="https://cdn.prod.website-files.com/6618a0ff31d39d3787770851/6618a0ff31d39d3787770db2_human-img2.png" alt="AI Assistant" />
        {/* <AvatarFallback className="bg-gray-800 text-white">AI</AvatarFallback> */}
      </Avatar>
      
      <AudioPlayer/>

    </div>
  );

  const startListening = () => {
    if (recognition) {
        recognition.start();
        // setIsListening(true);
        console.log('Voice recognition started. Try speaking into the microphone.');
    }
  };

  const stopListening = () => {
      if (recognition) {
          recognition.stop();
          console.log('Voice recognition stopped.');
      }
  };

  const handleSubmit = async () => {
    console.log("submitted");
    console.log(voiceMode)

    const text = async () => {
      if(inputMethod==='voice'){
        const newtext = await voiceText
        console.log(newtext)
        return newtext
      }else{
        const newtext = responseText
        return newtext
      }
    }
    const text_input = await text()
    console.log(text_input)
    // const URL = 'http://localhost:8080'
    // const URL = 'https://medi-code-ai.vercel.app'
    fetch(URL + '/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question: result.result,
        user_answer: text_input }),
    })
      .then((response) => response.json())
      .then((data) => {
        // console.log('Success:', data.data);
        // console.log(typeof data)
        // console.log(typeof data.data)

        // const jsonres = JSON.stringify(data.data)
        // const parsedData = JSON.parse(jsonres);
        // console.log(typeof parsedData)
        // console.log(typeof data)
        // console.log(data)
        // console.log("data:", data.data)
        // console.log(data.data?.quantitative_scores)
        setEvaluation(data.data);
        console.log(typeof evaluation)
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
  return (form ? (
    <div className='mt-20'>
      {spinner && <Spinner />}
      <Form status={setForm} output={setResult} spinner={setSpinner}/>
    </div> 
  ) : (
    <div className="h-screen flex bg-gray-950 text-gray-100">
      {/* Left Section */}
      <div className="w-1/2 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Your Response</h2>
          <div className="flex space-x-2">
            <Button 
              variant={inputMethod === 'text' ? 'default' : 'secondary'}
              onClick={() => setInputMethod('text')}
              className="w-32 bg-gray-800 hover:bg-gray-700 text-white"
            >
              <Type className="mr-2 h-4 w-4" />
              Type
            </Button>
            <Button 
              variant={inputMethod === 'voice' ? 'default' : 'secondary'}
              onClick={() => setInputMethod('voice')}
              className="w-32 bg-gray-800 hover:bg-gray-700 text-white"
            >
              <Mic className="mr-2 h-4 w-4" />
              Voice
            </Button>
          </div>
        </div>

        <Card className="flex-grow flex flex-col p-4 bg-gray-900 border-gray-800">
          {inputMethod === 'text' ? (
            <ScrollArea className="flex-grow">
              <textarea 
                className="w-full h-full min-h-[400px] p-4 rounded-md bg-gray-800 text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="Write your medical case study response here..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
            </ScrollArea>
          ) : (
            <div className="flex-grow flex-col items-center justify-center space-y-4">
              <div className='flex flex-col items-center flex-grow space-y-4'>
              <Button 
                size="lg" 
                className={`rounded-full p-8 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                onClick={() => {
                  setIsRecording(!isRecording)
                  if(isRecording){
                    stopListening()
                  }else{
                    startListening()
                  }
                }}
              >
                {isRecording ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
              <p className="text-gray-300">
                {isRecording ? 'Click to stop recording' : 'Click to start recording'}
              </p>
              </div>
              {isRecording && (
                <Alert variant="default" className="mt-4 bg-gray-800 border-gray-700">
                  <AlertDescription className="text-gray-200">
                    Recording in progress... Speak clearly into your microphone.
                  </AlertDescription>
                </Alert>
              )}
              {
                (
                  <div>
                  <ScrollArea className="flex-grow">
                    <textarea 
                      className="w-full h-full min-h-[400px] p-4 rounded-md bg-gray-800 text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder=""
                      value={voiceText}
                      onChange={(e) => setVoiceText(e.target.value)}
                    />
                  </ScrollArea>
                  </div>
                )
              }
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <Button className="w-32 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSubmit}>
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </div>
        </Card>
      </div>

      {/* Vertical Separator */}
      <Separator orientation="vertical" className="mx-1 bg-gray-800" />

      {/* Right Section */}
      <div className="w-1/2 flex flex-col">
        <div className="h-full p-6">
          <Tabs defaultValue="question" className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="grid w-2/3 grid-cols-2 bg-gray-800">
                <TabsTrigger 
                  value="question"
                  className="data-[state=active]:bg-gray-300 text-white"
                >
                  Question
                </TabsTrigger>
                <TabsTrigger 
                  value="evaluation"
                  className="data-[state=active]:bg-gray-300 text-gray-200"
                >
                  Evaluation
                </TabsTrigger>
              </TabsList>
              <Toggle
                aria-label="Toggle voice assistant"
                className="bg-gray-800"
                pressed={voiceMode}
                onPressedChange={setVoiceMode}
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice Assistant
              </Toggle>
            </div>
            
            <TabsContent value="question" className="flex-grow">
              <Card className="p-4 h-full bg-gray-900 border-gray-800">
                <ScrollArea className="h-full">
                  {voiceMode ? (
                    <VoiceAssistant />
                  ) : (
                    <>
                      <h3 className="font-semibold mb-2 text-white">Case Study Question:</h3>
                      {result.result && result.result.split('\n').map((line, index) => (
                        <p key={index} className="text-lg text-gray-300">
                          {line}
                        </p>
                      ))}
                    </>
                  )}
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="evaluation" className="flex-grow">
              <Card className="p-4 h-full bg-gray-900 border-gray-800">
                <ScrollArea className="h-full">
                  <h3 className="font-semibold mb-2 text-white">Evaluation Results:</h3>
                  {/* <p className="text-sm text-gray-300">
                    {evaluation}
                  </p> */}
                  <EvaluationOutput data={evaluation}/>
                </ScrollArea>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  ));
}
