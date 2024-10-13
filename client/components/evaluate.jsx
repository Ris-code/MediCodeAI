import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, BookOpen, Award } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ProgressBar = ({ value, label }) => (
  <div className="w-full">
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-sm font-medium text-gray-700">{(value * 100).toFixed(0)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${value * 100}%` }}
      ></div>
    </div>
  </div>
);

const EvaluationOutput = ({ data }) => {
  const { quantitative_scores, qualitative_analysis, performance_metrics, educational_feedback } = data;

  const scoreData = Object.entries(quantitative_scores).map(([key, value]) => ({
    name: key.replace('_', ' '),
    score: value * 100
  }));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* <h1 className="text-3xl font-bold mb-6">Evaluation Results</h1> */}

      <Tabs defaultValue="quantitative" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black text-white">
          {['quantitative', 'performance', 'qualitative', 'educational'].map((tab) => (
            <TabsTrigger 
              key={tab} 
              value={tab}
              className="px-4 py-2 text-sm font-medium transition-colors duration-150 ease-in-out
                         data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="quantitative">
          <Card>
            <CardHeader>
              <CardTitle>Quantitative Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-4">
                {Object.entries(quantitative_scores).map(([key, value]) => (
                  <ProgressBar key={key} label={key.replace('_', ' ')} value={value} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(performance_metrics).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">{key.replace('_', ' ')}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qualitative">
          <Card>
            <CardHeader>
              <CardTitle>Qualitative Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {qualitative_analysis.areas_for_improvement.length > 0 && (
                <Alert variant="warning" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Areas for Improvement</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5">
                      {qualitative_analysis.areas_for_improvement.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              {qualitative_analysis.strengths.length > 0 && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Strengths</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5">
                      {qualitative_analysis.strengths.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="educational">
          <Card>
            <CardHeader>
              <CardTitle>Educational Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Recommended Resources:</h3>
                  <ul className="list-disc pl-5">
                    {educational_feedback.recommended_resources.map((resource, index) => (
                      <li key={index}>{resource}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Clinical Pearls:</h3>
                  <ul className="list-disc pl-5">
                    {educational_feedback.clinical_pearls.map((pearl, index) => (
                      <li key={index}>{pearl}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EvaluationOutput;