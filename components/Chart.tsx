import React from 'react';

interface ChartProps {
  imageUrl: string;
}

const Chart: React.FC<ChartProps> = ({ imageUrl }) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Chart</h2>
      {imageUrl ? (
        <img src={imageUrl} alt="Data visualization" className="max-w-full h-auto" />
      ) : (
        <p>Waiting for chart data...</p>
      )}
    </div>
  );
};

export default Chart;

