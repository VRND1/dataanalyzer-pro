import React from 'react';

const About: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">About DataAnalyzer Pro</h1>
      <div className="prose max-w-none">
        <p className="text-lg mb-4">
          DataAnalyzer Pro is a powerful data analysis platform that helps businesses and individuals make sense of their data through advanced analytics and visualization tools.
        </p>
        <p className="text-lg mb-4">
          Our mission is to democratize data analysis by providing intuitive tools that make complex data analysis accessible to everyone, regardless of their technical background.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Our Vision</h2>
            <p>
              To be the leading platform for data analysis, making advanced analytics accessible to everyone while maintaining the highest standards of accuracy and reliability.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Our Values</h2>
            <ul className="list-disc pl-5">
              <li>Innovation in data analysis</li>
              <li>User-friendly solutions</li>
              <li>Data security and privacy</li>
              <li>Continuous improvement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 