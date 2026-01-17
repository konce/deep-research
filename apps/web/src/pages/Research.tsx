import { useParams } from 'react-router-dom';

export default function Research() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Research in Progress
      </h2>
      <p className="text-gray-600">Session ID: {id}</p>
      <div className="mt-6 bg-white shadow-sm rounded-lg p-6">
        <p className="text-gray-500">Research progress will be displayed here...</p>
      </div>
    </div>
  );
}
