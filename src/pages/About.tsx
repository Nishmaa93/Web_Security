import React from 'react';
import { BookOpen, Code, Users, Shield, Rocket, Globe } from 'lucide-react';

export default function About() {
  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Knowledge Sharing",
      description: "Share your technical insights, tutorials, and experiences with developers worldwide."
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: "Technical Excellence",
      description: "Focus on high-quality technical content across programming languages and frameworks."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Driven",
      description: "Built by developers, for developers. Join a community that values knowledge sharing."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Platform",
      description: "Enhanced security with 2FA, email verification, and robust authentication."
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Modern Tech Stack",
      description: "Built with React, TypeScript, and modern web technologies for optimal performance."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Reach",
      description: "Connect with developers from around the world and share your knowledge globally."
    }
  ];

  return (
    <main className="pt-32 pb-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            About Code & Compass
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your premier destination for developer insights, technical tutorials, and programming knowledge.
            We're building a community where developers can learn, share, and grow together.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-white/80 backdrop-blur-sm py-16 mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Code & Compass was founded with a clear mission: to create a space where developers
                can share their knowledge, experiences, and insights with the global tech community.
              </p>
              <p className="text-lg text-gray-600">
                We believe that knowledge sharing is the cornerstone of professional growth in the
                tech industry. Through our platform, we aim to make high-quality technical content
                accessible to developers at all stages of their careers.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transform rotate-3 rounded-2xl"></div>
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c"
                alt="Team collaboration"
                className="relative rounded-2xl shadow-lg transform -rotate-3 transition-transform hover:rotate-0 duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          What Makes Us Different
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="text-purple-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Join Us Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Join Our Growing Community
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Be part of a community that values knowledge sharing, technical excellence,
            and professional growth.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/register"
              className="px-8 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105"
            >
              Get Started
            </a>
            <a
              href="/blogs"
              className="px-8 py-3 bg-transparent border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-200"
            >
              Explore Content
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}