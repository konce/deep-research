export default function Home() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Start Your Research
        </h2>
        <p className="text-gray-600">
          Enter a research query and let the AI agent conduct comprehensive research for you
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
              Research Query
            </label>
            <textarea
              id="query"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="What would you like to research? e.g., What are the latest developments in quantum computing?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                Max Budget ($)
              </label>
              <input
                type="number"
                id="budget"
                step="0.5"
                defaultValue="3.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="depth" className="block text-sm font-medium text-gray-700 mb-2">
                Search Depth
              </label>
              <select
                id="depth"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="basic">Basic</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            Start Research
          </button>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. AI agent analyzes your query and plans the research strategy</li>
          <li>2. Searches the web and gathers information from multiple sources</li>
          <li>3. Performs deep analysis and synthesis of findings</li>
          <li>4. Generates a comprehensive Markdown report with citations</li>
        </ul>
      </div>
    </div>
  );
}
