import React, { useState } from 'react';
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Type } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MedicalQALayout() {
  const [inputMethod, setInputMethod] = useState('text');
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState('');

  const handleRecordToggle = () => {
    setIsRecording(!isRecording);
  };

  const navitems = [
    {
      "name": "Home",
      "link": "/",
      "icon": "HomeIcon"
    },
    {
      "name": "About",
      "link": "/about",
      "icon": "UserIcon"
    },
    {
      "name": "Problem",
      "link": "/questions",
      "icon": "MailIcon"
    }
  ];

  return (
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
                className="w-full h-full min-h-[400px] p-4 rounded-md bg-gray-800 text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your medical case study response here..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
            </ScrollArea>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center space-y-4">
              <Button 
                size="lg" 
                className={`rounded-full p-8 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                onClick={handleRecordToggle}
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
              {isRecording && (
                <Alert variant="default" className="mt-4 bg-gray-800 border-gray-700">
                  <AlertDescription className="text-gray-200">
                    Recording in progress... Speak clearly into your microphone.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <Button className="w-32 bg-blue-500 hover:bg-blue-600 text-white">
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
        {/* Upper Right with Tabs */}
        <div className="h-1/2 p-6">
          <Tabs defaultValue="question" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
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
            <TabsContent value="question" className="flex-grow">
              <Card className="p-4 h-[calc(100%-2rem)] bg-gray-900 border-gray-800">
                <ScrollArea className="h-full">
                  <h3 className="font-semibold mb-2 text-white">Case Study Question:</h3>
                  <p className="text-sm text-gray-300">
                    A 45-year-old male presents with severe chest pain radiating to the left arm, 
                    shortness of breath, and profuse sweating for the last 2 hours. He has a history 
                    of hypertension and type 2 diabetes. Vital signs show BP 160/100 mmHg, HR 110/min, 
                    RR 24/min, and SpO2 94% on room air.
                  </p>
                  <p className="mt-4 font-semibold text-white">Please address the following:</p>
                  <ol className="list-decimal ml-4 mt-2 text-sm text-gray-300">
                    <li>What is your initial diagnosis?</li>
                    <li>List three differential diagnoses</li>
                    <li>What immediate steps would you take?</li>
                    <li>What investigations would you order?</li>
                  </ol>
                </ScrollArea>
              </Card>
            </TabsContent>
            <TabsContent value="evaluation" className="flex-grow">
              <Card className="p-4 h-[calc(100%-2rem)] bg-gray-900 border-gray-800">
                <ScrollArea className="h-full">
                  <h3 className="font-semibold mb-2 text-white">Evaluation Results:</h3>
                  <p className="text-sm text-gray-300">
                    Your evaluation results will appear here after submission...
                  </p>
                </ScrollArea>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Horizontal Separator */}
        <Separator className="my-1 bg-gray-800" />

        {/* Lower Right - Avatar and Audio Section */}
        <div className="h-1/2 p-6 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src="/api/placeholder/400/400" alt="AI Assistant" />
              <AvatarFallback className="bg-gray-800 text-white">AI</AvatarFallback>
            </Avatar>
            <div className="relative">
              <div className="absolute -top-1 -right-1 h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              <Mic className="h-12 w-12 text-blue-400" />
            </div>
            <p className="text-sm text-gray-300">AI Assistant Speaking...</p>
          </div>
        </div>
      </div>
    </div>
  );
}