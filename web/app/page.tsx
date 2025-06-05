"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  TrendingUp,
  Filter,
  User,
  Sparkles,
  Brain,
  BarChart3,
  Zap,
  ArrowRight,
  Star,
} from "lucide-react";
export default async function DataGuruHomepage() {
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-white">

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-100/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            <Badge className="bg-yellow-100 text-black border-yellow-300 mb-6 px-4 py-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Data Science Platform
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-black mb-6 leading-tight">
              Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600">
                Data Science
              </span>{" "}
              Journey Starts Here
            </h1>

            <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
              Unlock the power of AI with our comprehensive platform featuring
              intelligent chatbot assistance, cutting-edge trend analysis, and
              personalized learning experiences.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/chat">
                <Button className="bg-black text-white hover:bg-gray-800 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/chat">
                <Button
                  variant="outline"
                  className="border-2 border-yellow-400 text-black hover:bg-yellow-50 px-8 py-6 text-lg font-semibold rounded-xl"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Try Chatbot
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to excel in data science, powered by
              cutting-edge AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Chatbot Feature */}
            <Card className="border-2 border-yellow-200 hover:border-yellow-400 transition-all duration-300 hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-black" />
                </div>
                <CardTitle className="text-xl font-bold text-black">
                  AI Chatbot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Get instant help with data science concepts, code debugging,
                  and project guidance from our intelligent AI assistant.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Trends Feature */}
            <Card className="border-2 border-yellow-200 hover:border-yellow-400 transition-all duration-300 hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-black" />
                </div>
                <CardTitle className="text-xl font-bold text-black">
                  Latest Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Stay updated with the latest AI news, research papers, and
                  industry developments in data science.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Filters Feature */}
            <Card className="border-2 border-yellow-200 hover:border-yellow-400 transition-all duration-300 hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-black" />
                </div>
                <CardTitle className="text-xl font-bold text-black">
                  Smart Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Filter content by AI, Data Science, Machine Learning, and Deep
                  Learning to find exactly what you need.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Profile Feature */}
            <Card className="border-2 border-yellow-200 hover:border-yellow-400 transition-all duration-300 hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-black" />
                </div>
                <CardTitle className="text-xl font-bold text-black">
                  Personal Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Track your learning progress, save favorite articles, and
                  customize your data science journey.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Chatbot Section */}
          <div id="chatbot" className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="bg-yellow-100 text-black border-yellow-300 mb-4">
                  <Zap className="w-4 h-4 mr-2" />
                  AI-Powered Assistant
                </Badge>
                <h3 className="text-4xl font-bold text-black mb-6">
                  Smart Chatbot for Data Science
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Our advanced AI chatbot is your personal data science mentor,
                  available 24/7 to help you tackle complex problems, understand
                  algorithms, and accelerate your learning journey.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-700">
                    <Star className="w-5 h-5 text-yellow-500 mr-3" />
                    Instant answers to data science questions
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Star className="w-5 h-5 text-yellow-500 mr-3" />
                    Code debugging and optimization tips
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Star className="w-5 h-5 text-yellow-500 mr-3" />
                    Project guidance and best practices
                  </li>
                </ul>
                <Link href="/chat">
                  <Button className="bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-xl">
                    Start Chatting
                    <MessageSquare className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-8 border-2 border-yellow-300">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                      <Brain className="w-4 h-4 text-black" />
                    </div>
                    <span className="font-semibold text-black">
                      AI Assistant
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">
                    How can I help you with your data science project today?
                  </p>
                  <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600">
                    &quot;Explain the difference between supervised and unsupervised learning&quot;
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trends Section */}
          <div id="trends" className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-8 border-2 border-yellow-300">
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <Badge className="bg-blue-100 text-blue-800 mb-2">
                        AI
                      </Badge>
                      <h4 className="font-semibold text-black mb-2">
                        Latest GPT Advancements
                      </h4>
                      <p className="text-sm text-gray-600">
                        Breakthrough in natural language processing...
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <Badge className="bg-green-100 text-green-800 mb-2">
                        ML
                      </Badge>
                      <h4 className="font-semibold text-black mb-2">
                        AutoML Revolution
                      </h4>
                      <p className="text-sm text-gray-600">
                        Automated machine learning tools...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <Badge className="bg-yellow-100 text-black border-yellow-300 mb-4">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Stay Informed
                </Badge>
                <h3 className="text-4xl font-bold text-black mb-6">
                  Latest AI & Data Science Trends
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Keep pace with the rapidly evolving world of AI and data
                  science. Our curated trend analysis brings you the most
                  important developments, research breakthroughs, and industry
                  insights.
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  <Badge
                    variant="outline"
                    className="border-yellow-400 text-black"
                  >
                    AI
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-yellow-400 text-black"
                  >
                    Data Science
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-yellow-400 text-black"
                  >
                    Machine Learning
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-yellow-400 text-black"
                  >
                    Deep Learning
                  </Badge>
                </div>
                <Button className="bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-xl">
                  Explore Trends
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-yellow-100 via-yellow-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-black mb-6">
            Ready to Transform Your Data Science Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join thousands of data scientists who are already using Data Guru to
            accelerate their learning and stay ahead of the curve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-black text-white hover:bg-gray-800 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg">
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <a href="/#features">
              <Button
                variant="outline"
                className="border-2 border-yellow-400 text-black hover:bg-yellow-50 px-8 py-4 text-lg font-semibold rounded-xl"
              >
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

