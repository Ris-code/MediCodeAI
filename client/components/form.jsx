import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import dotenv from 'dotenv';
dotenv.config();
// console.log(URL);

const Form = ({status}) => {
  const [formData, setFormData] = useState({
    topic: "",
    message: "",
    difficulty: "easy",  // default value for difficulty
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRadioChange = (value) => {
    setFormData({ ...formData, difficulty: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    status(false);
    console.log("Form Data:", formData); 

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    // const URL = process.env.URL;
    const URL = "http://localhost:8080"
    console.log("URL:", URL);
    const request1 = new Request(URL+"/", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: myHeaders,
    });

    const response1 = await fetch(request1);
    console.log(response1);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-semibold text-white mb-6 text-center">Get Questions</h2>
      <form onSubmit={handleSubmit}>
        {/* Topic Field */}
        <div className="mb-6">
          <Label htmlFor="topic" className="text-gray-200">
            Topics
          </Label>
          <Input
            id="topic"
            name="topic"
            type="text"
            placeholder="Enter your topics"
            value={formData.topic}
            onChange={handleInputChange}
            className="mt-1 bg-gray-800 text-white placeholder-gray-400"
          />
        </div>

        {/* Message Field */}
        <div className="mb-6">
          <Label htmlFor="message" className="text-gray-200">
            Question Type and Concept
          </Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Enter your message"
            value={formData.message}
            onChange={handleInputChange}
            className="mt-1 bg-gray-800 text-white placeholder-gray-400"
          />
        </div>

        {/* Difficulty Field */}
        <div className="mb-6">
          <Label className="text-gray-200">Difficulty</Label>
          <RadioGroup
            value={formData.difficulty}
            onValueChange={handleRadioChange}
            className="mt-2 flex space-x-4"
          >
            <div className="flex items-center space-x-2 text-white">
              <RadioGroupItem value="easy" id="easy" className="text-white border-white" />
              <Label htmlFor="easy" className="text-gray-200">Easy</Label>
            </div>
            <div className="flex items-center space-x-2 text-white">
              <RadioGroupItem value="medium" id="medium" className="text-white border-white" />
              <Label htmlFor="medium">Medium</Label>
            </div>
            <div className="flex items-center space-x-2 text-white">
              <RadioGroupItem value="hard" id="hard" className="text-white border-white" />
              <Label htmlFor="hard">Hard</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="mt-3 bg-blue-600 text-white hover:bg-indigo-700">
          Submit
        </Button>
      </form>
    </div>
  );
};

export default Form;