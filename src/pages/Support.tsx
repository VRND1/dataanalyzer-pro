import { Mail, MessageCircle, Phone, Clock, ExternalLink, ChevronRight } from 'lucide-react';

export function Support() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Support Center</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get help with your data analysis needs. Our support team is here to assist you with any questions or issues.
        </p>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Email Support</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Send us an email and we'll get back to you within 24 hours.
          </p>
          <a
            href="mailto:support@dataanalyzerpro.com"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            support@dataanalyzerpro.com
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Live Chat</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Chat with our support team in real-time during business hours.
          </p>
          <button className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium">
            Start Chat
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Phone className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Phone Support</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Call us directly for urgent issues (Premium plans only).
          </p>
          <a
            href="tel:+1-800-DATA-ANALYZER"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            +1-800-DATA-ANALYZER
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Business Hours</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-600">24/7 - We'll respond within 24 hours</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Live Chat & Phone</h3>
            <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
          </div>
        </div>
      </div>

      {/* Common Issues */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Common Issues</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium text-gray-900">File Upload Issues</h3>
            <p className="text-gray-600 text-sm">
              Make sure your file is in CSV or Excel format and under 10MB. Check that the file isn't corrupted.
            </p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium text-gray-900">Analysis Not Working</h3>
            <p className="text-gray-600 text-sm">
              Ensure your data has the required columns and is properly formatted. Try with a smaller dataset first.
            </p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-medium text-gray-900">Account Access</h3>
            <p className="text-gray-600 text-sm">
              If you can't access your account, try resetting your password or contact us for account recovery.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/help"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <ExternalLink className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Help Documentation</h3>
              <p className="text-sm text-gray-600">Browse our comprehensive help guides</p>
            </div>
          </a>
          <a
            href="/tutorials"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <ExternalLink className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Video Tutorials</h3>
              <p className="text-sm text-gray-600">Watch step-by-step tutorials</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
} 